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
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../../backend";
import {
  SENTINEL_ALL,
  SENTINEL_NONE,
  SafeSelect,
  convertSentinelToNull,
} from "../../components/SafeSelect";
import { useActor } from "../../hooks/useActor";
import {
  safeConvertToNumber,
  validateRating,
} from "../../utils/NumericConverter";

// ─── Types ────────────────────────────────────────────────────────────────────

import type {
  PaginatedTestimonials,
  Testimonial,
  TestimonialFilter,
  TestimonialInput,
  TestimonialUpdate,
} from "../../backend";

type FormState = {
  quote: string;
  authorName: string;
  jobTitle: string;
  companyName: string;
  rating: number;
  displayOrder: string;
  isVisible: boolean;
  linkedPortfolioId: string;
};

const EMPTY_FORM: FormState = {
  quote: "",
  authorName: "",
  jobTitle: "",
  companyName: "",
  rating: 5,
  displayOrder: "0",
  isVisible: true,
  linkedPortfolioId: SENTINEL_NONE,
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

function StarRating({
  value,
  onChange,
  readonly = false,
  size = 16,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
  size?: number;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5" data-ocid="testimonials.rating.input">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`cursor-pointer transition-colors ${
            (readonly ? value : hovered || value) >= star
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground"
          } ${readonly ? "cursor-default" : ""}`}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TestimonialsPage() {
  const { actor, isFetching: actorLoading } = useActor();
  const queryClient = useQueryClient();

  // ─── Pagination & Filter State ────────────────────────────────────────────
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [visibilityFilter, setVisibilityFilter] = useState(SENTINEL_ALL);
  const [minRatingFilter, setMinRatingFilter] = useState(SENTINEL_ALL);
  const [maxRatingFilter, setMaxRatingFilter] = useState(SENTINEL_ALL);

  // ─── Selection State ──────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ─── Modal State ──────────────────────────────────────────────────────────
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] =
    useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [photoBlob, setPhotoBlob] = useState<ExternalBlob | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // ─── Delete State ─────────────────────────────────────────────────────────
  const [deleteTarget, setDeleteTarget] = useState<bigint | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // ─── Queries ──────────────────────────────────────────────────────────────

  const buildFilter = useCallback((): TestimonialFilter | null => {
    const vis = convertSentinelToNull(visibilityFilter);
    const minR = convertSentinelToNull(minRatingFilter);
    const maxR = convertSentinelToNull(maxRatingFilter);
    const hasFilter =
      vis !== null || minR !== null || maxR !== null || searchText.trim();
    if (!hasFilter) return null;
    return {
      isVisible: vis !== null ? vis === "visible" : undefined,
      minRating: minR !== null ? BigInt(minR) : undefined,
      maxRating: maxR !== null ? BigInt(maxR) : undefined,
      search: searchText.trim() ? searchText.trim() : undefined,
    };
  }, [visibilityFilter, minRatingFilter, maxRatingFilter, searchText]);

  const testimonialsQuery = useQuery<PaginatedTestimonials>({
    queryKey: [
      "testimonials",
      page,
      pageSize,
      visibilityFilter,
      minRatingFilter,
      maxRatingFilter,
      searchText,
    ],
    queryFn: async () => {
      if (!actor) return { items: [], total: BigInt(0) };
      const filter = buildFilter();
      return actor.getTestimonials(BigInt(page), BigInt(pageSize), filter);
    },
    enabled: !!actor && !actorLoading,
    placeholderData: keepPreviousData,
  });

  const portfolioQuery = useQuery({
    queryKey: ["portfolio-for-select"],
    queryFn: async () => {
      if (!actor) return { items: [], total: BigInt(0) };
      return actor.getPortfolioProjects(
        BigInt(1),
        BigInt(100),
        null,
      ) as Promise<{
        items: { id: bigint; title: string }[];
        total: bigint;
      }>;
    },
    enabled: !!actor && !actorLoading,
  });

  const portfolioProjects = portfolioQuery.data?.items ?? [];

  // ─── Mutations ────────────────────────────────────────────────────────────

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["testimonials"] });

  const createMutation = useMutation({
    mutationFn: async (input: TestimonialInput) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.createTestimonial(input);
    },
    onSuccess: () => {
      toast.success("Testimonio creado");
      setModalOpen(false);
      invalidate();
    },
    onError: () => toast.error("Error al crear el testimonio"),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: TestimonialUpdate) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateTestimonial(input);
    },
    onSuccess: () => {
      toast.success("Testimonio actualizado");
      setModalOpen(false);
      invalidate();
    },
    onError: () => toast.error("Error al actualizar el testimonio"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteTestimonial(id);
    },
    onSuccess: () => {
      toast.success("Testimonio eliminado");
      setDeleteTarget(null);
      invalidate();
    },
    onError: () => toast.error("Error al eliminar el testimonio"),
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
      return actor.bulkUpdateTestimonialVisibility(ids, isVisible);
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
      return actor.bulkDeleteTestimonials(ids);
    },
    onSuccess: () => {
      toast.success("Testimonios eliminados");
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      invalidate();
    },
    onError: () => toast.error("Error al eliminar testimonios"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: bigint[]) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.reorderTestimonials(ids);
    },
    onSuccess: () => {
      toast.success("Orden actualizado");
      invalidate();
    },
    onError: () => toast.error("Error al actualizar el orden"),
  });

  // ─── Photo Upload ─────────────────────────────────────────────────────────

  const handlePhotoSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 5MB");
      return;
    }
    setPhotoUploading(true);
    try {
      const compressed = await compressToWebP(file);
      const preview = URL.createObjectURL(compressed);
      setPhotoPreview(preview);
      const bytes = new Uint8Array(await compressed.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes);
      setPhotoBlob(blob);
    } catch {
      toast.error("Error al procesar la imagen");
    } finally {
      setPhotoUploading(false);
    }
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingTestimonial(null);
    setForm(EMPTY_FORM);
    setPhotoBlob(null);
    setPhotoPreview("");
    setModalOpen(true);
  };

  const openEditModal = (t: Testimonial) => {
    setEditingTestimonial(t);
    setForm({
      quote: t.quote,
      authorName: t.authorName,
      jobTitle: t.jobTitle,
      companyName: t.companyName,
      rating: Number(t.rating),
      displayOrder: String(t.displayOrder),
      isVisible: t.isVisible,
      linkedPortfolioId:
        t.linkedPortfolioId !== undefined
          ? String(t.linkedPortfolioId)
          : SENTINEL_NONE,
    });
    // If existing photo, set preview from URL
    if (t.photo) {
      setPhotoPreview(t.photo.directURL ?? "");
    } else {
      setPhotoPreview("");
    }
    setPhotoBlob(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !form.quote.trim() ||
      !form.authorName.trim() ||
      !form.jobTitle.trim() ||
      !form.companyName.trim()
    ) {
      toast.error("Por favor completa todos los campos requeridos");
      return;
    }
    const ratingValidation = validateRating(form.rating);
    if (ratingValidation === null) {
      toast.error("Valoración inválida: debe ser entre 1 y 5");
      return;
    }

    const linkedPortfolioIdNull = convertSentinelToNull(form.linkedPortfolioId);

    // Determine photo: new upload or existing
    let photoField: ExternalBlob | undefined;
    if (photoBlob) {
      photoField = photoBlob;
    } else if (editingTestimonial?.photo && photoPreview) {
      // Keep existing photo reference (as ExternalBlob)
      photoField = editingTestimonial.photo;
    } else {
      photoField = undefined;
    }

    if (editingTestimonial) {
      updateMutation.mutate({
        id: editingTestimonial.id,
        quote: form.quote,
        authorName: form.authorName,
        jobTitle: form.jobTitle,
        companyName: form.companyName,
        photo: photoField,
        linkedPortfolioId:
          linkedPortfolioIdNull !== null
            ? BigInt(linkedPortfolioIdNull)
            : undefined,
        rating: BigInt(form.rating),
        displayOrder: BigInt(safeConvertToNumber(form.displayOrder) ?? 0),
        isVisible: form.isVisible,
      });
    } else {
      createMutation.mutate({
        quote: form.quote,
        authorName: form.authorName,
        jobTitle: form.jobTitle,
        companyName: form.companyName,
        photo: photoField,
        linkedPortfolioId:
          linkedPortfolioIdNull !== null
            ? BigInt(linkedPortfolioIdNull)
            : undefined,
        rating: BigInt(form.rating),
        displayOrder: BigInt(safeConvertToNumber(form.displayOrder) ?? 0),
        isVisible: form.isVisible,
      });
    }
  };

  // ─── Reorder helpers ──────────────────────────────────────────────────────

  const moveItem = (
    items: Testimonial[],
    fromIndex: number,
    toIndex: number,
  ) => {
    const arr = [...items];
    const [removed] = arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, removed);
    return arr;
  };

  const handleMoveUp = (index: number) => {
    const items = testimonialsQuery.data?.items ?? [];
    if (index <= 0) return;
    const reordered = moveItem(items, index, index - 1);
    reorderMutation.mutate(reordered.map((t) => t.id));
  };

  const _handleMoveDown = (index: number) => {
    const items = testimonialsQuery.data?.items ?? [];
    if (index >= items.length - 1) return;
    const reordered = moveItem(items, index, index + 1);
    reorderMutation.mutate(reordered.map((t) => t.id));
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
    const items = testimonialsQuery.data?.items ?? [];
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((t) => String(t.id))));
    }
  };

  const selectedBigInts = Array.from(selectedIds).map((id) => BigInt(id));

  // ─── Inline visibility toggle ─────────────────────────────────────────────

  const handleVisibilityToggle = (t: Testimonial) => {
    updateMutation.mutate({
      id: t.id,
      quote: t.quote,
      authorName: t.authorName,
      jobTitle: t.jobTitle,
      companyName: t.companyName,
      photo: t.photo,
      linkedPortfolioId: t.linkedPortfolioId,
      rating: t.rating,
      displayOrder: t.displayOrder,
      isVisible: !t.isVisible,
    });
  };

  // ─── Pagination ───────────────────────────────────────────────────────────

  const total = Number(testimonialsQuery.data?.total ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);
  const items = testimonialsQuery.data?.items ?? [];

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    bulkVisibilityMutation.isPending ||
    bulkDeleteMutation.isPending;

  // ─── Clear filters ────────────────────────────────────────────────────────

  const clearFilters = () => {
    setSearchText("");
    setVisibilityFilter(SENTINEL_ALL);
    setMinRatingFilter(SENTINEL_ALL);
    setMaxRatingFilter(SENTINEL_ALL);
    setPage(1);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground">Testimonios</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            title="Filtros"
            data-ocid="testimonials.filter.toggle"
            onClick={() => setFilterOpen((v) => !v)}
          >
            <Filter size={16} />
          </Button>
          <Button
            size="icon"
            title="Agregar Testimonio"
            data-ocid="testimonials.add.open_modal_button"
            onClick={openAddModal}
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {filterOpen && (
        <div className="border rounded-lg p-4 mb-6 bg-card space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label className="mb-1 block text-sm">Buscar</Label>
              <Input
                placeholder="Buscar por autor, empresa o testimonio..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setPage(1);
                }}
                data-ocid="testimonials.search.input"
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
                data-ocid="testimonials.visibility.select"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Valoración mínima</Label>
              <SafeSelect
                value={minRatingFilter}
                onValueChange={(v) => {
                  setMinRatingFilter(v);
                  setPage(1);
                }}
                options={[
                  { value: SENTINEL_ALL, label: "Todas" },
                  { value: "1", label: "⭐ 1" },
                  { value: "2", label: "⭐ 2" },
                  { value: "3", label: "⭐ 3" },
                  { value: "4", label: "⭐ 4" },
                  { value: "5", label: "⭐ 5" },
                ]}
                data-ocid="testimonials.rating_min.select"
              />
            </div>
            <div>
              <Label className="mb-1 block text-sm">Valoración máxima</Label>
              <SafeSelect
                value={maxRatingFilter}
                onValueChange={(v) => {
                  setMaxRatingFilter(v);
                  setPage(1);
                }}
                options={[
                  { value: SENTINEL_ALL, label: "Todas" },
                  { value: "1", label: "⭐ 1" },
                  { value: "2", label: "⭐ 2" },
                  { value: "3", label: "⭐ 3" },
                  { value: "4", label: "⭐ 4" },
                  { value: "5", label: "⭐ 5" },
                ]}
                data-ocid="testimonials.rating_max.select"
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
            data-ocid="testimonials.bulk.delete_button"
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
          <Table data-ocid="testimonials.table">
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
                <TableHead>Autor</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Valoración</TableHead>
                <TableHead className="w-24">Visible</TableHead>
                <TableHead className="w-28">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {testimonialsQuery.isLoading ? (
                Array.from({ length: 5 }, (_, i) => `sk-${i}`).map((sk) => (
                  <TableRow key={sk} data-ocid="testimonials.loading_state">
                    <TableCell>
                      <Skeleton className="h-4 w-4" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-8" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
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
                    colSpan={7}
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="testimonials.empty_state"
                  >
                    No hay testimonios. ¡Agrega el primero!
                  </TableCell>
                </TableRow>
              ) : (
                items.map((t, index) => (
                  <TableRow
                    key={String(t.id)}
                    data-ocid={`testimonials.item.${index + 1}`}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(String(t.id))}
                        onCheckedChange={() => toggleSelect(String(t.id))}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          className="hover:text-primary disabled:opacity-30"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0 || reorderMutation.isPending}
                          data-ocid={`testimonials.item.drag_handle.${index + 1}`}
                        >
                          <GripVertical size={14} />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{t.authorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {t.jobTitle}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{t.companyName}</TableCell>
                    <TableCell>
                      <StarRating value={Number(t.rating)} readonly size={14} />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={t.isVisible}
                        onCheckedChange={() => handleVisibilityToggle(t)}
                        data-ocid={`testimonials.item.visible.switch.${index + 1}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditModal(t)}
                          data-ocid={`testimonials.item.edit_button.${index + 1}`}
                        >
                          <Edit2 size={13} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => setDeleteTarget(t.id)}
                          data-ocid={`testimonials.item.delete_button.${index + 1}`}
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
        {testimonialsQuery.isLoading ? (
          Array.from({ length: 3 }, (_, i) => `msk-${i}`).map((sk) => (
            <div key={sk} className="border rounded-lg p-4">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-3 w-24 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div
            className="text-center py-12 text-muted-foreground border rounded-lg"
            data-ocid="testimonials.empty_state"
          >
            No hay testimonios. ¡Agrega el primero!
          </div>
        ) : (
          items.map((t, index) => (
            <div
              key={String(t.id)}
              className="border rounded-lg p-4 bg-card"
              data-ocid={`testimonials.item.${index + 1}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical
                    size={16}
                    className="text-muted-foreground cursor-grab"
                    data-ocid={`testimonials.item.drag_handle.${index + 1}`}
                  />
                  <div>
                    <p className="font-semibold text-sm">{t.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {t.jobTitle} · {t.companyName}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => openEditModal(t)}
                    data-ocid={`testimonials.item.edit_button.${index + 1}`}
                  >
                    <Edit2 size={13} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(t.id)}
                    data-ocid={`testimonials.item.delete_button.${index + 1}`}
                  >
                    <Trash2 size={13} />
                  </Button>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <StarRating value={Number(t.rating)} readonly size={14} />
                <Badge variant={t.isVisible ? "default" : "secondary"}>
                  {t.isVisible ? "Visible" : "Oculto"}
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
              Mostrando {startItem}–{endItem} de {total} testimonios
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
              data-ocid="testimonials.pagination_prev"
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
              data-ocid="testimonials.pagination_next"
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] overflow-y-auto"
          data-ocid="testimonials.modal"
        >
          <DialogHeader>
            <DialogTitle>
              {editingTestimonial ? "Editar Testimonio" : "Agregar Testimonio"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-2">
            {/* Quote */}
            <div>
              <Label htmlFor="quote" className="mb-1 block">
                Testimonio <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="quote"
                placeholder="Escribe el testimonio aquí..."
                value={form.quote}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, quote: e.target.value }))
                }
                rows={4}
                data-ocid="testimonials.quote.textarea"
              />
            </div>

            {/* Author Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="authorName" className="mb-1 block">
                  Nombre <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="authorName"
                  value={form.authorName}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, authorName: e.target.value }))
                  }
                  data-ocid="testimonials.author_name.input"
                />
              </div>
              <div>
                <Label htmlFor="jobTitle" className="mb-1 block">
                  Cargo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="jobTitle"
                  value={form.jobTitle}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, jobTitle: e.target.value }))
                  }
                  data-ocid="testimonials.job_title.input"
                />
              </div>
              <div>
                <Label htmlFor="companyName" className="mb-1 block">
                  Empresa <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="companyName"
                  value={form.companyName}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  data-ocid="testimonials.company_name.input"
                />
              </div>
            </div>

            {/* Star Rating */}
            <div>
              <Label className="mb-2 block">Valoración</Label>
              <StarRating
                value={form.rating}
                onChange={(v) => setForm((prev) => ({ ...prev, rating: v }))}
                size={24}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <Label className="mb-1 block">Foto (opcional)</Label>
              <div className="flex items-center gap-4">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-16 w-16 rounded-full object-cover border"
                    />
                    <button
                      type="button"
                      className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                      onClick={() => {
                        setPhotoPreview("");
                        setPhotoBlob(null);
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 rounded-full border-2 border-dashed flex items-center justify-center text-muted-foreground">
                    <ImageIcon size={20} />
                  </div>
                )}
                <div>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePhotoSelect(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={photoUploading}
                    data-ocid="testimonials.photo.upload_button"
                  >
                    {photoUploading ? (
                      <Loader2 size={14} className="mr-1 animate-spin" />
                    ) : null}
                    {photoUploading ? "Procesando..." : "Subir foto"}
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPG, PNG, WebP · máx. 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Linked Portfolio */}
            <div>
              <Label className="mb-1 block">
                Proyecto vinculado (opcional)
              </Label>
              <SafeSelect
                value={form.linkedPortfolioId}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, linkedPortfolioId: v }))
                }
                options={[
                  { value: SENTINEL_NONE, label: "Sin proyecto vinculado" },
                  ...portfolioProjects.map((p) => ({
                    value: String(p.id),
                    label: p.title,
                  })),
                ]}
                data-ocid="testimonials.portfolio.select"
              />
            </div>

            {/* Visibility */}
            <div className="flex items-center gap-3">
              <Switch
                id="isVisible"
                checked={form.isVisible}
                onCheckedChange={(v) =>
                  setForm((prev) => ({ ...prev, isVisible: v }))
                }
                data-ocid="testimonials.visible.switch"
              />
              <Label htmlFor="isVisible">Visible en el sitio público</Label>
            </div>

            {/* Display Order */}
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
                  setForm((prev) => ({ ...prev, displayOrder: e.target.value }))
                }
                className="w-28"
                data-ocid="testimonials.display_order.input"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(false)}
              data-ocid="testimonials.modal.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isMutating}
              data-ocid="testimonials.modal.submit_button"
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
        <AlertDialogContent data-ocid="testimonials.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar testimonio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="testimonials.delete.cancel_button">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                deleteTarget !== null && deleteMutation.mutate(deleteTarget)
              }
              data-ocid="testimonials.delete.confirm_button"
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
              ¿Eliminar {selectedIds.size} testimonios?
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
