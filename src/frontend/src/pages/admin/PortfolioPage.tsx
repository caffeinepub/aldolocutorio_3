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
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
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
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Edit2,
  GripVertical,
  ImageIcon,
  Loader2,
  Plus,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ExternalBlob,
  PortfolioCategory,
  type PortfolioFilter,
  type PortfolioProject,
  type PortfolioProjectInput,
  type PortfolioProjectUpdate,
  PublishStatus,
} from "../../backend";
import {
  SENTINEL_ALL,
  SENTINEL_NONE,
  SENTINEL_NO_CHANGE,
  SafeSelect,
  convertSentinelToNull,
} from "../../components/SafeSelect";
import { useActor } from "../../hooks/useActor";
import { safeConvertToNumber } from "../../utils/NumericConverter";

// ─── Types ────────────────────────────────────────────────────────────────────

type GalleryImageItem = {
  id: string;
  blob: ExternalBlob | null;
  previewUrl: string;
  progress: number;
  uploading: boolean;
  error: string | null;
  originalFile?: File;
};

type FormState = {
  title: string;
  clientName: string;
  industry: string;
  category: string;
  tags: string[];
  description: string;
  technologiesUsed: string[];
  results: string[];
  publishStatus: string;
  displayOrder: string;
  linkedTestimonialId: string;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: SENTINEL_ALL, label: "Todas las categorías" },
  { value: PortfolioCategory.web, label: "Web" },
  { value: PortfolioCategory.mobile, label: "Mobile" },
  { value: PortfolioCategory.saas, label: "SaaS" },
  { value: PortfolioCategory.ai, label: "IA" },
  { value: PortfolioCategory.blockchain, label: "Blockchain" },
  { value: PortfolioCategory.branding, label: "Branding" },
];

const CATEGORY_FORM_OPTIONS = [
  { value: PortfolioCategory.web, label: "Web" },
  { value: PortfolioCategory.mobile, label: "Mobile" },
  { value: PortfolioCategory.saas, label: "SaaS" },
  { value: PortfolioCategory.ai, label: "IA" },
  { value: PortfolioCategory.blockchain, label: "Blockchain" },
  { value: PortfolioCategory.branding, label: "Branding" },
];

const STATUS_OPTIONS = [
  { value: SENTINEL_ALL, label: "Todos los estados" },
  { value: PublishStatus.draft, label: "Borrador" },
  { value: PublishStatus.published, label: "Publicado" },
  { value: PublishStatus.archived, label: "Archivado" },
];

const STATUS_FORM_OPTIONS = [
  { value: PublishStatus.draft, label: "Borrador" },
  { value: PublishStatus.published, label: "Publicado" },
  { value: PublishStatus.archived, label: "Archivado" },
];

const BULK_STATUS_OPTIONS = [
  { value: SENTINEL_NO_CHANGE, label: "Sin cambios" },
  { value: PublishStatus.draft, label: "Borrador" },
  { value: PublishStatus.published, label: "Publicado" },
  { value: PublishStatus.archived, label: "Archivado" },
];

const PAGE_SIZE_OPTIONS = [
  { value: "10", label: "10 por página" },
  { value: "25", label: "25 por página" },
  { value: "50", label: "50 por página" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function statusBadge(status: PublishStatus) {
  if (status === PublishStatus.published)
    return (
      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        Publicado
      </Badge>
    );
  if (status === PublishStatus.archived)
    return (
      <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-100">
        Archivado
      </Badge>
    );
  return (
    <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
      Borrador
    </Badge>
  );
}

function categoryLabel(cat: PortfolioCategory): string {
  const map: Record<PortfolioCategory, string> = {
    [PortfolioCategory.web]: "Web",
    [PortfolioCategory.mobile]: "Mobile",
    [PortfolioCategory.saas]: "SaaS",
    [PortfolioCategory.ai]: "IA",
    [PortfolioCategory.blockchain]: "Blockchain",
    [PortfolioCategory.branding]: "Branding",
  };
  return map[cat] ?? cat;
}

async function compressToWebP(file: File): Promise<File> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const img = new Image();
    img.onload = () => {
      const maxW = 1920;
      const scale = img.width > maxW ? maxW / img.width : 1;
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          resolve(
            new File([blob!], file.name.replace(/\.[^.]+$/, ".webp"), {
              type: "image/webp",
            }),
          );
        },
        "image/webp",
        0.85,
      );
    };
    img.src = URL.createObjectURL(file);
  });
}

const EMPTY_FORM: FormState = {
  title: "",
  clientName: "",
  industry: "",
  category: PortfolioCategory.web,
  tags: [],
  description: "",
  technologiesUsed: [],
  results: [""],
  publishStatus: PublishStatus.draft,
  displayOrder: "0",
  linkedTestimonialId: "",
};

// ─── TagInput ─────────────────────────────────────────────────────────────────

function TagInput({
  tags,
  onChange,
  placeholder,
  dataOcid,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder: string;
  dataOcid?: string;
}) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const trimmed = input.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  return (
    <div className="flex flex-wrap gap-1 rounded-md border border-input bg-background p-2 min-h-[42px]">
      {tags.map((tag) => (
        <span
          key={tag}
          className="flex items-center gap-1 bg-accent text-accent-foreground rounded px-2 py-0.5 text-xs"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-destructive"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        data-ocid={dataOcid}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm"
      />
    </div>
  );
}

// ─── ImageUploadArea ──────────────────────────────────────────────────────────

function ImageUploadArea({
  label,
  previewUrl,
  progress,
  uploading,
  onFileSelect,
  onRemove,
  dataOcid,
}: {
  label: string;
  previewUrl?: string;
  progress: number;
  uploading: boolean;
  onFileSelect: (file: File) => void;
  onRemove?: () => void;
  dataOcid?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-2">
      <button
        type="button"
        className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors w-full"
        onClick={() => inputRef.current?.click()}
        data-ocid={dataOcid}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt={label}
              className="max-h-32 mx-auto rounded object-cover"
            />
            {onRemove && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-2">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, GIF, WebP — máx. 10MB
            </p>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileSelect(file);
            e.target.value = "";
          }}
        />
      </button>
      {uploading && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1" />
          <p className="text-xs text-muted-foreground text-center">
            Subiendo... {progress}%
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortfolioPage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  // ── Pagination state ──
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // ── Filter state ──
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState(SENTINEL_ALL);
  const [filterStatus, setFilterStatus] = useState(SENTINEL_ALL);
  const [filterIndustry, setFilterIndustry] = useState("");

  // ── Selection state ──
  const [selectedIds, setSelectedIds] = useState<Set<bigint>>(new Set());
  const [bulkStatus, setBulkStatus] = useState(SENTINEL_NO_CHANGE);

  // ── Modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<PortfolioProject | null>(
    null,
  );

  // ── Delete state ──
  const [deleteId, setDeleteId] = useState<bigint | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // ── Form state ──
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  // ── Thumbnail state ──
  const [thumbnailBlob, setThumbnailBlob] = useState<ExternalBlob | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState("");
  const [thumbnailProgress, setThumbnailProgress] = useState(0);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);

  // ── Gallery state ──
  const [gallery, setGallery] = useState<GalleryImageItem[]>([]);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── Bulk operation progress ──
  const [bulkProgress, setBulkProgress] = useState(0);
  const [bulkOperating, setBulkOperating] = useState(false);

  // ─── Build filter object ──────────────────────────────────────────────────

  const buildFilter = useCallback((): PortfolioFilter | null => {
    const cat = convertSentinelToNull(filterCategory);
    const st = convertSentinelToNull(filterStatus);
    const hasFilter = searchTerm || cat || st || filterIndustry;
    if (!hasFilter) return null;
    const f: PortfolioFilter = {};
    if (searchTerm) f.search = searchTerm;
    if (cat) f.category = cat as PortfolioCategory;
    if (st) f.status = st as PublishStatus;
    return f;
  }, [searchTerm, filterCategory, filterStatus, filterIndustry]);

  // ─── Query ────────────────────────────────────────────────────────────────

  const { data, isLoading, isFetching } = useQuery({
    queryKey: [
      "portfolio",
      page,
      pageSize,
      searchTerm,
      filterCategory,
      filterStatus,
      filterIndustry,
    ],
    queryFn: async () => {
      if (!actor) return { total: BigInt(0), items: [] };
      return actor.getPortfolioProjects(
        BigInt(page),
        BigInt(pageSize),
        buildFilter(),
      );
    },
    enabled: !!actor,
    placeholderData: keepPreviousData,
  });

  // Prefetch next page
  const prefetchNextPage = useCallback(() => {
    if (!actor || !data) return;
    const total = safeConvertToNumber(data.total) ?? 0;
    const totalPages = Math.ceil(total / pageSize);
    if (page < totalPages) {
      queryClient.prefetchQuery({
        queryKey: [
          "portfolio",
          page + 1,
          pageSize,
          searchTerm,
          filterCategory,
          filterStatus,
          filterIndustry,
        ],
        queryFn: () =>
          actor.getPortfolioProjects(
            BigInt(page + 1),
            BigInt(pageSize),
            buildFilter(),
          ),
      });
    }
  }, [
    actor,
    data,
    page,
    pageSize,
    searchTerm,
    filterCategory,
    filterStatus,
    filterIndustry,
    buildFilter,
    queryClient,
  ]);

  // ─── Mutations ────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: async (input: PortfolioProjectInput) => {
      if (!actor) throw new Error("Sin conexión al backend");
      return actor.createPortfolioProject(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Proyecto creado exitosamente");
      closeModal();
    },
    onError: () => toast.error("Error al crear el proyecto"),
  });

  const updateMutation = useMutation({
    mutationFn: async (input: PortfolioProjectUpdate) => {
      if (!actor) throw new Error("Sin conexión al backend");
      return actor.updatePortfolioProject(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Proyecto actualizado");
      closeModal();
    },
    onError: () => toast.error("Error al actualizar el proyecto"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Sin conexión al backend");
      return actor.deletePortfolioProject(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Proyecto eliminado");
      setDeleteId(null);
    },
    onError: () => toast.error("Error al eliminar el proyecto"),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: bigint[]) => {
      if (!actor) throw new Error("Sin conexión al backend");
      return actor.reorderPortfolioProjects(ids);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: () => toast.error("Error al reordenar proyectos"),
  });

  // ─── Image upload helpers ─────────────────────────────────────────────────

  const handleThumbnailSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 10MB");
      return;
    }
    setThumbnailUploading(true);
    setThumbnailProgress(0);
    try {
      const compressed = await compressToWebP(file);
      const preview = URL.createObjectURL(compressed);
      setThumbnailPreview(preview);
      const bytes = new Uint8Array(await compressed.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) =>
        setThumbnailProgress(p),
      );
      setThumbnailBlob(blob);
    } catch {
      toast.error("Error al procesar la imagen");
    } finally {
      setThumbnailUploading(false);
    }
  };

  const handleGallerySelect = async (files: FileList) => {
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} supera el límite de 10MB`);
        continue;
      }
      const id = `${Date.now()}-${Math.random()}`;
      const item: GalleryImageItem = {
        id,
        blob: null,
        previewUrl: "",
        progress: 0,
        uploading: true,
        error: null,
        originalFile: file,
      };
      setGallery((prev) => [...prev, item]);
      try {
        const compressed = await compressToWebP(file);
        const preview = URL.createObjectURL(compressed);
        const bytes = new Uint8Array(await compressed.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((p) => {
          setGallery((prev) =>
            prev.map((g) => (g.id === id ? { ...g, progress: p } : g)),
          );
        });
        setGallery((prev) =>
          prev.map((g) =>
            g.id === id
              ? { ...g, blob, previewUrl: preview, uploading: false }
              : g,
          ),
        );
      } catch {
        setGallery((prev) =>
          prev.map((g) =>
            g.id === id
              ? { ...g, uploading: false, error: "Error al procesar" }
              : g,
          ),
        );
        toast.error(`Error al procesar ${file.name}`);
      }
    }
  };

  // ─── Modal helpers ────────────────────────────────────────────────────────

  const openAddModal = () => {
    setEditingProject(null);
    setForm(EMPTY_FORM);
    setThumbnailBlob(null);
    setThumbnailPreview("");
    setThumbnailProgress(0);
    setThumbnailUploading(false);
    setGallery([]);
    setModalOpen(true);
  };

  const openEditModal = (project: PortfolioProject) => {
    setEditingProject(project);
    setForm({
      title: project.title,
      clientName: project.clientName,
      industry: project.industry,
      category: project.category,
      tags: project.tags,
      description: project.description,
      technologiesUsed: project.technologiesUsed,
      results: project.results.length > 0 ? project.results : [""],
      publishStatus: project.publishStatus,
      displayOrder: String(safeConvertToNumber(project.displayOrder) ?? 0),
      linkedTestimonialId: project.linkedTestimonialId
        ? String(project.linkedTestimonialId)
        : "",
    });
    // Load existing thumbnail
    if (project.thumbnail) {
      setThumbnailBlob(project.thumbnail);
      setThumbnailPreview(project.thumbnail.getDirectURL());
    } else {
      setThumbnailBlob(null);
      setThumbnailPreview("");
    }
    setThumbnailProgress(0);
    setThumbnailUploading(false);
    // Load existing gallery
    setGallery(
      project.galleryImages.map((b, i) => ({
        id: `existing-${i}`,
        blob: b,
        previewUrl: b.getDirectURL(),
        progress: 100,
        uploading: false,
        error: null,
      })),
    );
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProject(null);
  };

  // ─── Form submit ──────────────────────────────────────────────────────────

  const handleSubmit = () => {
    if (
      !form.title.trim() ||
      !form.clientName.trim() ||
      !form.industry.trim()
    ) {
      toast.error("Por favor completa los campos requeridos");
      return;
    }

    const galleryBlobs = gallery
      .filter((g) => g.blob !== null)
      .map((g) => g.blob as ExternalBlob);

    const results = form.results.filter((r) => r.trim());
    const linkedId = form.linkedTestimonialId.trim()
      ? BigInt(form.linkedTestimonialId)
      : undefined;
    const displayOrder = BigInt(safeConvertToNumber(form.displayOrder) ?? 0);

    if (editingProject) {
      const input: PortfolioProjectUpdate = {
        id: editingProject.id,
        title: form.title.trim(),
        clientName: form.clientName.trim(),
        industry: form.industry.trim(),
        category: form.category as PortfolioCategory,
        tags: form.tags,
        thumbnail: thumbnailBlob ?? undefined,
        galleryImages: galleryBlobs,
        description: form.description,
        technologiesUsed: form.technologiesUsed,
        results,
        publishStatus: form.publishStatus as PublishStatus,
        displayOrder,
        linkedTestimonialId: linkedId,
      };
      updateMutation.mutate(input);
    } else {
      const input: PortfolioProjectInput = {
        title: form.title.trim(),
        clientName: form.clientName.trim(),
        industry: form.industry.trim(),
        category: form.category as PortfolioCategory,
        tags: form.tags,
        thumbnail: thumbnailBlob ?? undefined,
        galleryImages: galleryBlobs,
        description: form.description,
        technologiesUsed: form.technologiesUsed,
        results,
        publishStatus: form.publishStatus as PublishStatus,
        displayOrder,
        linkedTestimonialId: linkedId,
      };
      createMutation.mutate(input);
    }
  };

  // ─── Reorder helpers ──────────────────────────────────────────────────────

  const moveItem = (index: number, direction: "up" | "down") => {
    if (!data?.items) return;
    const items = [...data.items];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    [items[index], items[target]] = [items[target], items[index]];
    reorderMutation.mutate(items.map((it) => it.id));
  };

  // ─── Bulk helpers ─────────────────────────────────────────────────────────

  const toggleSelect = (id: bigint) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!data?.items) return;
    if (selectedIds.size === data.items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(data.items.map((p) => p.id)));
    }
  };

  const applyBulkStatus = async () => {
    const status = convertSentinelToNull(bulkStatus) as PublishStatus | null;
    if (!status || !actor) return;
    setBulkOperating(true);
    setBulkProgress(0);
    try {
      await actor.bulkUpdatePortfolioStatus(Array.from(selectedIds), status);
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Estado actualizado masivamente");
      setSelectedIds(new Set());
      setBulkStatus(SENTINEL_NO_CHANGE);
    } catch {
      toast.error("Error en operación masiva");
    } finally {
      setBulkOperating(false);
      setBulkProgress(100);
    }
  };

  const applyBulkDelete = async () => {
    if (!actor) return;
    setBulkOperating(true);
    setBulkProgress(0);
    try {
      await actor.bulkDeletePortfolioProjects(Array.from(selectedIds));
      queryClient.invalidateQueries({ queryKey: ["portfolio"] });
      toast.success("Proyectos eliminados");
      setSelectedIds(new Set());
      setBulkDeleteConfirm(false);
    } catch {
      toast.error("Error al eliminar proyectos");
    } finally {
      setBulkOperating(false);
      setBulkProgress(100);
    }
  };

  // ─── Pagination ───────────────────────────────────────────────────────────

  const total = safeConvertToNumber(data?.total) ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-foreground">
          Portafolio
        </h2>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="default"
            onClick={openAddModal}
            data-ocid="portfolio.open_modal_button"
            title="Agregar Proyecto"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => setShowFilters((v) => !v)}
            data-ocid="portfolio.filter.toggle"
            title="Filtros"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Buscar</Label>
              <Input
                placeholder="Buscar por título, cliente o descripción"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                data-ocid="portfolio.search_input"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Categoría</Label>
              <SafeSelect
                value={filterCategory}
                onValueChange={(v) => {
                  setFilterCategory(v);
                  setPage(1);
                }}
                options={CATEGORY_OPTIONS}
                placeholder="Todas las categorías"
                data-ocid="portfolio.category.select"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Estado</Label>
              <SafeSelect
                value={filterStatus}
                onValueChange={(v) => {
                  setFilterStatus(v);
                  setPage(1);
                }}
                options={STATUS_OPTIONS}
                placeholder="Todos los estados"
                data-ocid="portfolio.status.select"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Industria</Label>
              <Input
                placeholder="Filtrar por industria"
                value={filterIndustry}
                onChange={(e) => {
                  setFilterIndustry(e.target.value);
                  setPage(1);
                }}
                data-ocid="portfolio.industry.search_input"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setFilterCategory(SENTINEL_ALL);
                setFilterStatus(SENTINEL_ALL);
                setFilterIndustry("");
                setPage(1);
              }}
              data-ocid="portfolio.filter.cancel_button"
            >
              <X className="h-3 w-3 mr-1" />
              Limpiar filtros
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-accent border border-border rounded-xl p-3 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium">
            {selectedIds.size} proyecto{selectedIds.size !== 1 ? "s" : ""}{" "}
            seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          {bulkOperating && (
            <Progress value={bulkProgress} className="h-1 w-24" />
          )}
          <SafeSelect
            value={bulkStatus}
            onValueChange={setBulkStatus}
            options={BULK_STATUS_OPTIONS}
            placeholder="Cambiar estado"
            sentinelValue={SENTINEL_NO_CHANGE}
            data-ocid="portfolio.bulk.select"
          />
          <Button
            size="sm"
            variant="default"
            onClick={applyBulkStatus}
            disabled={bulkStatus === SENTINEL_NO_CHANGE || bulkOperating}
            data-ocid="portfolio.bulk.save_button"
          >
            {bulkOperating ? (
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
            ) : null}
            Aplicar
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setBulkDeleteConfirm(true)}
            disabled={bulkOperating}
            data-ocid="portfolio.bulk.delete_button"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Eliminar seleccionados
          </Button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-2" data-ocid="portfolio.loading_state">
          {["s1", "s2", "s3", "s4", "s5"].map((sk) => (
            <Skeleton key={sk} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Desktop Table */}
      {!isLoading && (
        <div
          className="hidden md:block bg-card border border-border rounded-xl overflow-hidden"
          data-ocid="portfolio.table"
        >
          <div
            className={`transition-opacity ${isFetching ? "opacity-60" : "opacity-100"}`}
          >
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        data?.items &&
                        data.items.length > 0 &&
                        selectedIds.size === data.items.length
                      }
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="w-16">Orden</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Industria</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!data?.items || data.items.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-12"
                      data-ocid="portfolio.empty_state"
                    >
                      <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground">
                          No se encontraron proyectos
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={openAddModal}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar primer proyecto
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  data.items.map((project, index) => (
                    <TableRow key={String(project.id)}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(project.id)}
                          onCheckedChange={() => toggleSelect(project.id)}
                          data-ocid={`portfolio.checkbox.${index + 1}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center gap-1"
                          data-ocid={`portfolio.drag_handle.${index + 1}`}
                        >
                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={() => moveItem(index, "up")}
                              disabled={index === 0}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronUp className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveItem(index, "down")}
                              disabled={index === data.items.length - 1}
                              className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                              <ChevronDown className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {project.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.clientName}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {project.industry}
                      </TableCell>
                      <TableCell>
                        <span className="text-xs bg-secondary text-secondary-foreground px-2 py-0.5 rounded">
                          {categoryLabel(project.category)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {statusBadge(project.publishStatus)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => openEditModal(project)}
                            data-ocid={`portfolio.edit_button.${index + 1}`}
                            title="Editar"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => setDeleteId(project.id)}
                            data-ocid={`portfolio.delete_button.${index + 1}`}
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
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
      )}

      {/* Mobile Cards */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          {!data?.items || data.items.length === 0 ? (
            <div
              className="bg-card border border-border rounded-xl p-8 text-center"
              data-ocid="portfolio.empty_state"
            >
              <p className="text-muted-foreground mb-3">
                No se encontraron proyectos
              </p>
              <Button size="sm" variant="outline" onClick={openAddModal}>
                <Plus className="h-3 w-3 mr-1" />
                Agregar proyecto
              </Button>
            </div>
          ) : (
            data.items.map((project, index) => (
              <div
                key={String(project.id)}
                className="bg-card border border-border rounded-xl p-4"
                data-ocid={`portfolio.item.${index + 1}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <Checkbox
                      checked={selectedIds.has(project.id)}
                      onCheckedChange={() => toggleSelect(project.id)}
                      data-ocid={`portfolio.checkbox.${index + 1}`}
                    />
                    <GripVertical
                      className="h-4 w-4 text-muted-foreground shrink-0"
                      data-ocid={`portfolio.drag_handle.${index + 1}`}
                    />
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">
                        {project.title}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {project.clientName} · {project.industry}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {statusBadge(project.publishStatus)}
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveItem(index, "up")}
                      disabled={index === 0}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-1"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(index, "down")}
                      disabled={index === data.items.length - 1}
                      className="text-muted-foreground hover:text-foreground disabled:opacity-30 p-1"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openEditModal(project)}
                      data-ocid={`portfolio.edit_button.${index + 1}`}
                    >
                      <Edit2 className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/30"
                      onClick={() => setDeleteId(project.id)}
                      data-ocid={`portfolio.delete_button.${index + 1}`}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              Mostrando {startItem}–{endItem} de {total} proyectos
            </span>
            <SafeSelect
              value={String(pageSize)}
              onValueChange={(v) => {
                const n = safeConvertToNumber(v);
                if (n) {
                  setPageSize(n);
                  setPage(1);
                }
              }}
              options={PAGE_SIZE_OPTIONS}
              data-ocid="portfolio.pagesize.select"
            />
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              onMouseEnter={prefetchNextPage}
              data-ocid="portfolio.pagination_prev"
            >
              <ChevronLeft className="h-4 w-4" />
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
                  size="icon"
                  variant={page === pageNum ? "default" : "outline"}
                  onClick={() => setPage(pageNum)}
                  onMouseEnter={prefetchNextPage}
                  data-ocid={`portfolio.page.button.${i + 1}`}
                  className="w-8 h-8 text-xs"
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              size="icon"
              variant="outline"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              onMouseEnter={prefetchNextPage}
              data-ocid="portfolio.pagination_next"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent
          className="max-w-2xl max-h-[90vh] flex flex-col p-0"
          data-ocid="portfolio.modal"
        >
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle>
              {editingProject ? "Editar Proyecto" : "Agregar Proyecto"}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="flex-1 overflow-auto">
            <div className="px-6 pb-6 space-y-6">
              {/* Info Básica */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Información Básica
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>
                      Título <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.title}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, title: e.target.value }))
                      }
                      placeholder="Nombre del proyecto"
                      data-ocid="portfolio.title.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Cliente <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.clientName}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, clientName: e.target.value }))
                      }
                      placeholder="Nombre del cliente"
                      data-ocid="portfolio.client.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>
                      Industria <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      value={form.industry}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, industry: e.target.value }))
                      }
                      placeholder="ej. Fintech, Salud"
                      data-ocid="portfolio.industry.input"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Categoría</Label>
                    <SafeSelect
                      value={form.category || PortfolioCategory.web}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, category: v }))
                      }
                      options={CATEGORY_FORM_OPTIONS}
                      sentinelValue={PortfolioCategory.web}
                      data-ocid="portfolio.category_form.select"
                    />
                  </div>
                </div>
              </section>

              {/* Etiquetas */}
              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Etiquetas
                </h3>
                <TagInput
                  tags={form.tags}
                  onChange={(tags) => setForm((f) => ({ ...f, tags }))}
                  placeholder="Escribe y presiona Enter para agregar"
                  dataOcid="portfolio.tags.input"
                />
              </section>

              {/* Thumbnail */}
              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Imagen Principal
                </h3>
                <ImageUploadArea
                  label="Haz clic para subir imagen principal"
                  previewUrl={thumbnailPreview || undefined}
                  progress={thumbnailProgress}
                  uploading={thumbnailUploading}
                  onFileSelect={handleThumbnailSelect}
                  onRemove={() => {
                    setThumbnailBlob(null);
                    setThumbnailPreview("");
                  }}
                  dataOcid="portfolio.thumbnail.upload_button"
                />
              </section>

              {/* Gallery */}
              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Galería de Imágenes
                </h3>
                <button
                  type="button"
                  className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors w-full"
                  onClick={() => galleryInputRef.current?.click()}
                  data-ocid="portfolio.gallery.dropzone"
                >
                  <div className="flex flex-col items-center gap-1 py-2">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Agregar imágenes a la galería
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Selección múltiple — JPG, PNG, GIF, WebP — máx. 10MB cada
                      una
                    </p>
                  </div>
                  <input
                    ref={galleryInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files) handleGallerySelect(e.target.files);
                      e.target.value = "";
                    }}
                  />
                </button>
                {gallery.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {gallery.map((item, gIndex) => (
                      <div
                        key={item.id}
                        className="relative aspect-square rounded-lg overflow-hidden border border-border bg-muted"
                      >
                        {item.previewUrl ? (
                          <img
                            src={item.previewUrl}
                            alt={`Galería ${gIndex + 1}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full">
                            {item.uploading ? (
                              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                        )}
                        {item.uploading && (
                          <div className="absolute bottom-0 inset-x-0">
                            <Progress
                              value={item.progress}
                              className="h-1 rounded-none"
                            />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setGallery((prev) =>
                              prev.filter((g) => g.id !== item.id),
                            )
                          }
                          className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              {/* Descripción */}
              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Descripción
                </h3>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, description: e.target.value }))
                  }
                  placeholder="Descripción detallada del proyecto..."
                  className="min-h-[120px]"
                  data-ocid="portfolio.description.textarea"
                />
              </section>

              {/* Tecnologías */}
              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Tecnologías Utilizadas
                </h3>
                <TagInput
                  tags={form.technologiesUsed}
                  onChange={(technologiesUsed) =>
                    setForm((f) => ({ ...f, technologiesUsed }))
                  }
                  placeholder="ej. React, Node.js — Enter para agregar"
                  dataOcid="portfolio.tech.input"
                />
              </section>

              {/* Resultados */}
              <section className="space-y-2">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Resultados
                </h3>
                <div className="space-y-2">
                  {(form.results as string[]).map((result, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: ordered list requires index
                    <div key={idx} className="flex gap-2">
                      <Input
                        value={result}
                        onChange={(e) => {
                          const results = [...form.results];
                          results[idx] = e.target.value;
                          setForm((f) => ({ ...f, results }));
                        }}
                        placeholder={`Resultado ${idx + 1} (ej. +40% conversión)`}
                        data-ocid="portfolio.results.input"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="text-destructive shrink-0"
                        onClick={() => {
                          if (form.results.length === 1) return;
                          const results = form.results.filter(
                            (_, i) => i !== idx,
                          );
                          setForm((f) => ({ ...f, results }));
                        }}
                        disabled={form.results.length === 1}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        results: [...f.results, ""],
                      }))
                    }
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar resultado
                  </Button>
                </div>
              </section>

              {/* Configuración */}
              <section className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  Configuración
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Estado de publicación</Label>
                    <SafeSelect
                      value={form.publishStatus || PublishStatus.draft}
                      onValueChange={(v) =>
                        setForm((f) => ({ ...f, publishStatus: v }))
                      }
                      options={STATUS_FORM_OPTIONS}
                      sentinelValue={PublishStatus.draft}
                      data-ocid="portfolio.status_form.select"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Orden de visualización</Label>
                    <Input
                      type="number"
                      value={form.displayOrder}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          displayOrder: e.target.value,
                        }))
                      }
                      placeholder="0"
                      data-ocid="portfolio.order.input"
                    />
                  </div>
                </div>
              </section>
            </div>
          </ScrollArea>
          <DialogFooter className="px-6 py-4 border-t border-border shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={closeModal}
              data-ocid="portfolio.cancel_button"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isMutating}
              data-ocid="portfolio.submit_button"
            >
              {isMutating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={deleteId !== null}
        onOpenChange={(o) => !o && setDeleteId(null)}
      >
        <AlertDialogContent data-ocid="portfolio.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proyecto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proyecto será eliminado
              permanentemente junto con sus imágenes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteId(null)}
              data-ocid="portfolio.delete.cancel_button"
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="portfolio.delete.confirm_button"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog
        open={bulkDeleteConfirm}
        onOpenChange={(o) => !o && setBulkDeleteConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar {selectedIds.size} proyecto
              {selectedIds.size !== 1 ? "s" : ""}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Los proyectos seleccionados
              serán eliminados permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBulkDeleteConfirm(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={applyBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkOperating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Eliminar todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
