"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === "register";

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch(`/api/auth/${mode}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
      }),
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      setStatus("error");
      setMessage(data.error || "No se pudo completar la solicitud.");
      return;
    }

    router.push("/");
    router.refresh();
  };

  return (
    <main className="grid min-h-screen place-items-center bg-[#f5f8fc] px-4 py-10 text-[#0a2147]">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">SHIP</h1>
          <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-bold text-white">
            IA
          </span>
        </div>
        <h2 className="mt-8 text-2xl font-bold">
          {isRegister ? "Crear cuenta" : "Iniciar sesion"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isRegister
            ? "Crea un usuario para guardar proyectos, reportes y preferencias."
            : "Entra para consultar tus proyectos y generar reportes."}
        </p>

        <form className="mt-6 space-y-4" onSubmit={submit}>
          {isRegister ? (
            <label className="block">
              <span className="text-sm font-semibold">Nombre</span>
              <input
                className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-[#0b63e5] focus:ring-4 focus:ring-blue-100"
                name="name"
                placeholder="Tu nombre"
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-semibold">Correo</span>
            <input
              className="mt-2 h-12 w-full rounded-lg border border-slate-200 px-4 text-sm outline-none focus:border-[#0b63e5] focus:ring-4 focus:ring-blue-100"
              name="email"
              placeholder="correo@empresa.com"
              required
              type="email"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">Contrasena</span>
            <div className="mt-2 flex h-12 overflow-hidden rounded-lg border border-slate-200 bg-white focus-within:border-[#0b63e5] focus-within:ring-4 focus-within:ring-blue-100">
              <input
                className="min-w-0 flex-1 px-4 text-sm outline-none"
                minLength={8}
                name="password"
                placeholder="Minimo 8 caracteres"
                required
                type={showPassword ? "text" : "password"}
              />
              <button
                className="border-l border-slate-200 px-4 text-sm font-bold text-[#0b63e5] transition hover:bg-blue-50"
                onClick={() => setShowPassword((current) => !current)}
                type="button"
              >
                {showPassword ? "Ocultar" : "Ver"}
              </button>
            </div>
          </label>

          {status === "error" ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {message}
            </div>
          ) : null}

          <button
            className="w-full rounded-lg bg-[#0b63e5] px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-100 transition hover:bg-[#084db5] disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={status === "loading"}
            type="submit"
          >
            {status === "loading"
              ? "Procesando..."
              : isRegister
                ? "Crear cuenta"
                : "Entrar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? "Ya tienes cuenta?" : "No tienes cuenta?"}{" "}
          <Link
            className="font-bold text-[#0b63e5]"
            href={isRegister ? "/login" : "/register"}
          >
            {isRegister ? "Inicia sesion" : "Crear cuenta"}
          </Link>
        </p>
      </section>
    </main>
  );
}
