"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChangeEvent, useEffect, useMemo, useState } from "react";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const weekDays = [
  { label: "L", value: "Lunes" },
  { label: "M", value: "Martes" },
  { label: "M", value: "Miercoles" },
  { label: "J", value: "Jueves" },
  { label: "V", value: "Viernes" },
  { label: "S", value: "Sabado" },
  { label: "D", value: "Domingo" },
];

type IconName =
  | "activity"
  | "chart"
  | "chevron-left"
  | "chevron-right"
  | "database"
  | "file-plus"
  | "history"
  | "map-pin"
  | "refresh"
  | "report"
  | "settings"
  | "settings-2"
  | "summary";

type ViewKey = "new" | "history" | "reports" | "settings";

const navItems: { href: string; key: ViewKey; label: string; icon: IconName }[] = [
  { href: "/", key: "new", label: "Nuevo proyecto", icon: "file-plus" },
  { href: "/history", key: "history", label: "Historial", icon: "history" },
  { href: "/reports", key: "reports", label: "Reportes", icon: "report" },
  {
    href: "/settings",
    key: "settings",
    label: "Configuracion",
    icon: "settings",
  },
];

type FormData = {
  industria: string;
  pais: string;
  ciudad: string;
  combustible: string;
  precioCombustible: string;
  unidadPrecio: string;
  areaDisponible: string;
  modeloColector: string;
  fluido: string;
  presion: string;
  unidadPresion: string;
  tipoCircuito: string;
  temperaturaEntrada: string;
  temperaturaSalida: string;
  demanda: string;
  unidadDemanda: string;
  horarioInicio: string;
  horarioFin: string;
  operacionAnual: "todo" | "meses";
  mesesOperacion: string[];
  diasOperacion: string[];
};

type SubmitStatus = "idle" | "loading" | "success" | "error";

type AuthUser = {
  id: number;
  name: string | null;
  email: string;
  role: string;
  avatarUrl: string | null;
  avatarInitial: string | null;
  avatarColor: string | null;
};

const initialFormData: FormData = {
  industria: "Produccion de dieta en gel para cria masiva de moscas",
  pais: "Mexico",
  ciudad: "Metapa de Dominguez, Chiapas",
  combustible: "Diesel",
  precioCombustible: "2.2",
  unidadPrecio: "MXN/kWh",
  areaDisponible: "500",
  modeloColector: "Maxsol MS 2.5",
  fluido: "Agua",
  presion: "1",
  unidadPresion: "bar",
  tipoCircuito: "Circuito cerrado",
  temperaturaEntrada: "30.8",
  temperaturaSalida: "85",
  demanda: "1582",
  unidadDemanda: "L/día",
  horarioInicio: "15:00",
  horarioFin: "18:00",
  operacionAnual: "todo",
  mesesOperacion: months,
  diasOperacion: weekDays.map((day) => day.value),
};

export default function Home() {
  const pathname = usePathname();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let active = true;

    fetch("/api/auth/me")
      .then((response) => {
        if (!response.ok) return null;
        return response.json() as Promise<{ user: AuthUser | null }>;
      })
      .then((data) => {
        if (!active || !data) return;
        setUser(data.user);
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
      });

    return () => {
      active = false;
    };
  }, []);

  const filledFields = useMemo(() => {
    return Object.values(formData).filter((value) => {
      if (Array.isArray(value)) return value.length > 0;
      return value.trim().length > 0;
    }).length;
  }, [formData]);
  const progress = Math.round(
    (filledFields / Object.keys(initialFormData).length) * 100,
  );
  const sectionStatus = [
    {
      label: "Ubicacion",
      complete:
        Boolean(formData.industria.trim()) &&
        Boolean(formData.pais.trim()) &&
        Boolean(formData.ciudad.trim()) &&
        Boolean(formData.combustible.trim()) &&
        Boolean(formData.precioCombustible.trim()) &&
        Boolean(formData.unidadPrecio.trim()) &&
        Boolean(formData.areaDisponible.trim()),
    },
    {
      label: "Proceso",
      complete:
        Boolean(formData.modeloColector.trim()) &&
        Boolean(formData.fluido.trim()) &&
        Boolean(formData.presion.trim()) &&
        Boolean(formData.unidadPresion.trim()) &&
        Boolean(formData.tipoCircuito.trim()) &&
        Boolean(formData.temperaturaEntrada.trim()) &&
        Boolean(formData.temperaturaSalida.trim()),
    },
    {
      label: "Demanda",
      complete:
        Boolean(formData.demanda.trim()) &&
        Boolean(formData.unidadDemanda.trim()) &&
        Boolean(formData.horarioInicio.trim()) &&
        Boolean(formData.horarioFin.trim()) &&
        formData.mesesOperacion.length > 0 &&
        formData.diasOperacion.length > 0,
    },
  ];

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const toggleMonth = (month: string) => {
    setFormData((current) => {
      const selected = current.mesesOperacion.includes(month);
      return {
        ...current,
        mesesOperacion: selected
          ? current.mesesOperacion.filter((item) => item !== month)
          : [...current.mesesOperacion, month],
      };
    });
  };

  const toggleDay = (day: string) => {
    setFormData((current) => {
      const selected = current.diasOperacion.includes(day);
      return {
        ...current,
        diasOperacion: selected
          ? current.diasOperacion.filter((item) => item !== day)
          : [...current.diasOperacion, day],
      };
    });
  };

  const handleAllYear = () => {
    setFormData((current) => ({
      ...current,
      operacionAnual: "todo",
      mesesOperacion: months,
    }));
  };

  const handleCustomMonths = () => {
    setFormData((current) => ({
      ...current,
      operacionAnual: "meses",
      mesesOperacion:
        current.mesesOperacion.length === months.length
          ? []
          : current.mesesOperacion,
    }));
  };

  const selectAllDays = () => {
    setFormData((current) => ({
      ...current,
      diasOperacion: weekDays.map((day) => day.value),
    }));
  };

  const toggleSection = (section: string) => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  const handleSubmit = async () => {
    setSubmitStatus("loading");
    setSubmitMessage("Generando simulacion con IA...");
    setPdfPath("");

    try {
      const sessionResponse = await fetch("/api/auth/me");

      if (!sessionResponse.ok) {
        throw new Error("AUTH_REQUIRED");
      }

      const simulationResponse = await fetch("/api/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!simulationResponse.ok) {
        throw new Error("No se pudo generar la simulacion IA");
      }

      const simulationData = await simulationResponse.json();

      setSubmitMessage("Guardando proyecto y resultados...");

      const payload = {
        nombre: `${formData.industria || "Proyecto SHIP"} - ${
          formData.ciudad || "Sin ciudad"
        }`,
        industria: formData.industria,
        pais: formData.pais,
        ciudad: formData.ciudad,
        inputJson: formData,
        resultJson: simulationData.resultJson,
        pdfPath: null,
      };

      const projectResponse = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!projectResponse.ok) {
        throw new Error("No se pudo guardar el proyecto");
      }

      const projectData = await projectResponse.json();

      setSubmitMessage("Generando reporte PDF...");

      const reportResponse = await fetch(
        `/api/projects/${projectData.id}/report`,
        {
          method: "POST",
        },
      );

      if (!reportResponse.ok) {
        throw new Error("No se pudo generar el PDF");
      }

      const reportData = await reportResponse.json();

      setPdfPath(reportData.pdfPath || "");
      setSubmitStatus("success");
      setSubmitMessage(
        `El proceso se realizo correctamente. Proyecto guardado con ID ${projectData.id} y PDF generado.`,
      );
    } catch (error) {
      console.error(error);
      setSubmitStatus("error");
      setSubmitMessage(
        error instanceof Error && error.message === "AUTH_REQUIRED"
          ? "Debes iniciar sesion para generar y guardar proyectos."
          : "No se pudo completar el proceso. Revisa los datos e intenta de nuevo.",
      );
    }
  };

  const clearForm = () => {
    const confirmed = window.confirm(
      "Esta accion limpiara todos los campos del formulario. No se puede deshacer. Deseas continuar?",
    );

    if (!confirmed) return;

    setFormData(initialFormData);
    setCollapsedSections({});
    setSubmitStatus("idle");
    setSubmitMessage("");
    setPdfPath("");
  };

  return (
    <main className="min-h-screen bg-[#f5f8fc] text-[#0a2147]">
      <header className="sticky top-0 z-20 border-b border-blue-950/10 bg-[#092c5f] text-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link
              className="flex items-center gap-2 rounded-lg transition hover:opacity-85 focus:outline-none focus:ring-4 focus:ring-white/20"
              href="/"
            >
              <h1 className="text-2xl font-bold tracking-tight">SHIP</h1>
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold">
                IA
              </span>
            </Link>
            <span className="hidden h-6 w-px bg-white/30 sm:block" />
            <a
              className="hidden rounded-lg leading-tight transition hover:opacity-85 focus:outline-none focus:ring-4 focus:ring-white/20 sm:block"
              href="https://cimav.edu.mx/"
              rel="noreferrer"
              target="_blank"
            >
              <p className="text-sm font-bold tracking-wide">CIMAV</p>
              <p className="text-[11px] text-blue-100">
                Centro de Investigacion en Materiales Avanzados
              </p>
            </a>
          </div>
          <div className="flex items-center gap-5">
            <Link
              aria-label="Iniciar sesion con otra cuenta"
              className="grid size-8 cursor-pointer place-items-center rounded-full border border-white/70 text-lg font-bold transition hover:border-white hover:bg-white/15 focus:outline-none focus:ring-4 focus:ring-white/20"
              href="/login"
            >
              +
            </Link>
            <Link
              aria-label="Configuracion de usuario"
              className="grid size-9 cursor-pointer place-items-center overflow-hidden rounded-full bg-white/95 font-bold text-[#7890ad] transition hover:bg-white hover:ring-4 hover:ring-white/20 focus:outline-none focus:ring-4 focus:ring-white/30"
              href="/settings"
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="size-full object-cover"
                  src={user.avatarUrl}
                />
              ) : user ? (
                <span
                  className="grid size-full place-items-center rounded-full text-white"
                  style={{ backgroundColor: user.avatarColor || "#0b63e5" }}
                >
                  {getInitial(user)}
                </span>
              ) : (
                "U"
              )}
            </Link>
          </div>
        </div>
      </header>

      <aside
        className={`fixed left-0 top-16 z-10 hidden h-[calc(100vh-4rem)] flex-col border-r border-slate-200 bg-white p-4 shadow-sm transition-all lg:flex ${
          sidebarOpen ? "w-72" : "w-20"
        }`}
      >
        <div className="flex items-center justify-between gap-3 px-2 py-2">
          {sidebarOpen ? (
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
              Navegacion
            </p>
          ) : null}
          <button
            aria-label={sidebarOpen ? "Ocultar sidebar" : "Mostrar sidebar"}
            className="grid size-9 place-items-center rounded-lg border border-slate-200 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            onClick={() => setSidebarOpen((current) => !current)}
            type="button"
          >
            <Icon name={sidebarOpen ? "chevron-left" : "chevron-right"} />
          </button>
        </div>
        <nav className="mt-2 space-y-2">
          {navItems.map(({ href, icon, key, label }) => {
            const active = pathname === href;

            return (
              <Link
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${
                  active
                    ? "bg-[#0b63e5] text-white shadow-md shadow-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-[#0a2147]"
                }`}
                href={href}
                key={key}
              >
                <span
                  className={`grid size-8 place-items-center rounded-lg text-xs font-bold ${
                    active
                      ? "bg-white/20 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon name={icon} />
                </span>
                {sidebarOpen ? <span>{label}</span> : null}
              </Link>
            );
          })}
        </nav>

        {sidebarOpen ? (
          <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-sm font-bold text-[#0a2147]">SHIP IA</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              Prefactibilidad rapida para calor solar en procesos industriales.
            </p>
          </div>
        ) : null}
      </aside>

      <div
        className={`transition-all ${sidebarOpen ? "lg:pl-72" : "lg:pl-20"}`}
      >
        <div className="mx-auto max-w-7xl px-4 pb-24 pt-5 sm:px-6">
          {submitStatus === "success" || submitStatus === "error" ? (
            <div
              className={`mb-5 rounded-2xl border px-5 py-4 text-sm font-semibold shadow-sm ${
                submitStatus === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-red-200 bg-red-50 text-red-800"
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span>{submitMessage}</span>
                {submitStatus === "success" && pdfPath ? (
                  <a
                    className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-bold text-emerald-800 shadow-sm ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                    href={pdfPath}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Ver PDF
                  </a>
                ) : null}
              </div>
            </div>
          ) : null}

          <nav className="rounded-2xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-3">
                  {sectionStatus.map((step, index) => (
                    <div
                      className={`flex items-center gap-3 ${
                        step.complete ? "text-[#0b63e5]" : "text-slate-500"
                      }`}
                      key={step.label}
                    >
                      <span
                        className={`grid size-8 place-items-center rounded-full text-sm font-bold ${
                          step.complete
                            ? "bg-[#0b63e5] text-white shadow-md shadow-blue-200"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold">
                        {step.label}
                      </span>
                      {index < 2 ? (
                        <span
                          className={`hidden h-px flex-1 md:block ${
                            step.complete ? "bg-[#0b63e5]/30" : "bg-slate-200"
                          }`}
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </nav>

          <section className="mt-8">
            <h2 className="text-3xl font-bold tracking-tight">
              Formulario para simulacion
            </h2>
            <p className="mt-2 text-slate-500">
              Captura los campos del formulario original para generar la
              simulacion.
            </p>
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
            <div className="space-y-5">
              <Card
                collapsed={Boolean(collapsedSections.ubicacion)}
                icon="map-pin"
                onToggle={() => toggleSection("ubicacion")}
                subtitle="Informacion general del proyecto y ubicacion geografica"
                title="Datos de ubicacion"
              >
                <div className="grid gap-5 md:grid-cols-3">
                  <InputField
                    label="Industria"
                    name="industria"
                    onChange={handleChange}
                    placeholder="Ej. Alimentos, textil, quimica"
                    value={formData.industria}
                  />
                  <InputField
                    label="Pais"
                    name="pais"
                    onChange={handleChange}
                    placeholder="Ej. Mexico"
                    value={formData.pais}
                  />
                  <InputField
                    label="Ciudad"
                    name="ciudad"
                    onChange={handleChange}
                    placeholder="Ej. Metapa de Dominguez"
                    value={formData.ciudad}
                  />
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-3">
                  <SelectField
                    label="Combustible actual"
                    name="combustible"
                    onChange={handleChange}
                    options={["Diesel", "Gas LP", "Gas natural", "Combustoleo"]}
                    placeholder="Selecciona un combustible"
                    value={formData.combustible}
                  />
                  <InputField
                    label="Precio"
                    name="precioCombustible"
                    onChange={handleChange}
                    prefix="$"
                    placeholder="0.00"
                    value={formData.precioCombustible}
                  />
                  <SelectField
                    label="Unidad de precio"
                    name="unidadPrecio"
                    onChange={handleChange}
                    options={["$/kWh", "$/L", "MXN/kWh", "MXN/L"]}
                    value={formData.unidadPrecio}
                  />
                </div>

                <div className="mt-6 max-w-md">
                  <InputField
                    helper="Area disponible para la instalacion"
                    label="Area [m²]"
                    name="areaDisponible"
                    onChange={handleChange}
                    placeholder="Ej. 500"
                    suffix="m²"
                    value={formData.areaDisponible}
                  />
                </div>
              </Card>

              <Card
                collapsed={Boolean(collapsedSections.proceso)}
                icon="settings-2"
                onToggle={() => toggleSection("proceso")}
                subtitle="Parametros del sistema y condiciones operativas"
                title="Datos del proceso"
              >
                <div className="grid gap-5 md:grid-cols-4">
                  <SelectField
                    label="Modelo del colector"
                    name="modeloColector"
                    onChange={handleChange}
                    options={["Maxsol MS 2.5", "Tubo evacuado", "Placa plana"]}
                    placeholder="Selecciona un modelo"
                    value={formData.modeloColector}
                  />
                  <SelectField
                    label="Fluido"
                    name="fluido"
                    onChange={handleChange}
                    options={["Agua", "Agua-glicol", "Aceite termico"]}
                    value={formData.fluido}
                  />
                  <InputField
                    label="Presion"
                    name="presion"
                    onChange={handleChange}
                    placeholder="Ej. 2"
                    value={formData.presion}
                  />
                  <SelectField
                    label="Unidad"
                    name="unidadPresion"
                    onChange={handleChange}
                    options={["bar", "atm", "kPa", "psi"]}
                    value={formData.unidadPresion}
                  />
                </div>

                <div className="mt-6">
                  <SelectField
                    label="Circuito"
                    name="tipoCircuito"
                    onChange={handleChange}
                    options={["Circuito cerrado", "Circuito abierto"]}
                    value={formData.tipoCircuito}
                  />
                </div>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <InputField
                    label="Temperatura de entrada [°C]"
                    name="temperaturaEntrada"
                    onChange={handleChange}
                    placeholder="Ej. 30"
                    suffix="°C"
                    value={formData.temperaturaEntrada}
                  />
                  <InputField
                    label="Temperatura de salida [°C]"
                    name="temperaturaSalida"
                    onChange={handleChange}
                    placeholder="Ej. 80"
                    suffix="°C"
                    value={formData.temperaturaSalida}
                  />
                </div>
              </Card>

              <Card
                collapsed={Boolean(collapsedSections.demanda)}
                icon="activity"
                onToggle={() => toggleSection("demanda")}
                subtitle="Requerimiento energetico del proceso"
                title="Datos de demanda"
              >
                <div className="grid gap-5 md:grid-cols-4">
                  <InputField
                    label="Demanda"
                    name="demanda"
                    onChange={handleChange}
                    placeholder="Ej. 1582"
                    value={formData.demanda}
                  />
                  <SelectField
                    label="Unidad"
                    name="unidadDemanda"
                    onChange={handleChange}
                    options={["L/día", "kWh/día", "kg/h"]}
                    value={formData.unidadDemanda}
                  />
                  <InputField
                    label="Hora de inicio"
                    name="horarioInicio"
                    onChange={handleChange}
                    placeholder="Ej. 08:00"
                    value={formData.horarioInicio}
                  />
                  <InputField
                    label="Hora final"
                    name="horarioFin"
                    onChange={handleChange}
                    placeholder="Ej. 17:00"
                    value={formData.horarioFin}
                  />
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold">Operacion anual</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <ChoiceCard
                      checked={formData.operacionAnual === "todo"}
                      description="Operacion continua durante los 12 meses"
                      label="Todo el año"
                      onClick={handleAllYear}
                    />
                    <ChoiceCard
                      checked={formData.operacionAnual === "meses"}
                      description="Elige los meses de operacion"
                      label="Seleccionar meses"
                      onClick={handleCustomMonths}
                    />
                  </div>
                  {formData.operacionAnual === "meses" ? (
                    <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {months.map((month) => (
                        <ToggleButton
                          active={formData.mesesOperacion.includes(month)}
                          key={month}
                          label={month}
                          onClick={() => toggleMonth(month)}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="mt-6">
                  <p className="mb-3 text-sm font-semibold">
                    Dias de operacion
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {weekDays.map((day, index) => (
                      <button
                        aria-pressed={formData.diasOperacion.includes(
                          day.value,
                        )}
                        className={`h-10 w-14 rounded-lg border text-sm font-semibold transition ${
                          formData.diasOperacion.includes(day.value)
                            ? "border-[#0b63e5] bg-blue-50 text-[#0b63e5]"
                            : "border-slate-200 bg-white text-slate-500"
                        }`}
                        key={`${day.value}-${index}`}
                        onClick={() => toggleDay(day.value)}
                        type="button"
                      >
                        {day.label}
                      </button>
                    ))}
                  </div>
                  <button
                    className="mt-3 text-sm font-semibold text-[#0b63e5]"
                    onClick={selectAllDays}
                    type="button"
                  >
                    Seleccionar toda la semana
                  </button>
                </div>
              </Card>
            </div>

            <aside className="space-y-5">
              <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                      <Icon name="summary" />
                    </span>
                    <h3 className="font-bold">Resumen del proyecto</h3>
                  </div>
                </div>

                <SummaryBlock
                  color="bg-emerald-500"
                  items={[
                    ["Industria", formData.industria],
                    ["Pais", formData.pais],
                    ["Ciudad", formData.ciudad],
                  ]}
                  title="Ubicacion"
                />
                <SummaryBlock
                  color="bg-teal-500"
                  items={[
                    ["Combustible actual", formData.combustible],
                    ["Precio", formData.precioCombustible],
                  ]}
                  title="Energia"
                />
                <SummaryBlock
                  color="bg-sky-500"
                  items={[
                    ["Fluido", formData.fluido],
                    [
                      "Presion",
                      formData.presion
                        ? `${formData.presion} ${formData.unidadPresion}`
                        : "",
                    ],
                    [
                      "T. entrada",
                      formData.temperaturaEntrada
                        ? `${formData.temperaturaEntrada} °C`
                        : "",
                    ],
                    [
                      "T. salida",
                      formData.temperaturaSalida
                        ? `${formData.temperaturaSalida} °C`
                        : "",
                    ],
                  ]}
                  title="Proceso"
                />
                <SummaryBlock
                  color="bg-orange-500"
                  items={[
                    [
                      "Demanda",
                      formData.demanda
                        ? `${formData.demanda} ${formData.unidadDemanda}`
                        : "",
                    ],
                    [
                      "Horario",
                      formData.horarioInicio && formData.horarioFin
                        ? `${formData.horarioInicio} - ${formData.horarioFin}`
                        : "",
                    ],
                    [
                      "Operacion",
                      formData.operacionAnual === "todo"
                        ? "Todo el año"
                        : `${formData.mesesOperacion.length} meses`,
                    ],
                    ["Dias", `${formData.diasOperacion.length} por semana`],
                  ]}
                  title="Demanda"
                />
              </section>

              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-bold">Progreso del formulario</h3>
                <div className="mt-5 flex items-center gap-4">
                  <div className="grid size-16 place-items-center rounded-full border-4 border-blue-100 text-sm font-bold text-[#0b63e5]">
                    {progress}%
                  </div>
                  <p className="text-sm leading-6 text-slate-500">
                    Completa los datos para continuar.
                  </p>
                </div>
                <div className="mt-5 h-2 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#0b63e5]"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </section>
            </aside>
          </div>

          <footer className="mt-8 rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-500 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p>
                SHIP IA - Herramienta de prefactibilidad para calor solar en
                procesos industriales.
              </p>
              <p>CIMAV · Centro de Investigacion en Materiales Avanzados</p>
            </div>
          </footer>
        </div>
      </div>

      {submitStatus === "loading" ? (
        <div className="fixed inset-0 z-40 grid place-items-center bg-slate-950/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto grid size-16 place-items-center rounded-full bg-blue-50">
              <div className="size-9 animate-spin rounded-full border-4 border-blue-100 border-t-[#0b63e5]" />
            </div>
            <h3 className="mt-5 text-xl font-bold text-[#0a2147]">
              Generando simulacion
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {submitMessage ||
                "Analizando datos, supuestos y resultados preliminares."}
            </p>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-[#0b63e5]" />
            </div>
          </div>
        </div>
      ) : null}

      <footer
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 shadow-[0_-8px_30px_rgba(15,23,42,0.08)] backdrop-blur transition-all ${
          sidebarOpen ? "lg:pl-72" : "lg:pl-20"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <button
            className="cursor-pointer rounded-lg border border-slate-200 px-8 py-3 text-sm font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-4 focus:ring-red-100"
            onClick={clearForm}
            type="button"
          >
            Limpiar formulario
          </button>
          <button
            className="cursor-pointer rounded-lg bg-[#0b63e5] px-8 py-3 text-sm font-bold text-white shadow-md shadow-blue-200 transition hover:bg-[#084db5] hover:shadow-lg hover:shadow-blue-200 focus:outline-none focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:shadow-none disabled:hover:bg-slate-400"
            disabled={submitStatus === "loading"}
            onClick={handleSubmit}
            type="button"
          >
            {submitStatus === "loading" ? "Generando..." : "Enviar simulacion"}
          </button>
        </div>
      </footer>
    </main>
  );
}

function Card({
  children,
  collapsed,
  icon,
  onToggle,
  subtitle,
  title,
}: {
  children: React.ReactNode;
  collapsed: boolean;
  icon: IconName;
  onToggle: () => void;
  subtitle: string;
  title: string;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div
        className={
          collapsed
            ? "flex items-start justify-between"
            : "mb-8 flex items-start justify-between"
        }
      >
        <div className="flex items-start gap-4">
          <span className="grid size-10 place-items-center rounded-full bg-[#0b63e5] text-sm font-bold text-white">
            <Icon name={icon} />
          </span>
          <div>
            <h3 className="text-xl font-bold">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Mostrar ${title}` : `Ocultar ${title}`}
          className="grid size-9 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-50 hover:text-[#0b63e5]"
          onClick={onToggle}
          type="button"
        >
          <span
            className={`text-lg leading-none transition-transform ${
              collapsed ? "rotate-180" : ""
            }`}
          >
            ^
          </span>
        </button>
      </div>
      {collapsed ? null : children}
    </section>
  );
}

function InputField({
  helper,
  label,
  name,
  onChange,
  placeholder,
  prefix,
  suffix,
  value,
}: {
  helper?: string;
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  prefix?: string;
  suffix?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label} *</span>
      <div className="mt-2 flex h-12 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[#0b63e5] focus-within:ring-4 focus-within:ring-blue-100">
        {prefix ? (
          <span className="grid w-12 place-items-center border-r border-slate-200 text-sm">
            {prefix}
          </span>
        ) : null}
        <input
          className="min-w-0 flex-1 px-4 text-sm outline-none placeholder:text-slate-400"
          name={name}
          onChange={onChange}
          placeholder={placeholder}
          value={value}
        />
        {suffix ? (
          <span className="grid min-w-12 place-items-center px-3 text-sm font-semibold">
            {suffix}
          </span>
        ) : null}
      </div>
      {helper ? (
        <span className="mt-2 block text-xs text-slate-500">{helper}</span>
      ) : null}
    </label>
  );
}

function SelectField({
  label,
  name,
  onChange,
  options,
  placeholder,
  value,
}: {
  label: string;
  name: string;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: string[];
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label} *</span>
      <select
        className="mt-2 h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-[#0b63e5] focus:ring-4 focus:ring-blue-100"
        name={name}
        onChange={onChange}
        value={value}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}

function ChoiceCard({
  checked,
  description,
  label,
  onClick,
}: {
  checked: boolean;
  description: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`rounded-lg border p-4 text-left transition ${
        checked ? "border-[#0b63e5] bg-blue-50" : "border-slate-200 bg-white"
      }`}
      onClick={onClick}
      type="button"
    >
      <span className="flex items-start gap-3">
        <span
          className={`mt-1 grid size-4 place-items-center rounded-full border ${
            checked ? "border-[#0b63e5] bg-[#0b63e5]" : "border-slate-300"
          }`}
        >
          {checked ? <span className="size-1.5 rounded-full bg-white" /> : null}
        </span>
        <span>
          <span className="block text-sm font-bold">{label}</span>
          <span className="mt-1 block text-sm text-slate-500">
            {description}
          </span>
        </span>
      </span>
    </button>
  );
}

function ToggleButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={active}
      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
        active
          ? "border-[#0b63e5] bg-blue-50 text-[#0b63e5]"
          : "border-slate-200 bg-white text-slate-500"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function SummaryBlock({
  color,
  items,
  title,
}: {
  color: string;
  items: string[][];
  title: string;
}) {
  return (
    <div className="border-b border-slate-200 p-6 last:border-b-0">
      <div className="mb-4 flex items-center gap-3">
        <span className={`size-5 rounded-full ${color}`} />
        <h4 className="text-sm font-bold">{title}</h4>
      </div>
      <div className="space-y-3">
        {items.map(([label, value]) => (
          <div
            className="flex items-center justify-between gap-3 text-sm"
            key={label}
          >
            <span className="text-slate-500">{label}</span>
            <span className="font-semibold text-slate-700">{value || "-"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function getInitial(user: AuthUser) {
  return (user.avatarInitial || user.name || user.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();
}

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    activity: (
      <>
        <path d="M4 13h4l2-6 4 12 2-6h4" />
      </>
    ),
    chart: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M8 15v-4" />
        <path d="M12 15V8" />
        <path d="M16 15v-6" />
      </>
    ),
    "chevron-left": <path d="m15 6-6 6 6 6" />,
    "chevron-right": <path d="m9 6 6 6-6 6" />,
    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
      </>
    ),
    "file-plus": (
      <>
        <path d="M14 3v4a1 1 0 0 0 1 1h4" />
        <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7l5 5v11a2 2 0 0 1-2 2Z" />
        <path d="M12 11v6" />
        <path d="M9 14h6" />
      </>
    ),
    history: (
      <>
        <path d="M12 8v5l3 2" />
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
      </>
    ),
    "map-pin": (
      <>
        <path d="M12 21s7-5.4 7-12a7 7 0 1 0-14 0c0 6.6 7 12 7 12Z" />
        <path d="M12 10.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      </>
    ),
    report: (
      <>
        <path d="M7 3h8l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
        <path d="M15 3v4h4" />
        <path d="M9 13h6" />
        <path d="M9 17h4" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 5v4h4" />
        <path d="M4 13a8.1 8.1 0 0 0 15.5 2M20 19v-4h-4" />
      </>
    ),
    settings: (
      <>
        <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2 3.4-.2-.1a1.7 1.7 0 0 0-2 .3l-.2.2a1.7 1.7 0 0 0-.5 1.2V22H9v-.2a1.7 1.7 0 0 0-.5-1.2l-.2-.2a1.7 1.7 0 0 0-2-.3l-.2.1-2-3.4.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3v-4h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2-3.4.2.1a1.7 1.7 0 0 0 2-.3l.2-.2A1.7 1.7 0 0 0 9 2.2V2h6v.2a1.7 1.7 0 0 0 .5 1.2l.2.2a1.7 1.7 0 0 0 2 .3l.2-.1 2 3.4-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" />
      </>
    ),
    "settings-2": (
      <>
        <path d="M4 8h4" />
        <path d="M12 8h8" />
        <path d="M10 5v6" />
        <path d="M4 16h10" />
        <path d="M18 16h2" />
        <path d="M16 13v6" />
      </>
    ),
    summary: (
      <>
        <path d="M5 5h14" />
        <path d="M5 12h14" />
        <path d="M5 19h10" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}
