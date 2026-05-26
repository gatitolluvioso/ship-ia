"use client";

import { useState } from "react";

export default function Home() {
  const [formData, setFormData] = useState({
    nombre: "",
    industria: "",
    pais: "",
    ciudad: "",
    combustible: "",
    precioCombustible: "",
    unidadPrecio: "",
    areaDisponible: "",
    modeloColector: "",
    fluido: "",
    tipoCircuito: "",
    presion: "",
    temperaturaEntrada: "",
    temperaturaSalida: "",
    demanda: "",
    unidadDemanda: "",
    horarioInicio: "",
    horarioFin: "",
    diasOperacion: "",
    mesesOperacion: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    const payload = {
      nombre: formData.nombre,
      industria: formData.industria,
      pais: formData.pais,
      ciudad: formData.ciudad,
      inputJson: formData,
    };

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    alert(`Proyecto guardado con ID: ${data.id}`);
  };

  return (
    <main className="h-screen bg-gray-100 flex overflow-hidden">
      <aside className="w-72 bg-white border-r p-6 flex flex-col justify-between shrink-0">
        <div>
          <div className="mb-10">
            <h1 className="text-2xl font-bold text-gray-800">CIMAV SHIP IA</h1>
            <p className="text-sm text-gray-500 mt-1">
              Plataforma de análisis solar térmico industrial
            </p>
          </div>

          <nav className="space-y-3">
            <button className="w-full text-left bg-black text-white p-3 rounded-2xl font-medium">
              Nuevo Proyecto
            </button>
            <button className="w-full text-left hover:bg-gray-100 p-3 rounded-2xl text-gray-700">
              Historial
            </button>
            <button className="w-full text-left hover:bg-gray-100 p-3 rounded-2xl text-gray-700">
              Reportes PDF
            </button>
            <button className="w-full text-left hover:bg-gray-100 p-3 rounded-2xl text-gray-700">
              Simulaciones
            </button>
            <button className="w-full text-left hover:bg-gray-100 p-3 rounded-2xl text-gray-700">
              Configuración
            </button>
          </nav>
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center font-bold">
              A
            </div>
            <div>
              <p className="font-medium text-gray-800">Abraham</p>
              <p className="text-sm text-gray-500">Investigador</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-8 bg-gray-100 border-b shrink-0">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Nuevo Proyecto SHIP
            </h2>
            <p className="text-gray-500 mt-1">
              Generación de análisis técnico mediante IA
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleSubmit}
              className="bg-white border px-5 py-2 rounded-2xl hover:bg-gray-50"
            >
              Guardar borrador
            </button>

            <button
              onClick={handleSubmit}
              className="bg-black text-white px-5 py-2 rounded-2xl hover:opacity-90"
            >
              Generar reporte
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="grid grid-cols-4 gap-5 mb-8">
            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Proyectos</p>
              <h3 className="text-3xl font-bold mt-2">12</h3>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Reportes generados</p>
              <h3 className="text-3xl font-bold mt-2">34</h3>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Sistemas simulados</p>
              <h3 className="text-3xl font-bold mt-2">58</h3>
            </div>

            <div className="bg-white rounded-3xl p-5 shadow-sm border">
              <p className="text-gray-500 text-sm">Precisión promedio</p>
              <h3 className="text-3xl font-bold mt-2">91%</h3>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">
              Parámetros del sistema
            </h3>

            <div className="grid grid-cols-2 gap-5">
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Nombre del proyecto"
              />
              <input
                name="industria"
                value={formData.industria}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Industria"
              />
              <input
                name="pais"
                value={formData.pais}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="País"
              />
              <input
                name="ciudad"
                value={formData.ciudad}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Ciudad"
              />
              <input
                name="combustible"
                value={formData.combustible}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Combustible actual"
              />
              <input
                name="precioCombustible"
                value={formData.precioCombustible}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Precio combustible"
              />

              <select
                name="unidadPrecio"
                value={formData.unidadPrecio}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Unidad precio</option>
                <option value="MXN/kWh">MXN/kWh</option>
                <option value="MXN/L">MXN/L</option>
              </select>

              <input
                name="areaDisponible"
                value={formData.areaDisponible}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Área disponible m²"
              />
              <input
                name="modeloColector"
                value={formData.modeloColector}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Modelo colector"
              />
              <input
                name="fluido"
                value={formData.fluido}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Fluido"
              />

              <select
                name="tipoCircuito"
                value={formData.tipoCircuito}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Tipo de circuito</option>
                <option value="Circuito cerrado">Circuito cerrado</option>
                <option value="Circuito abierto">Circuito abierto</option>
              </select>

              <input
                name="presion"
                value={formData.presion}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Presión bar"
              />
              <input
                name="temperaturaEntrada"
                value={formData.temperaturaEntrada}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Temperatura entrada °C"
              />
              <input
                name="temperaturaSalida"
                value={formData.temperaturaSalida}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Temperatura salida °C"
              />
              <input
                name="demanda"
                value={formData.demanda}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Demanda"
              />

              <select
                name="unidadDemanda"
                value={formData.unidadDemanda}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="">Unidad demanda</option>
                <option value="L/día">L/día</option>
                <option value="kWh/día">kWh/día</option>
                <option value="kg/h">kg/h</option>
              </select>

              <input
                name="horarioInicio"
                value={formData.horarioInicio}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Hora inicio (07:00)"
              />
              <input
                name="horarioFin"
                value={formData.horarioFin}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Hora final (18:00)"
              />
              <input
                name="diasOperacion"
                value={formData.diasOperacion}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Días operación por semana"
              />
              <input
                name="mesesOperacion"
                value={formData.mesesOperacion}
                onChange={handleChange}
                className="border rounded-2xl p-4 text-gray-800 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black"
                placeholder="Meses operación al año"
              />
            </div>

            <div className="flex justify-end mt-8 gap-4">
              <button className="border px-6 py-3 rounded-2xl hover:bg-gray-100">
                Cancelar
              </button>

              <button
                onClick={handleSubmit}
                className="bg-black text-white px-6 py-3 rounded-2xl hover:opacity-90"
              >
                Guardar proyecto
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
