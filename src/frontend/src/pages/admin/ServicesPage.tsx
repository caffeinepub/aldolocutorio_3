import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  EyeOff,
  Filter,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import type {
  PaginatedServices,
  Service,
  ServiceFaq,
  ServiceFilter,
  ServiceInput,
  ServiceProcessStep,
  ServiceUpdate,
} from "../../backend";
import {
  SENTINEL_ALL,
  SafeSelect,
  convertSentinelToNull,
} from "../../components/SafeSelect";
import { useActor } from "../../hooks/useActor";
import { safeConvertToNumber } from "../../utils/NumericConverter";

// ─── Constants ────────────────────────────────────────────────────────────────

const PROCESS_STEPS_LABELS = [
  "Descubrimiento",
  "Diseño",
  "Construcción",
  "Pruebas",
  "Lanzamiento",
  "Soporte",
];

// ─── Types ────────────────────────────────────────────────────────────────────

type FormState = {
  title: string;
  shortDescription: string;
  fullDescription: string;
  targetAudience: string;
  displayOrder: string;
  isVisible: boolean;
  useCases: string[];
  processSteps: { step: string; description: string }[];
  faqs: { question: string; answer: string }[];
};

const EMPTY_FORM: FormState = {
  title: "",
  shortDescription: "",
  fullDescription: "",
  targetAudience: "",
  displayOrder: "0",
  isVisible: true,
  useCases: [""],
  processSteps: PROCESS_STEPS_LABELS.map((label) => ({
    step: label,
    description: "",
  })),
  faqs: [{ question: "", answer: "" }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function compressToWebP(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const max = 1200;
      let { width, height } = img;
      if (width > max || height > max) {
        if (width > height) {
          height = Math.round((height * max) / width);
          width = max;
        } else {
          width = Math.round((width * max) / height);
          height = max;
        }
      }
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url);
          if (blob)
            resolve(
              new File([blob], file.name.replace(/\.[^.]+$/, ".webp"), {
                type: "image/webp",
              }),
            );
          else resolve(file);
        },
        "image/webp",
        0.85,
      );
    };
    img.src = url;
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ServicesPage() {
  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();

  // ─── Pagination & Filter State ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState(SENTINEL_ALL);

  // ─── Selection State ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Modal State ──────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [iconBlob, setIconBlob] = useState<ExternalBlob | null>(null);
  const [iconPreview, setIconPreview] = useState("");
  const [iconUploading, setIconUploading] = useState(false);
  const iconInputRef = useRef<HTMLInputElement>(null);

  // ─── Delete State ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const buildFilter = (): ServiceFilter | null => {
    const vis = convertSentinelToNull(visibilityFilter);
    const hasFilter = vis !== null || searchText.trim();
    if (!hasFilter) return null;
    return {
      isVisible: vis !== null ? vis === "visible" : undefined,
      search: searchText.trim() ? searchText.trim() : undefined,
    };
  };

  const servicesQuery = useQuery<PaginatedServices>({
    queryKey: ["services", page, pageSize, visibilityFilter, searchText],
    queryFn: async () => {
      if (!actor) return { items: [], total: BigInt(0) };
      const filter = buildFilter();
      return actor.getServices(BigInt(page), BigInt(pageSize), filter);
    },
    enabled: !!actor && !actorLoading,
    placeholderData: keepPreviousData,
  });

  // ─── Mutations ────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["services"] });

  const createMutation = useMutation({
    mutationFn: async (input: ServiceInput) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.createService(input);
    },
    onSuccess: () => {
      toast.success("Servicio creado");
      setModalOpen(false);
      invalidate();
    },
    onError: () => toast.error("Error al crear el servicio"),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: ServiceUpdate) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateService(input);
    },
    onSuccess: () => {
      toast.success("Servicio actualizado");
      setModalOpen(false);
      invalidate();
    },
    onError: () => toast.error("Error al actualizar el servicio"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteService(id);
    },
    onSuccess: () => {
      toast.success("Servicio eliminado");
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error("Error al eliminar el servicio"),
  });

  const bulkVisibilityMutation = useMutation({
    mutationFn: async ({
      ids,
      isVisible,
    }: {
      ids: bigint[];
      isVisible: boolean;
    }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.bulkUpdateServiceVisibility(ids, isVisible);
    },
    onSuccess: () => {
      toast.success("Visibilidad actualizada");
      setSelectedIds(new Set());
      invalidate();
    },
    onError: () => toast.error("Error al actualizar visibilidad"),
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: bigint[]) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.bulkDeleteServices(ids);
    },
    onSuccess: () => {
      toast.success("Servicios eliminados");
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      invalidate();
    },
    onError: () => toast.error("Error al eliminar servicios"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: bigint[]) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.reorderServices(ids);
    },
    onSuccess: () => {
      toast.success("Orden actualizado");
      invalidate();
    },
    onError: () => toast.error("Error al actualizar el orden"),
  });

  // ─── Icon Upload ──────────────────────────────────────────────────────────

  const handleIconSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 5MB");
      return;
    }
    setIconUploading(true);
    try {
      const compressed = await compressToWebP(file);
      const preview = URL.createObjectURL(compressed);
      setIconPreview(preview);
      const bytes = new Uint8Array(await compressed.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      setIconBlob(blob);
    } catch {
      toast.error("Error al procesar la imagen");
    } finally {
      setIconUploading(false);
    }
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingService(null);
    setForm(EMPTY_FORM);
    setIconBlob(null);
    setIconPreview("");
    setModalOpen(true);
  };

  const openEditModal = (s: Service) => {
    setEditingService(s);
    setForm({
      title: s.title,
      shortDescription: s.shortDescription,
      fullDescription: s.fullDescription,
      targetAudience: s.targetAudience,
      displayOrder: String(s.displayOrder),
      isVisible: s.isVisible,
      useCases: s.useCases.length > 0 ? [...s.useCases] : [""],
      processSteps:
        s.processSteps.length > 0
          ? s.processSteps.map((p) => ({
              step: p.step,
              description: p.description,
            }))
          : PROCESS_STEPS_LABELS.map((label) => ({
              step: label,
              description: "",
            })),
      faqs:
        s.faqs.length > 0
          ? s.faqs.map((f) => ({ question: f.question, answer: f.answer }))
          : [{ question: "", answer: "" }],
    });
    if (s.icon) {
      setIconPreview(s.icon.directURL ?? "");
    } else {
      setIconPreview("");
    }
    setIconBlob(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error("El título es requerido");
      return;
    }

    let iconField: ExternalBlob | undefined;
    if (iconBlob) {
      iconField = iconBlob;
    } else if (editingService?.icon && iconPreview) {
      iconField = editingService.icon;
    } else {
      iconField = undefined;
    }

    const processSteps: ServiceProcessStep[] = form.processSteps
      .filter((s) => s.description.trim())
      .map((s) => ({ step: s.step, description: s.description }));

    const useCases = form.useCases.filter((u) => u.trim());
    const faqs: ServiceFaq[] = form.faqs.filter(
      (f) => f.question.trim() && f.answer.trim(),
    );

    if (editingService) {
      updateMutation.mutate({
        id: editingService.id,
        title: form.title,
        icon: iconField,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        useCases,
        processSteps,
        targetAudience: form.targetAudience,
        faqs,
        displayOrder: BigInt(safeConvertToNumber(form.displayOrder) ?? 0),
        isVisible: form.isVisible,
      });
    } else {
      createMutation.mutate({
        title: form.title,
        icon: iconField,
        shortDescription: form.shortDescription,
        fullDescription: form.fullDescription,
        useCases,
        processSteps,
        targetAudience: form.targetAudience,
        faqs,
        displayOrder: BigInt(safeConvertToNumber(form.displayOrder) ?? 0),
        isVisible: form.isVisible,
      });
    }
  };

  // ─── Reorder helpers ──────────────────────────────────────────────────────

  const handleMoveUp = (index: number) => {
    const items = servicesQuery.data?.items ?? [];
    if (index <= 0) return;
    const arr = [...items];
    const [removed] = arr.splice(index, 1);
    arr.splice(index - 1, 0, removed);
    reorderMutation.mutate(arr.map((s) => s.id));
  };

  // ─── Selection ────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const items = servicesQuery.data?.items ?? [];
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((s) => String(s.id))));
    }
  };

  const selectedBigInts = Array.from(selectedIds).map((id) => BigInt(id));

  // ─── Inline visibility toggle ─────────────────────────────────────────────

  const handleVisibilityToggle = (s: Service) => {
    updateMutation.mutate({
      id: s.id,
      title: s.title,
      icon: s.icon,
      shortDescription: s.shortDescription,
      fullDescription: s.fullDescription,
      useCases: s.useCases,
      processSteps: s.processSteps,
      targetAudience: s.targetAudience,
      faqs: s.faqs,
      displayOrder: s.displayOrder,
      isVisible: !s.isVisible,
    });
  };

  // ─── Pagination ───────────────────────────────────────────────────────────

  const total = Number(servicesQuery.data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const items = servicesQuery.data?.items ?? [];

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    bulkVisibilityMutation.isPending ||
    bulkDeleteMutation.isPending;

  const clearFilters = () => {
    setSearchText("");
    setVisibilityFilter(SENTINEL_ALL);
    setPage(1);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Servicios</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Filtros"
            data-ocid="services.filter.toggle"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter size={16} />
          </Button>
          <Button
            size="icon"
            title="Agregar Servicio"
            data-ocid="services.add.open_modal_button"
            onClick={openAddModal}
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="border rounded-lg p-4 mb-6 bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-1 block text-sm">Buscar</Label>
              <Input
                placeholder="Buscar por título o descripción..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                data-ocid="services.search.input"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Visibilidad</Label>
              <SafeSelect
                value={visibilityFilter}
                onValueChange={(v) => {
                  setVisibilityFilter(v);
                  setPage(1);
                }}
                options={[
                  { value: SENTINEL_ALL, label: "Todos" },
                  { value: "visible", label: "Visibles" },
                  { value: "hidden", label: "Ocultos" },
                ]}
                data-ocid="services.visibility.select"
              />
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              bulkVisibilityMutation.mutate({
                ids: selectedBigInts,
                isVisible: true,
              })
            }
            disabled={isMutating}
          >
            <Eye size={14} className="mr-1" /> Mostrar seleccionados
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              bulkVisibilityMutation.mutate({
                ids: selectedBigInts,
                isVisible: false,
              })
            }
            disabled={isMutating}
          >
            <EyeOff size={14} className="mr-1" /> Ocultar seleccionados
          </Button>
          <Button
            variant="destructive"
            size="sm"
            data-ocid="services.bulk.delete_button"
            onClick={() => setBulkDeleteOpen(true)}
            disabled={isMutating}
          >
            <Trash2 size={14} className="mr-1" /> Eliminar seleccionados
          </Button>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block">
        <div className="border rounded-lg overflow-hidden">
          <Table data-ocid="services.table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={
                      items.length > 0 && selectedIds.size === items.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead className="w-16">Orden</TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead className="w-24">Visible</TableHead>
                <TableHead className="w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servicesQuery.isLoading ? (
                Array.from({ length: 5 }, (_, i) => `sk-${i}`).map((sk) => (
                  <TableRow key={sk} data-ocid="services.loading_state">
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-40" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-56" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-10" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                  </TableRow>
                ))
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="services.empty_state"
                  >
                    No hay servicios. ¡Agrega el primero!
                  </TableCell>
                </TableRow>
              ) : (
                items.map((s, index) => (
                  <TableRow
                    key={String(s.id)}
                    data-ocid={`services.item.${index + 1}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(String(s.id))}
                        onCheckedChange={() => toggleSelect(String(s.id))}
                      />
                    </TableCell>
                    <TableCell>
                      <button
                        type="button"
                        className="hover:text-primary disabled:opacity-30"
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0 || reorderMutation.isPending}
                        data-ocid={`services.item.drag_handle.${index + 1}`}
                      >
                        <GripVertical size={14} />
                      </button>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{s.title}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {s.shortDescription}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={s.isVisible}
                        onCheckedChange={() => handleVisibilityToggle(s)}
                        data-ocid={`services.item.visible.switch.${index + 1}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditModal(s)}
                          data-ocid={`services.item.edit_button.${index + 1}`}
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(s.id)}
                          data-ocid={`services.item.delete_button.${index + 1}`}
                        >
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {servicesQuery.isLoading ? (
          Array.from({ length: 3 }, (_, i) => `msk-${i}`).map((sk) => (
            <div key={sk} className="border rounded-lg p-4">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-56 mb-1" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground border rounded-lg"
            data-ocid="services.empty_state"
          >
            No hay servicios. ¡Agrega el primero!
          </div>
        ) : (
          items.map((s, index) => (
            <div
              key={String(s.id)}
              className="border rounded-lg p-4 bg-card"
              data-ocid={`services.item.${index + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical
                    size={16}
                    className="text-muted-foreground cursor-grab"
                    data-ocid={`services.item.drag_handle.${index + 1}`}
                  />
                  <div>
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {s.shortDescription}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditModal(s)}
                    data-ocid={`services.item.edit_button.${index + 1}`}
                  >
                    <Edit2 size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(s.id)}
                    data-ocid={`services.item.delete_button.${index + 1}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant={s.isVisible ? "default" : "secondary"}>
                  {s.isVisible ? "Visible" : "Oculto"}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Mostrando {startItem}–{endItem} de {total} servicios
            </span>
            <SafeSelect
              value={String(pageSize)}
              onValueChange={(v) => {
                setPageSize(safeConvertToNumber(v) ?? 10);
                setPage(1);
              }}
              options={[
                { value: "10", label: "10 / página" },
                { value: "25", label: "25 / página" },
                { value: "50", label: "50 / página" },
              ]}
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              data-ocid="services.pagination_prev"
            >
              <ChevronLeft size={14} />
            </Button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 7) {
                pageNum = i + 1;
              } else if (page <= 4) {
                pageNum = i + 1;
              } else if (page >= totalPages - 3) {
                pageNum = totalPages - 6 + i;
              } else {
                pageNum = page - 3 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={page === pageNum ? "default" : "outline"}
                  size="sm"
                  className="min-w-8"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              data-ocid="services.pagination_next"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-3xl max-h-[90vh] overflow-y-auto"
          data-ocid="services.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editingService ? "Editar Servicio" : "Agregar Servicio"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-2">
            <TabsList className="grid grid-cols-3 sm:grid-cols-6 w-full mb-4">
              <TabsTrigger value="basic" data-ocid="services.modal.basic.tab">
                Info
              </TabsTrigger>
              <TabsTrigger value="desc" data-ocid="services.modal.desc.tab">
                Descripción
              </TabsTrigger>
              <TabsTrigger
                value="usecases"
                data-ocid="services.modal.usecases.tab"
              >
                Casos
              </TabsTrigger>
              <TabsTrigger
                value="process"
                data-ocid="services.modal.process.tab"
              >
                Proceso
              </TabsTrigger>
              <TabsTrigger
                value="audience"
                data-ocid="services.modal.audience.tab"
              >
                Audiencia
              </TabsTrigger>
              <TabsTrigger value="faqs" data-ocid="services.modal.faqs.tab">
                FAQs
              </TabsTrigger>
            </TabsList>

            {/* Basic Info */}
            <TabsContent value="basic" className="space-y-4">
              <div>
                <Label htmlFor="title" className="mb-1 block">
                  Título <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Nombre del servicio"
                  data-ocid="services.title.input"
                />
              </div>

              {/* Icon Upload */}
              <div>
                <Label className="mb-1 block">Icono (opcional)</Label>
                <div className="flex items-center gap-4">
                  {iconPreview ? (
                    <div className="relative">
                      <img
                        src={iconPreview}
                        alt="Preview"
                        className="h-16 w-16 rounded-lg object-cover border"
                      />
                      <button
                        type="button"
                        className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        onClick={() => {
                          setIconPreview("");
                          setIconBlob(null);
                        }}
                      >
                        <X size={10} />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border-2 border-dashed flex items-center justify-center text-muted-foreground">
                      <ImageIcon size={20} />
                    </div>
                  )}
                  <div>
                    <input
                      ref={iconInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleIconSelect(file);
                        e.target.value = "";
                      }}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => iconInputRef.current?.click()}
                      disabled={iconUploading}
                      data-ocid="services.icon.upload_button"
                    >
                      {iconUploading ? (
                        <Loader2 size={14} className="mr-1 animate-spin" />
                      ) : null}
                      {iconUploading ? "Procesando..." : "Subir icono"}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WebP, GIF · máx. 5MB
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Switch
                  id="isVisible"
                  checked={form.isVisible}
                  onCheckedChange={(v) =>
                    setForm((prev) => ({ ...prev, isVisible: v }))
                  }
                  data-ocid="services.visible.switch"
                />
                <Label htmlFor="isVisible">Visible en el sitio público</Label>
              </div>

              <div>
                <Label htmlFor="displayOrder" className="mb-1 block">
                  Orden de visualización
                </Label>
                <Input
                  id="displayOrder"
                  type="number"
                  min={0}
                  value={form.displayOrder}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      displayOrder: e.target.value,
                    }))
                  }
                  className="w-28"
                  data-ocid="services.display_order.input"
                />
              </div>
            </TabsContent>

            {/* Descripción */}
            <TabsContent value="desc" className="space-y-4">
              <div>
                <Label htmlFor="shortDesc" className="mb-1 block">
                  Descripción corta
                </Label>
                <Textarea
                  id="shortDesc"
                  placeholder="Una línea descriptiva para tarjetas..."
                  value={form.shortDescription}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      shortDescription: e.target.value,
                    }))
                  }
                  rows={2}
                  data-ocid="services.short_description.textarea"
                />
              </div>
              <div>
                <Label htmlFor="fullDesc" className="mb-1 block">
                  Descripción completa
                </Label>
                <Textarea
                  id="fullDesc"
                  placeholder="Descripción detallada del servicio..."
                  value={form.fullDescription}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      fullDescription: e.target.value,
                    }))
                  }
                  rows={8}
                  data-ocid="services.full_description.textarea"
                />
              </div>
            </TabsContent>

            {/* Casos de Uso */}
            <TabsContent value="usecases" className="space-y-3">
              <Label className="block">Casos de uso</Label>
              {form.useCases.map((uc, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: dynamic form list
                <div key={i} className="flex gap-2">
                  <Input
                    value={uc}
                    onChange={(e) => {
                      const next = [...form.useCases];
                      next[i] = e.target.value;
                      setForm((prev) => ({ ...prev, useCases: next }));
                    }}
                    placeholder={`Caso de uso ${i + 1}`}
                    data-ocid={`services.use_case.input.${i + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      const next = form.useCases.filter((_, idx) => idx !== i);
                      setForm((prev) => ({
                        ...prev,
                        useCases: next.length > 0 ? next : [""],
                      }));
                    }}
                    disabled={form.useCases.length <= 1}
                    data-ocid={`services.use_case.delete_button.${i + 1}`}
                  >
                    <X size={14} />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    useCases: [...prev.useCases, ""],
                  }))
                }
                data-ocid="services.use_case.add_button"
              >
                <Plus size={14} className="mr-1" /> Agregar caso de uso
              </Button>
            </TabsContent>

            {/* Proceso */}
            <TabsContent value="process" className="space-y-4">
              <Label className="block">Pasos del proceso</Label>
              {form.processSteps.map((step, i) => (
                <div key={step.step} className="space-y-1">
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    {step.step}
                  </Label>
                  <Textarea
                    value={step.description}
                    onChange={(e) => {
                      const next = form.processSteps.map((s, idx) =>
                        idx === i ? { ...s, description: e.target.value } : s,
                      );
                      setForm((prev) => ({ ...prev, processSteps: next }));
                    }}
                    placeholder={`Describe la etapa de ${step.step.toLowerCase()}...`}
                    rows={2}
                    data-ocid={`services.process_step.textarea.${i + 1}`}
                  />
                </div>
              ))}
            </TabsContent>

            {/* Audiencia */}
            <TabsContent value="audience" className="space-y-4">
              <div>
                <Label htmlFor="targetAudience" className="mb-1 block">
                  ¿Para quién es este servicio?
                </Label>
                <Textarea
                  id="targetAudience"
                  placeholder="Describe la audiencia objetivo..."
                  value={form.targetAudience}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      targetAudience: e.target.value,
                    }))
                  }
                  rows={6}
                  data-ocid="services.target_audience.textarea"
                />
              </div>
            </TabsContent>

            {/* FAQs */}
            <TabsContent value="faqs" className="space-y-4">
              <Label className="block">Preguntas frecuentes</Label>
              {form.faqs.map((faq, i) => (
                <div
                  key={`faq-${i}-${faq.question.slice(0, 10)}`}
                  className="border rounded-lg p-4 space-y-3 relative"
                >
                  <button
                    type="button"
                    className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      const next = form.faqs.filter((_, idx) => idx !== i);
                      setForm((prev) => ({
                        ...prev,
                        faqs:
                          next.length > 0
                            ? next
                            : [{ question: "", answer: "" }],
                      }));
                    }}
                    disabled={form.faqs.length <= 1}
                    data-ocid={`services.faq.delete_button.${i + 1}`}
                  >
                    <X size={14} />
                  </button>
                  <div>
                    <Label className="mb-1 block text-sm">Pregunta</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const next = form.faqs.map((f, idx) =>
                          idx === i ? { ...f, question: e.target.value } : f,
                        );
                        setForm((prev) => ({ ...prev, faqs: next }));
                      }}
                      placeholder={`Pregunta ${i + 1}`}
                      data-ocid={`services.faq.question.input.${i + 1}`}
                    />
                  </div>
                  <div>
                    <Label className="mb-1 block text-sm">Respuesta</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const next = form.faqs.map((f, idx) =>
                          idx === i ? { ...f, answer: e.target.value } : f,
                        );
                        setForm((prev) => ({ ...prev, faqs: next }));
                      }}
                      placeholder="Respuesta..."
                      rows={3}
                      data-ocid={`services.faq.answer.textarea.${i + 1}`}
                    />
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    faqs: [...prev.faqs, { question: "", answer: "" }],
                  }))
                }
                data-ocid="services.faq.add_button"
              >
                <Plus size={14} className="mr-1" /> Agregar FAQ
              </Button>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="services.modal.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isMutating}
              data-ocid="services.modal.submit_button"
            >
              {isMutating ? (
                <Loader2 size={14} className="mr-1 animate-spin" />
              ) : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="services.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="services.delete.cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget !== null && deleteMutation.mutate(deleteTarget)
              }
              data-ocid="services.delete.confirm_button"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.size} servicios?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(selectedBigInts)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
