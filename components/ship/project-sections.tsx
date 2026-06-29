"use client";

import { FormEvent, useEffect, useState } from "react";
import { Icon, type IconName } from "./ship-shell";

type ProjectsStatus = "idle" | "loading" | "success" | "error";

export type ProjectRecord = {
  id: number;
  nombre: string;
  industria: string;
  pais: string;
  ciudad: string;
  inputJson: string;
  resultJson: string | null;
  pdfPath: string | null;
  createdAt: string;
};

type SettingsUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  company: string | null;
  language: string | null;
  reportEmail: string | null;
  avatarUrl: string | null;
  avatarInitial: string | null;
  avatarColor: string | null;
};

type SettingsForm = {
  name: string;
  company: string;
  language: string;
  reportEmail: string;
  avatarUrl: string;
  avatarInitial: string;
  avatarColor: string;
};

export function ProjectsRoute({ mode }: { mode: "history" | "reports" }) {
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [status, setStatus] = useState<ProjectsStatus>("loading");
  const [message, setMessage] = useState("");

  const loadProjects = async () => {
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/projects");

      if (!response.ok) {
        throw new Error("No se pudo cargar el historial");
      }

      const data = (await response.json()) as ProjectRecord[];
      setProjects(data);
      setStatus("success");
    } catch (error) {
      console.error(error);
      setStatus("error");
      setMessage("No se pudieron cargar los proyectos guardados.");
    }
  };

  const deleteProject = async (projectId: number) => {
    const confirmed = window.confirm(
      "Esta accion borrara el proyecto y su reporte PDF. No se puede deshacer. Deseas continuar?",
    );

    if (!confirmed) return;

    const response = await fetch(`/api/projects/${projectId}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      window.alert(data.error || "No se pudo borrar el proyecto.");
      return;
    }

    setProjects((current) =>
      current.filter((project) => project.id !== projectId),
    );
  };

  useEffect(() => {
    let active = true;

    fetch("/api/projects")
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo cargar el historial");
        }

        return response.json() as Promise<ProjectRecord[]>;
      })
      .then((data) => {
        if (!active) return;
        setProjects(data);
        setStatus("success");
      })
      .catch((error) => {
        if (!active) return;
        console.error(error);
        setStatus("error");
        setMessage("No se pudieron cargar los proyectos guardados.");
      });

    return () => {
      active = false;
    };
  }, []);

  if (mode === "reports") {
    return (
      <ReportsPanel
        message={message}
        onDelete={deleteProject}
        onRefresh={loadProjects}
        projects={projects}
        status={status}
      />
    );
  }

  return (
    <ProjectsPanel
      message={message}
      onDelete={deleteProject}
      onRefresh={loadProjects}
      projects={projects}
      status={status}
    />
  );
}

function ProjectsPanel({
  message,
  onDelete,
  onRefresh,
  projects,
  status,
}: {
  message: string;
  onDelete: (projectId: number) => void;
  onRefresh: () => void;
  projects: ProjectRecord[];
  status: ProjectsStatus;
}) {
  return (
    <section className="space-y-6">
      <PanelHeader
        description="Consulta las simulaciones guardadas en SQLite y abre sus reportes cuando existan."
        icon="history"
        onRefresh={onRefresh}
        title="Historial de proyectos"
      />

      <ProjectsState message={message} projects={projects} status={status} />

      {projects.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-[80px_1.5fr_1fr_1fr_180px] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-xs font-bold uppercase tracking-wide text-slate-500 max-lg:hidden">
            <span>ID</span>
            <span>Proyecto</span>
            <span>Ubicacion</span>
            <span>Fecha</span>
            <span>Reporte</span>
          </div>
          <div className="divide-y divide-slate-100">
            {projects.map((project, index) => (
              <article
                className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[80px_1.5fr_1fr_1fr_180px] lg:items-center"
                key={project.id}
              >
                <span className="font-bold text-[#0b63e5]">#{index + 1}</span>
                <div>
                  <h3 className="font-bold text-[#0a2147]">{project.nombre}</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {project.industria || "Sin industria registrada"}
                  </p>
                </div>
                <span className="text-slate-600">
                  {[project.ciudad, project.pais].filter(Boolean).join(", ") ||
                    "Sin ubicacion"}
                </span>
                <span className="text-slate-500">
                  {formatDate(project.createdAt)}
                </span>
                <div className="flex flex-wrap gap-2">
                  {project.pdfPath ? (
                    <a
                      className="inline-flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-bold text-[#0b63e5] transition hover:bg-blue-100"
                      href={project.pdfPath}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Ver PDF
                    </a>
                  ) : (
                    <span className="inline-flex items-center text-xs font-semibold text-slate-400">
                      Pendiente
                    </span>
                  )}
                  <button
                    className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100"
                    onClick={() => onDelete(project.id)}
                    type="button"
                  >
                    Borrar
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ReportsPanel({
  message,
  onDelete,
  onRefresh,
  projects,
  status,
}: {
  message: string;
  onDelete: (projectId: number) => void;
  onRefresh: () => void;
  projects: ProjectRecord[];
  status: ProjectsStatus;
}) {
  const reports = projects.filter((project) => Boolean(project.pdfPath));
  const [emailStatus, setEmailStatus] = useState<
    Record<number, "idle" | "loading" | "success" | "error">
  >({});
  const [emailMessage, setEmailMessage] = useState<Record<number, string>>({});

  const sendEmail = async (projectId: number) => {
    setEmailStatus((current) => ({ ...current, [projectId]: "loading" }));
    setEmailMessage((current) => ({ ...current, [projectId]: "" }));

    try {
      const response = await fetch(`/api/projects/${projectId}/email`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as {
        email?: string;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "No se pudo enviar el correo");
      }

      setEmailStatus((current) => ({ ...current, [projectId]: "success" }));
      setEmailMessage((current) => ({
        ...current,
        [projectId]: `Enviado a ${data.email || "tu correo"}`,
      }));
    } catch (error) {
      setEmailStatus((current) => ({ ...current, [projectId]: "error" }));
      setEmailMessage((current) => ({
        ...current,
        [projectId]:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el correo",
      }));
    }
  };

  return (
    <section className="space-y-6">
      <PanelHeader
        description="Acceso rapido a los PDF generados automaticamente para cada estudio SHIP."
        icon="report"
        onRefresh={onRefresh}
        title="Reportes tecnicos"
      />

      {status === "loading" || status === "error" ? (
        <ProjectsState message={message} projects={projects} status={status} />
      ) : null}

      {status === "success" && reports.length === 0 ? (
        <EmptyPanel
          description="Cuando termines una simulacion y se genere su PDF, aparecera aqui."
          icon="report"
          title="Aun no hay reportes generados"
        />
      ) : null}

      {reports.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {reports.map((project, index) => (
            <article
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
              key={project.id}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wide text-slate-400">
                    Reporte #{index + 1}
                  </span>
                  <h3 className="mt-2 text-lg font-bold text-[#0a2147]">
                    {project.nombre}
                  </h3>
                  <p className="mt-2 text-sm text-slate-500">
                    {formatDate(project.createdAt)}
                  </p>
                </div>
                <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-[#0b63e5]">
                  <Icon name="report" />
                </span>
              </div>
              <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                <InfoItem label="Industria" value={project.industria} />
                <InfoItem
                  label="Ubicacion"
                  value={[project.ciudad, project.pais]
                    .filter(Boolean)
                    .join(", ")}
                />
              </dl>
              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <a
                  className="inline-flex items-center justify-center rounded-lg bg-[#0b63e5] px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-[#084db5]"
                  href={project.pdfPath || "#"}
                  rel="noreferrer"
                  target="_blank"
                >
                  Abrir reporte PDF
                </a>
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-[#0b63e5] transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                  disabled={emailStatus[project.id] === "loading"}
                  onClick={() => sendEmail(project.id)}
                  type="button"
                >
                  {emailStatus[project.id] === "loading"
                    ? "Enviando..."
                    : "Enviar por correo"}
                </button>
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-700 transition hover:bg-red-100"
                  onClick={() => onDelete(project.id)}
                  type="button"
                >
                  Borrar reporte
                </button>
              </div>
              {emailMessage[project.id] ? (
                <p
                  className={`mt-3 text-sm font-semibold ${
                    emailStatus[project.id] === "success"
                      ? "text-emerald-700"
                      : "text-red-700"
                  }`}
                >
                  {emailMessage[project.id]}
                </p>
              ) : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

export function SettingsPanel() {
  const [user, setUser] = useState<SettingsUser | null>(null);
  const [form, setForm] = useState<SettingsForm>({
    name: "",
    company: "",
    language: "es",
    reportEmail: "",
    avatarUrl: "",
    avatarInitial: "",
    avatarColor: "#0b63e5",
  });
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [saveStatus, setSaveStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    let active = true;

    fetch("/api/user/settings")
      .then((response) => {
        if (!response.ok) {
          throw new Error("No session");
        }

        return response.json() as Promise<{ user: SettingsUser }>;
      })
      .then((data) => {
        if (!active) return;
        setUser(data.user);
        setForm(toSettingsForm(data.user));
        setStatus("success");
      })
      .catch(() => {
        if (!active) return;
        setStatus("error");
      });

    return () => {
      active = false;
    };
  }, []);

  const updateForm = (field: keyof SettingsForm, value: string) => {
    setSaveStatus("idle");
    setSaveMessage("");
    setForm((current) => ({ ...current, [field]: value }));
  };

  const saveSettings = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaveStatus("loading");
    setSaveMessage("");

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        user?: SettingsUser;
      };

      if (!response.ok || !data.user) {
        throw new Error(data.error || "No se pudo guardar la configuracion");
      }

      setUser(data.user);
      setForm(toSettingsForm(data.user));
      setSaveStatus("success");
      setSaveMessage("Configuracion guardada correctamente.");
    } catch (error) {
      setSaveStatus("error");
      setSaveMessage(
        error instanceof Error
          ? error.message
          : "No se pudo guardar la configuracion.",
      );
    }
  };

  const avatarInitial =
    form.avatarInitial.trim().charAt(0).toUpperCase() ||
    (form.name || user?.email || "U").trim().charAt(0).toUpperCase();

  return (
    <section className="space-y-6">
      <PanelHeader
        description="Perfil, sesion y preferencias personales del usuario."
        icon="settings"
        title="Configuracion de usuario"
      />

      {status === "loading" ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
          Cargando perfil...
        </div>
      ) : null}

      {status === "error" ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900 shadow-sm">
          <h3 className="font-bold">Sesion no iniciada</h3>
          <p className="mt-2 leading-6">
            Inicia sesion para ver y editar la configuracion del usuario.
          </p>
          <a
            className="mt-4 inline-flex rounded-lg bg-[#0b63e5] px-4 py-2 text-sm font-bold text-white"
            href="/login"
          >
            Iniciar sesion
          </a>
        </div>
      ) : null}

      {user ? (
        <form className="space-y-6" onSubmit={saveSettings}>
          <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-blue-50 text-[#0b63e5]">
                  <Icon name="settings" />
                </span>
                <div>
                  <h3 className="font-bold text-[#0a2147]">Perfil</h3>
                  <p className="text-sm text-slate-500">
                    Datos visibles y preferencias generales de la cuenta.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <SettingsInput
                  label="Nombre"
                  onChange={(value) => updateForm("name", value)}
                  placeholder="Tu nombre"
                  value={form.name}
                />
                <SettingsInput
                  label="Empresa o institucion"
                  onChange={(value) => updateForm("company", value)}
                  placeholder="Ej. CIMAV, UTCH, empresa"
                  value={form.company}
                />
                <label className="block">
                  <span className="text-sm font-semibold">Idioma</span>
                  <select
                    className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#0b63e5] focus:ring-4 focus:ring-blue-100"
                    onChange={(event) =>
                      updateForm("language", event.target.value)
                    }
                    value={form.language}
                  >
                    <option value="es">Espanol</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <SettingsInput
                  disabled
                  label="Correo de cuenta"
                  onChange={() => undefined}
                  value={user.email}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="font-bold text-[#0a2147]">Foto de perfil</h3>
              <div className="mt-5 flex items-center gap-4">
                {form.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt="Foto de perfil"
                    className="size-20 rounded-full object-cover ring-4 ring-blue-50"
                    src={form.avatarUrl}
                  />
                ) : (
                  <span
                    className="grid size-20 place-items-center rounded-full text-3xl font-bold text-white ring-4 ring-blue-50"
                    style={{ backgroundColor: form.avatarColor }}
                  >
                    {avatarInitial}
                  </span>
                )}
                <div className="text-sm text-slate-500">
                  <p className="font-semibold text-[#0a2147]">
                    {form.name || user.email}
                  </p>
                  <p>{user.role}</p>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <SettingsInput
                  label="URL de foto"
                  onChange={(value) => updateForm("avatarUrl", value)}
                  placeholder="https://..."
                  value={form.avatarUrl}
                />
                <div className="grid grid-cols-[1fr_96px] gap-4">
                  <SettingsInput
                    label="Letra de avatar"
                    maxLength={2}
                    onChange={(value) => updateForm("avatarInitial", value)}
                    placeholder="R"
                    value={form.avatarInitial}
                  />
                  <label className="block">
                    <span className="text-sm font-semibold">Color</span>
                    <input
                      className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white p-1"
                      onChange={(event) =>
                        updateForm("avatarColor", event.target.value)
                      }
                      type="color"
                      value={form.avatarColor}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                <Icon name="settings-2" />
              </span>
              <div>
                <h3 className="font-bold text-[#0a2147]">Correo de reportes</h3>
                <p className="text-sm text-slate-500">
                  Aqui personalizas el correo donde quieres recibir los
                  reportes.
                </p>
              </div>
            </div>

            <div className="mt-6 max-w-xl">
              <SettingsInput
                helper="Si lo dejas vacio, los reportes se mandan al correo de la cuenta."
                label="Correo para recibir reportes"
                onChange={(value) => updateForm("reportEmail", value)}
                placeholder={user.email}
                type="email"
                value={form.reportEmail}
              />
            </div>
          </section>

          {saveMessage ? (
            <div
              className={`rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
                saveStatus === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              {saveMessage}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              className="rounded-lg bg-[#0b63e5] px-6 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-[#084db5] disabled:cursor-not-allowed disabled:bg-slate-400"
              disabled={saveStatus === "loading"}
              type="submit"
            >
              {saveStatus === "loading" ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

function PanelHeader({
  description,
  icon,
  onRefresh,
  title,
}: {
  description: string;
  icon: IconName;
  onRefresh?: () => void;
  title: string;
}) {
  return (
    <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-11 place-items-center rounded-full bg-[#0b63e5] text-white">
            <Icon name={icon} />
          </span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[#0a2147]">
              {title}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-500">
              {description}
            </p>
          </div>
        </div>
        {onRefresh ? (
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            onClick={onRefresh}
            type="button"
          >
            <Icon name="refresh" />
            Actualizar
          </button>
        ) : null}
      </div>
    </header>
  );
}

function ProjectsState({
  message,
  projects,
  status,
}: {
  message: string;
  projects: ProjectRecord[];
  status: ProjectsStatus;
}) {
  if (status === "loading") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-500 shadow-sm">
        Cargando proyectos guardados...
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm font-semibold text-red-700 shadow-sm">
        {message || "No se pudo cargar la informacion."}
      </div>
    );
  }

  if (status === "success" && projects.length === 0) {
    return (
      <EmptyPanel
        description="Cuando envies una simulacion, el proyecto se guardara aqui con sus resultados y PDF."
        icon="history"
        title="Aun no hay proyectos guardados"
      />
    );
  }

  return null;
}

function EmptyPanel({
  description,
  icon,
  title,
}: {
  description: string;
  icon: IconName;
  title: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon name={icon} />
      </span>
      <h3 className="mt-4 text-lg font-bold text-[#0a2147]">{title}</h3>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SettingsInput({
  disabled,
  helper,
  label,
  maxLength,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  disabled?: boolean;
  helper?: string;
  label: string;
  maxLength?: number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#0b63e5] focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-400"
        disabled={disabled}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {helper ? (
        <span className="mt-2 block text-xs leading-5 text-slate-500">
          {helper}
        </span>
      ) : null}
    </label>
  );
}

function InfoItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg bg-slate-50 px-3 py-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-700">
        {value || "-"}
      </dd>
    </div>
  );
}

function toSettingsForm(user: SettingsUser): SettingsForm {
  return {
    name: user.name || "",
    company: user.company || "",
    language: user.language || "es",
    reportEmail: user.reportEmail || "",
    avatarUrl: user.avatarUrl || "",
    avatarInitial: user.avatarInitial || "",
    avatarColor: user.avatarColor || "#0b63e5",
  };
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
