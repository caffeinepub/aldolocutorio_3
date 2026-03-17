import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Eye,
  Loader2,
  Mail,
  Map as MapIcon,
  MapPin,
  MessageCircle,
  Phone,
  RefreshCw,
  RotateCcw,
  Save,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ContactSettings } from "../../backend.d";
import { useActor } from "../../hooks/useActor";
import { safeConvertToNumber } from "../../utils/NumericConverter";

type FormState = {
  whatsappNumber: string;
  whatsappEnabled: boolean;
  emailPrimary: string;
  emailSecondary: string;
  emailResponseTime: string;
  phonePrimary: string;
  phoneSecondary: string;
  phoneEnabled: boolean;
  fullAddress: string;
  hoursMonday: string;
  hoursTuesday: string;
  hoursWednesday: string;
  hoursThursday: string;
  hoursFriday: string;
  hoursSaturday: string;
  hoursSunday: string;
  latitude: string;
  longitude: string;
};

type ValidationErrors = Partial<Record<keyof FormState, string>>;

const defaultForm: FormState = {
  whatsappNumber: "",
  whatsappEnabled: true,
  emailPrimary: "",
  emailSecondary: "",
  emailResponseTime: "",
  phonePrimary: "",
  phoneSecondary: "",
  phoneEnabled: false,
  fullAddress: "",
  hoursMonday: "",
  hoursTuesday: "",
  hoursWednesday: "",
  hoursThursday: "",
  hoursFriday: "",
  hoursSaturday: "",
  hoursSunday: "",
  latitude: "",
  longitude: "",
};

function settingsToForm(s: ContactSettings): FormState {
  return {
    whatsappNumber: s.whatsapp.number ?? "",
    whatsappEnabled: s.whatsapp.isEnabled,
    emailPrimary: s.email.primary,
    emailSecondary: s.email.secondary ?? "",
    emailResponseTime: s.email.responseTime,
    phonePrimary: s.phone.primary ?? "",
    phoneSecondary: s.phone.secondary ?? "",
    phoneEnabled: s.phone.isEnabled,
    fullAddress: s.address.fullAddress,
    hoursMonday: s.address.businessHours.monday,
    hoursTuesday: s.address.businessHours.tuesday,
    hoursWednesday: s.address.businessHours.wednesday,
    hoursThursday: s.address.businessHours.thursday,
    hoursFriday: s.address.businessHours.friday,
    hoursSaturday: s.address.businessHours.saturday,
    hoursSunday: s.address.businessHours.sunday,
    latitude: String(s.map.latitude),
    longitude: String(s.map.longitude),
  };
}

function formToSettings(f: FormState): ContactSettings {
  const lat = safeConvertToNumber(f.latitude) ?? 36.69699;
  const lon = safeConvertToNumber(f.longitude) ?? -4.447439;
  return {
    whatsapp: {
      number: f.whatsappNumber || undefined,
      isEnabled: f.whatsappEnabled,
    },
    email: {
      primary: f.emailPrimary,
      secondary: f.emailSecondary || undefined,
      responseTime: f.emailResponseTime,
    },
    phone: {
      primary: f.phonePrimary || undefined,
      secondary: f.phoneSecondary || undefined,
      isEnabled: f.phoneEnabled,
    },
    address: {
      fullAddress: f.fullAddress,
      businessHours: {
        monday: f.hoursMonday,
        tuesday: f.hoursTuesday,
        wednesday: f.hoursWednesday,
        thursday: f.hoursThursday,
        friday: f.hoursFriday,
        saturday: f.hoursSaturday,
        sunday: f.hoursSunday,
      },
    },
    map: { latitude: lat, longitude: lon },
    lastUpdated: BigInt(0),
  };
}

function validateForm(f: FormState): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!f.emailPrimary.trim()) {
    errors.emailPrimary = "El email principal es obligatorio";
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.emailPrimary)) {
    errors.emailPrimary = "Formato de email inválido";
  }
  if (
    f.emailSecondary &&
    !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.emailSecondary)
  ) {
    errors.emailSecondary = "Formato de email inválido";
  }
  const lat = safeConvertToNumber(f.latitude);
  if (f.latitude !== "" && (lat === null || lat < -90 || lat > 90)) {
    errors.latitude = "Latitud debe estar entre -90 y 90";
  }
  const lon = safeConvertToNumber(f.longitude);
  if (f.longitude !== "" && (lon === null || lon < -180 || lon > 180)) {
    errors.longitude = "Longitud debe estar entre -180 y 180";
  }
  return errors;
}

function formatLastUpdated(ts: bigint): string {
  if (!ts || ts === BigInt(0)) return "Nunca actualizado";
  const ms = Number(ts);
  const date = new Date(ms);
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MapIframe({ lat, lon }: { lat: string; lon: string }) {
  const latNum = safeConvertToNumber(lat);
  const lonNum = safeConvertToNumber(lon);
  if (latNum === null || lonNum === null) return null;
  const bbox = `${lonNum - 0.01},${latNum - 0.01},${lonNum + 0.01},${latNum + 0.01}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latNum},${lonNum}`;
  return (
    <iframe
      src={src}
      width="100%"
      height="180"
      className="rounded-lg border border-border"
      title="Mapa OpenStreetMap"
      loading="lazy"
    />
  );
}

function LivePreview({ form }: { form: FormState }) {
  const lat = safeConvertToNumber(form.latitude);
  const lon = safeConvertToNumber(form.longitude);
  const dayLabels: [keyof FormState, string][] = [
    ["hoursMonday", "Lun"],
    ["hoursTuesday", "Mar"],
    ["hoursWednesday", "Mié"],
    ["hoursThursday", "Jue"],
    ["hoursFriday", "Vie"],
    ["hoursSaturday", "Sáb"],
    ["hoursSunday", "Dom"],
  ];

  return (
    <div className="space-y-3">
      {/* WhatsApp */}
      {form.whatsappEnabled && form.whatsappNumber && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
          <MessageCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">WhatsApp</p>
            <p className="text-sm text-muted-foreground">
              +{form.whatsappNumber}
            </p>
            <a
              href={`https://wa.me/${form.whatsappNumber}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-green-600 hover:underline"
            >
              Enviar mensaje →
            </a>
          </div>
        </div>
      )}

      {/* Email */}
      {form.emailPrimary && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
          <Mail className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">Email</p>
            <p className="text-sm text-muted-foreground truncate">
              {form.emailPrimary}
            </p>
            {form.emailSecondary && (
              <p className="text-sm text-muted-foreground truncate">
                {form.emailSecondary}
              </p>
            )}
            {form.emailResponseTime && (
              <span className="inline-block mt-1 text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full">
                {form.emailResponseTime}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Phone */}
      {form.phoneEnabled && (form.phonePrimary || form.phoneSecondary) && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
          <Phone className="w-5 h-5 text-purple-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Teléfono</p>
            {form.phonePrimary && (
              <p className="text-sm text-muted-foreground">
                {form.phonePrimary}
              </p>
            )}
            {form.phoneSecondary && (
              <p className="text-sm text-muted-foreground">
                {form.phoneSecondary}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Address */}
      {form.fullAddress && (
        <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800">
          <MapPin className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground">Dirección</p>
            <p className="text-sm text-muted-foreground">{form.fullAddress}</p>
          </div>
        </div>
      )}

      {/* Business Hours */}
      {dayLabels.some(([key]) => form[key]) && (
        <div className="p-3 rounded-lg bg-muted/40 border border-border">
          <p className="text-xs font-semibold text-foreground mb-2">Horario</p>
          <div className="space-y-1">
            {dayLabels.map(([key, label]) => (
              <div key={key} className="flex justify-between text-xs">
                <span className="font-medium text-muted-foreground w-8">
                  {label}
                </span>
                <span className="text-foreground">
                  {(form[key] as string) || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Map */}
      {lat !== null && lon !== null && (
        <MapIframe lat={form.latitude} lon={form.longitude} />
      )}
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ContactSettingsPage() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [initialized, setInitialized] = useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["contactSettings"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.getContactSettings();
    },
    enabled: !!actor,
  });

  useEffect(() => {
    if (settings && !initialized) {
      setForm(settingsToForm(settings));
      setInitialized(true);
    }
  }, [settings, initialized]);

  const updateMutation = useMutation({
    mutationFn: async (input: ContactSettings) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateContactSettings(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contactSettings"] });
      toast.success("Configuración guardada correctamente");
    },
    onError: () => {
      toast.error("Error al guardar la configuración");
    },
  });

  const resetMutation = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.resetContactSettings();
    },
    onSuccess: (data) => {
      setForm(settingsToForm(data));
      queryClient.invalidateQueries({ queryKey: ["contactSettings"] });
      toast.success("Valores restablecidos correctamente");
    },
    onError: () => {
      toast.error("Error al restablecer valores");
    },
  });

  const restoreQuery = useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.getPreviousContactSettings();
    },
    onSuccess: (data) => {
      if (!data) {
        toast.info("No hay versión anterior disponible");
        return;
      }
      setForm(settingsToForm(data));
      toast.success("Versión anterior restaurada");
    },
    onError: () => {
      toast.error("Error al restaurar versión anterior");
    },
  });

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleSave() {
    const validationErrors = validateForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error("Por favor corrige los errores del formulario");
      return;
    }
    updateMutation.mutate(formToSettings(form));
  }

  const isPending =
    updateMutation.isPending ||
    resetMutation.isPending ||
    restoreQuery.isPending;

  const lat = safeConvertToNumber(form.latitude);
  const lon = safeConvertToNumber(form.longitude);
  const osmUrl =
    lat !== null && lon !== null
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}`
      : "https://www.openstreetmap.org";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Configuración de Contacto
          </h2>
          <div className="mt-1 text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-56" />
            ) : settings?.lastUpdated ? (
              <span>
                Última actualización: {formatLastUpdated(settings.lastUpdated)}
              </span>
            ) : (
              <span>Sin actualizaciones previas</span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => resetMutation.mutate()}
            disabled={isPending}
            data-ocid="contact_settings.secondary_button"
          >
            {resetMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            <span className="ml-1.5">Restablecer Valores</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => restoreQuery.mutate()}
            disabled={isPending}
            data-ocid="contact_settings.secondary_button"
          >
            {restoreQuery.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RotateCcw className="w-4 h-4" />
            )}
            <span className="ml-1.5">Restaurar Versión Anterior</span>
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isPending}
            data-ocid="contact_settings.primary_button"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span className="ml-1.5">Guardar Cambios</span>
          </Button>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form column */}
        <div className="lg:col-span-3 space-y-4">
          {isLoading ? (
            <FormSkeleton />
          ) : (
            <>
              {/* Section A: WhatsApp */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="w-4 h-4 text-green-600" />
                    WhatsApp y Mensajería
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="whatsapp-number">Número de WhatsApp</Label>
                    <Input
                      id="whatsapp-number"
                      placeholder="34695250655"
                      value={form.whatsappNumber}
                      onChange={(e) =>
                        updateField("whatsappNumber", e.target.value)
                      }
                      data-ocid="contact_settings.input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Incluir código de país (ej. 34695250655)
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor="whatsapp-enabled"
                      className="cursor-pointer"
                    >
                      Mostrar WhatsApp en sitio público
                    </Label>
                    <Switch
                      id="whatsapp-enabled"
                      checked={form.whatsappEnabled}
                      onCheckedChange={(v) => updateField("whatsappEnabled", v)}
                      data-ocid="contact_settings.switch"
                    />
                  </div>
                  {form.whatsappNumber && (
                    <a
                      href={`https://wa.me/${form.whatsappNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-green-600 hover:underline"
                      data-ocid="contact_settings.link"
                    >
                      <ExternalLink className="w-3 h-3" /> Probar enlace
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Section B: Email */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Mail className="w-4 h-4 text-blue-600" />
                    Correo Electrónico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="email-primary">
                      Email Principal{" "}
                      <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email-primary"
                      type="email"
                      value={form.emailPrimary}
                      onChange={(e) =>
                        updateField("emailPrimary", e.target.value)
                      }
                      className={
                        errors.emailPrimary ? "border-destructive" : ""
                      }
                      data-ocid="contact_settings.input"
                    />
                    {errors.emailPrimary && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="contact_settings.error_state"
                      >
                        {errors.emailPrimary}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-secondary">
                      Email Secundario{" "}
                      <span className="text-muted-foreground text-xs">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="email-secondary"
                      type="email"
                      value={form.emailSecondary}
                      onChange={(e) =>
                        updateField("emailSecondary", e.target.value)
                      }
                      className={
                        errors.emailSecondary ? "border-destructive" : ""
                      }
                      data-ocid="contact_settings.input"
                    />
                    {errors.emailSecondary && (
                      <p
                        className="text-xs text-destructive"
                        data-ocid="contact_settings.error_state"
                      >
                        {errors.emailSecondary}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="email-response">
                      Tiempo de Respuesta Esperado
                    </Label>
                    <Input
                      id="email-response"
                      value={form.emailResponseTime}
                      onChange={(e) =>
                        updateField("emailResponseTime", e.target.value)
                      }
                      data-ocid="contact_settings.input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Ej. 'Usualmente responde en 2 horas'
                    </p>
                  </div>
                  {form.emailPrimary && (
                    <a
                      href={`mailto:${form.emailPrimary}`}
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
                      data-ocid="contact_settings.link"
                    >
                      <ExternalLink className="w-3 h-3" /> Probar email
                    </a>
                  )}
                </CardContent>
              </Card>

              {/* Section C: Phone */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="w-4 h-4 text-purple-600" />
                    Teléfono
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="phone-primary">
                      Teléfono Principal{" "}
                      <span className="text-muted-foreground text-xs">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="phone-primary"
                      value={form.phonePrimary}
                      onChange={(e) =>
                        updateField("phonePrimary", e.target.value)
                      }
                      data-ocid="contact_settings.input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Formato internacional recomendado
                    </p>
                    {form.phonePrimary && (
                      <a
                        href={`tel:${form.phonePrimary}`}
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline"
                        data-ocid="contact_settings.link"
                      >
                        <Phone className="w-3 h-3" /> Llamar
                      </a>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="phone-secondary">
                      Teléfono Secundario{" "}
                      <span className="text-muted-foreground text-xs">
                        (opcional)
                      </span>
                    </Label>
                    <Input
                      id="phone-secondary"
                      value={form.phoneSecondary}
                      onChange={(e) =>
                        updateField("phoneSecondary", e.target.value)
                      }
                      data-ocid="contact_settings.input"
                    />
                    {form.phoneSecondary && (
                      <a
                        href={`tel:${form.phoneSecondary}`}
                        className="inline-flex items-center gap-1 text-xs text-purple-600 hover:underline"
                        data-ocid="contact_settings.link"
                      >
                        <Phone className="w-3 h-3" /> Llamar
                      </a>
                    )}
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="phone-enabled" className="cursor-pointer">
                      Mostrar teléfonos en sitio público
                    </Label>
                    <Switch
                      id="phone-enabled"
                      checked={form.phoneEnabled}
                      onCheckedChange={(v) => updateField("phoneEnabled", v)}
                      data-ocid="contact_settings.switch"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Section D: Address */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapPin className="w-4 h-4 text-orange-600" />
                    Dirección Física
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="full-address">Dirección Completa</Label>
                    <Input
                      id="full-address"
                      value={form.fullAddress}
                      onChange={(e) =>
                        updateField("fullAddress", e.target.value)
                      }
                      data-ocid="contact_settings.input"
                    />
                  </div>
                  <Separator />
                  <p className="text-sm font-medium">Horario de Atención</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(
                      [
                        ["hoursMonday", "Lunes"],
                        ["hoursTuesday", "Martes"],
                        ["hoursWednesday", "Miércoles"],
                        ["hoursThursday", "Jueves"],
                        ["hoursFriday", "Viernes"],
                        ["hoursSaturday", "Sábado"],
                        ["hoursSunday", "Domingo"],
                      ] as [keyof FormState, string][]
                    ).map(([key, label]) => (
                      <div key={key} className="space-y-1">
                        <Label htmlFor={key} className="text-xs">
                          {label}
                        </Label>
                        <Input
                          id={key}
                          value={form[key] as string}
                          onChange={(e) => updateField(key, e.target.value)}
                          placeholder="09:30 - 22:00"
                          className="h-8 text-sm"
                          data-ocid="contact_settings.input"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Formato horario: HH:MM - HH:MM, usar coma para múltiples
                    bloques
                  </p>
                </CardContent>
              </Card>

              {/* Section E: Map */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MapIcon className="w-4 h-4 text-teal-600" />
                    Coordenadas del Mapa
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="latitude">Latitud</Label>
                      <Input
                        id="latitude"
                        type="number"
                        step="0.000001"
                        min="-90"
                        max="90"
                        value={form.latitude}
                        onChange={(e) =>
                          updateField("latitude", e.target.value)
                        }
                        className={errors.latitude ? "border-destructive" : ""}
                        data-ocid="contact_settings.input"
                      />
                      {errors.latitude && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="contact_settings.error_state"
                        >
                          {errors.latitude}
                        </p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="longitude">Longitud</Label>
                      <Input
                        id="longitude"
                        type="number"
                        step="0.000001"
                        min="-180"
                        max="180"
                        value={form.longitude}
                        onChange={(e) =>
                          updateField("longitude", e.target.value)
                        }
                        className={errors.longitude ? "border-destructive" : ""}
                        data-ocid="contact_settings.input"
                      />
                      {errors.longitude && (
                        <p
                          className="text-xs text-destructive"
                          data-ocid="contact_settings.error_state"
                        >
                          {errors.longitude}
                        </p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Coordenadas para OpenStreetMap
                  </p>
                  <a
                    href={osmUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline"
                    data-ocid="contact_settings.link"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver en OpenStreetMap
                  </a>
                  <MapIframe lat={form.latitude} lon={form.longitude} />
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Preview column */}
        <div className="lg:col-span-2">
          <div className="sticky top-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Eye className="w-4 h-4" />
                    Vista Previa
                  </CardTitle>
                  <a
                    href="/contact"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                    data-ocid="contact_settings.link"
                  >
                    <ExternalLink className="w-3 h-3" /> Ver página completa
                  </a>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                ) : (
                  <LivePreview form={form} />
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Bottom save bar */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <Button
          variant="outline"
          onClick={() => restoreQuery.mutate()}
          disabled={isPending}
          data-ocid="contact_settings.secondary_button"
        >
          {restoreQuery.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RotateCcw className="w-4 h-4 mr-2" />
          )}
          Restaurar Versión Anterior
        </Button>
        <Button
          onClick={handleSave}
          disabled={isPending}
          data-ocid="contact_settings.submit_button"
        >
          {updateMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
