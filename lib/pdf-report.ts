import puppeteer from "puppeteer";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonRecord = Record<string, JsonValue>;

type ProjectReportData = {
  id: number | string;
  nombre: string;
  industria: string;
  pais: string;
  ciudad: string;
  createdAt?: string;
  inputJson: JsonRecord;
  resultJson: JsonRecord;
};

export async function createShipReportPdf(project: ProjectReportData) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(createReportHtml(project), {
      waitUntil: "domcontentloaded",
    });

    return Buffer.from(
      await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: {
          top: "18mm",
          right: "16mm",
          bottom: "18mm",
          left: "16mm",
        },
      }),
    );
  } finally {
    await browser.close();
  }
}

function createReportHtml(project: ProjectReportData) {
  const input = project.inputJson;
  const result = project.resultJson;
  const demandDailyKwh = estimateDailyDemandKwh(input, result);
  const projection = findValue(result, [
    "financiero.proyeccion10Anios",
    "financiero.proyeccion20Anios",
    "financiero.flujoCaja",
  ]);

  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <style>
      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        color: #0a2147;
        font-family: Arial, Helvetica, sans-serif;
        font-size: 12px;
        line-height: 1.45;
      }

      .cover {
        min-height: 255px;
        padding: 34px 38px;
        color: white;
        background: linear-gradient(135deg, #072754, #0b63e5);
      }

      .brand {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 24px;
      }

      .ship {
        font-size: 34px;
        font-weight: 800;
        letter-spacing: 0;
      }

      .badge {
        display: inline-block;
        margin-left: 8px;
        padding: 3px 8px;
        border-radius: 999px;
        background: #10b981;
        font-size: 13px;
        vertical-align: middle;
      }

      .cimav {
        text-align: right;
        font-size: 13px;
        font-weight: 700;
      }

      .cimav span {
        display: block;
        margin-top: 4px;
        max-width: 230px;
        color: #dbeafe;
        font-size: 10px;
        font-weight: 400;
      }

      .cover h1 {
        margin: 42px 0 10px;
        max-width: 620px;
        font-size: 30px;
        line-height: 1.1;
      }

      .cover p {
        max-width: 620px;
        margin: 0;
        color: #e0f2fe;
        font-size: 14px;
      }

      .meta-strip {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 1px;
        background: #cbd5e1;
        border-bottom: 1px solid #cbd5e1;
      }

      .meta-strip div {
        min-height: 58px;
        padding: 12px 14px;
        background: #f8fafc;
      }

      .label {
        display: block;
        margin-bottom: 4px;
        color: #64748b;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
      }

      .value {
        color: #0a2147;
        font-size: 12px;
        font-weight: 700;
      }

      main {
        padding: 24px 0 0;
      }

      section {
        margin: 0 0 22px;
        break-inside: avoid;
      }

      .section-title {
        margin: 0 0 12px;
        padding: 8px 12px;
        color: white;
        background: #092c5f;
        border-radius: 3px;
        font-size: 14px;
      }

      .subsection-title {
        margin: 16px 0 8px;
        color: #092c5f;
        font-size: 12px;
      }

      .grid {
        display: grid;
        gap: 10px;
      }

      .grid-2 {
        grid-template-columns: repeat(2, 1fr);
      }

      .metrics {
        grid-template-columns: repeat(3, 1fr);
      }

      .metric {
        min-height: 72px;
        padding: 12px;
        border: 1px solid #dbe3ef;
        border-left: 4px solid #0b63e5;
        border-radius: 6px;
        background: #f8fbff;
      }

      .metric strong {
        display: block;
        color: #092c5f;
        font-size: 17px;
        line-height: 1.15;
      }

      .metric span {
        display: block;
        margin-top: 6px;
        color: #64748b;
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        break-inside: avoid;
      }

      th {
        padding: 8px;
        color: white;
        background: #0b63e5;
        font-size: 10px;
        text-align: left;
      }

      td {
        padding: 7px 8px;
        border: 1px solid #dbe3ef;
        color: #334155;
        vertical-align: top;
      }

      tr:nth-child(even) td {
        background: #f8fafc;
      }

      .kv td:first-child {
        width: 34%;
        color: #092c5f;
        font-weight: 700;
      }

      .note {
        padding: 12px 14px;
        border: 1px solid #bae6fd;
        border-left: 4px solid #0284c7;
        border-radius: 6px;
        background: #f0f9ff;
        color: #334155;
      }

      .chart-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .chart-card {
        break-inside: avoid;
        padding: 12px;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
        background: #ffffff;
      }

      .chart-card h3 {
        margin: 0 0 8px;
        color: #092c5f;
        font-size: 11px;
      }

      .chart-card svg {
        display: block;
        width: 100%;
        height: auto;
      }

      .legend {
        display: flex;
        gap: 12px;
        margin-top: 6px;
        color: #64748b;
        font-size: 9px;
      }

      .legend span::before {
        content: "";
        display: inline-block;
        width: 8px;
        height: 8px;
        margin-right: 4px;
        border-radius: 2px;
        vertical-align: -1px;
      }

      .legend .solar::before {
        background: #0b63e5;
      }

      .legend .demand::before {
        background: #94a3b8;
      }

      .legend .cash::before {
        background: #10b981;
      }

      ul {
        margin: 8px 0 0;
        padding-left: 18px;
      }

      li {
        margin: 3px 0;
      }

      .page-break {
        break-before: page;
      }

      footer {
        position: fixed;
        right: 16mm;
        bottom: 8mm;
        left: 16mm;
        display: flex;
        justify-content: space-between;
        border-top: 1px solid #cbd5e1;
        padding-top: 5px;
        color: #64748b;
        font-size: 9px;
      }
    </style>
  </head>
  <body>
    <footer>
      <span>SHIP IA - Reporte tecnico preliminar</span>
      <span>CIMAV</span>
    </footer>

    <div class="cover">
      <div class="brand">
        <div class="ship">SHIP<span class="badge">IA</span></div>
        <div class="cimav">
          CIMAV
          <span>Centro de Investigacion en Materiales Avanzados</span>
        </div>
      </div>
      <h1>Reporte tecnico de simulacion SHIP</h1>
      <p>${escapeHtml(project.nombre)}</p>
    </div>

    <div class="meta-strip">
      ${metaBox("Proyecto", project.nombre)}
      ${metaBox("Industria", value(input, ["industria"], project.industria))}
      ${metaBox("Ubicacion", `${project.ciudad}, ${project.pais}`)}
      ${metaBox("Fecha", project.createdAt || "No disponible")}
    </div>

    <main>
      ${section(
        "1. Datos generales del proyecto",
        keyValueTable([
          ["Pais", value(input, ["pais"], project.pais)],
          ["Ciudad", value(input, ["ciudad"], project.ciudad)],
          [
            "Combustible actual",
            value(input, ["combustible", "combustible_actual"], "-"),
          ],
          [
            "Precio de combustible",
            `${value(input, ["precioCombustible", "precio_combustible"], "-")} ${value(input, ["unidadPrecio", "unidad_precio"], "")}`,
          ],
          [
            "Area disponible",
            `${value(input, ["areaDisponible", "area_m2"], "-")} m2`,
          ],
          ["Tipo de analisis", "Prefactibilidad SHIP asistida por IA"],
        ]),
      )}

      ${section(
        "2. Datos del proceso",
        keyValueTable([
          [
            "Modelo del colector",
            value(input, ["modeloColector", "modelo_colector"], "-"),
          ],
          ["Fluido", value(input, ["fluido"], "-")],
          [
            "Presion",
            `${value(input, ["presion", "presion_bar"], "-")} ${value(input, ["unidadPresion"], "bar")}`,
          ],
          [
            "Tipo de circuito",
            value(input, ["tipoCircuito", "tipo_circuito"], "-"),
          ],
          [
            "Temperatura de entrada",
            `${value(input, ["temperaturaEntrada", "temperatura_entrada_c"], "-")} °C`,
          ],
          [
            "Temperatura de salida",
            `${value(input, ["temperaturaSalida", "temperatura_salida_c"], "-")} °C`,
          ],
          [
            "Demanda",
            `${value(input, ["demanda"], "-")} ${value(input, ["unidadDemanda", "unidad_demanda"], "")}`,
          ],
          [
            "Horario",
            `${value(input, ["horarioInicio", "hora_inicio"], "-")} - ${value(input, ["horarioFin", "hora_final"], "-")}`,
          ],
        ]),
      )}

      ${section(
        "3. Resumen ejecutivo",
        `<div class="note">${escapeHtml(
          stringValue(
            findValue(result, [
              "analisis.resumenEjecutivo",
              "analisis.resumen_ejecutivo",
              "analisis.viabilidadTecnica",
            ]),
            "El sistema fue evaluado como prefactibilidad tecnica y economica para integracion de calor solar de proceso.",
          ),
        )}</div>
        <div class="grid metrics" style="margin-top: 12px;">
          ${metric("Fraccion solar", percentValue(findValue(result, ["produccion.fraccionSolarPorcentaje", "produccion.configuracionSeleccionada.fraccionSolarPorcentaje", "produccion.fraccion_solar_porcentaje", "produccion.fraccionSolar", "produccion.seleccion.fraccionSolar", "produccion.seleccionada.fraccionSolar"])))}
          ${metric("Produccion util", energyValue(findValue(result, ["produccion.produccionSolarUtilKwhAnio", "produccion.configuracionSeleccionada.produccionSolarUtilKwhAnio", "produccion.produccionSuministradaKwhAnio", "produccion.produccion_solar_util", "produccion.produccionSolarUtilAnualKwh", "produccion.seleccion.produccionSolarUtil", "produccion.seleccionada.produccionSolarUtil"])))}
          ${metric("Demanda diaria", dailyEnergyValue(findValue(result, ["produccion.demandaEnergeticaKwhDia", "proceso.demandaEnergeticaKwhDia", "proceso.demandaEnergetica"]) ?? demandDailyKwh))}
          ${metric("Area instalada", areaValue(findValue(result, ["produccion.areaInstaladaM2", "produccion.configuracionSeleccionada.areaInstaladaM2", "solar.configuracionSeleccionada.areaInstaladaM2", "solar.areaInstaladaM2", "solar.area_recomendada_m2", "arregloSolar.areaCaptacionSolarM2", "arregloSolar.areaOcupacionM2", "produccion.seleccion.areaInstalada", "produccion.seleccionada.areaInstalada"])))}
          ${metric("Colectores", formatValue(findValue(result, ["produccion.numeroColectores", "produccion.configuracionSeleccionada.numeroColectores", "solar.configuracionSeleccionada.numeroColectores", "solar.numeroColectores", "solar.numero_de_colectores", "arregloSolar.totalColectores", "produccion.seleccion.numColectores", "produccion.seleccionada.numeroColectores"])))}
          ${metric("Almacenamiento", volumeValue(findValue(result, ["produccion.almacenamientoLitros", "produccion.configuracionSeleccionada.almacenamientoLitros", "solar.configuracionSeleccionada.almacenamientoLitros", "solar.almacenamientoLitros", "almacenamiento.volumenLitros", "almacenamiento.volumen_litros", "produccion.seleccion.volumenAlmacenamiento", "produccion.seleccionada.almacenamiento"])))}
          ${metric("Inversion", moneyValue(findValue(result, ["financiero.inversionTotal", "financiero.resumen.inversionTotal", "financiero.inversion_total", "produccion.configuracionSeleccionada.inversionTotal", "produccion.seleccion.inversionMXN", "produccion.seleccionada.inversion"])))}
          ${metric("Retorno", yearsValue(findValue(result, ["financiero.periodoRetornoSimpleAnios", "financiero.resumen.retornoAnio", "financiero.resumen.retornoSimpleAnios", "financiero.payback", "financiero.periodo_retorno", "produccion.configuracionSeleccionada.periodoRetornoSimpleAnios", "produccion.seleccion.periodoRetorno", "produccion.seleccionada.periodoRetorno"])))}
          ${metric("TIR", percentValue(findValue(result, ["financiero.tirPorcentaje", "financiero.tir", "financiero.TIR", "produccion.configuracionSeleccionada.tirPorcentaje", "produccion.seleccion.TIR", "produccion.seleccionada.TIR"])))}
        </div>`,
      )}

      ${section(
        "4. Configuracion solar seleccionada",
        `${keyValueTable([
          [
            "Colector",
            findValue(result, [
              "solar.colector.modelo",
              "solar.modeloColector",
              "arregloSolar.colector.modelo",
              "arregloSolar.colector.aliasReporteTecnico",
            ]),
          ],
          [
            "Area de captacion",
            areaValue(
              findValue(result, [
                "produccion.areaInstaladaM2",
                "produccion.configuracionSeleccionada.areaInstaladaM2",
                "solar.configuracionSeleccionada.areaInstaladaM2",
                "solar.areaInstaladaM2",
                "solar.areaCaptacionM2",
                "arregloSolar.areaCaptacionSolarM2",
                "produccion.seleccion.areaInstalada",
                "produccion.seleccionada.areaInstalada",
              ]),
            ),
          ],
          [
            "Numero de colectores",
            findValue(result, [
              "produccion.numeroColectores",
              "produccion.configuracionSeleccionada.numeroColectores",
              "solar.configuracionSeleccionada.numeroColectores",
              "solar.numeroColectores",
              "arregloSolar.totalColectores",
              "produccion.seleccion.numColectores",
              "produccion.seleccionada.numeroColectores",
            ]),
          ],
          [
            "Produccion especifica",
            specificEnergyValue(
              findValue(result, [
                "produccion.produccionEspecificaUtilKwhM2Anio",
                "produccion.configuracionSeleccionada.produccionEspecificaUtilKwhM2Anio",
                "solar.produccionEspecificaKwhM2Anio",
                "produccion.seleccion.produccionEspecifica",
                "produccion.seleccionada.produccionEspecificaUtil",
              ]),
            ),
          ],
        ])}
        ${configurationsTable(findValue(result, ["produccion.configuraciones", "solar.configuracionesEvaluadas"]))}`,
      )}

      ${section(
        "5. Produccion energetica",
        keyValueTable([
          [
            "Radiacion disponible anual",
            specificEnergyValue(
              findValue(result, [
                "produccion.radiacionDisponibleKwhM2Anio",
                "solar.radiacionDisponibleKwhM2Anio",
              ]),
            ),
          ],
          [
            "Radiacion media diaria",
            dailySolarValue(
              findValue(result, [
                "solar.TMY.radiacionMediaAnual",
                "solar.tmy.radiacionMediaAnual",
                "solar.irradianciaPromedioAnual",
              ]),
            ),
          ],
          [
            "Produccion suministrada",
            energyValue(
              findValue(result, [
                "produccion.produccionSolarUtilKwhAnio",
                "produccion.configuracionSeleccionada.produccionSolarUtilKwhAnio",
                "produccion.produccionSuministradaKwhAnio",
                "produccion.produccion_suministrada_kwh_anio",
                "produccion.seleccion.produccionSolarUtil",
                "produccion.seleccionada.produccionSolarUtil",
              ]),
            ),
          ],
          [
            "Fraccion solar",
            percentValue(
              findValue(result, [
                "produccion.fraccionSolarPorcentaje",
                "produccion.configuracionSeleccionada.fraccionSolarPorcentaje",
                "produccion.fraccion_solar_porcentaje",
                "produccion.fraccionSolar",
                "produccion.seleccion.fraccionSolar",
                "produccion.seleccionada.fraccionSolar",
              ]),
            ),
          ],
          [
            "Produccion especifica",
            specificEnergyValue(
              findValue(result, [
                "produccion.produccionEspecificaUtilKwhM2Anio",
                "produccion.configuracionSeleccionada.produccionEspecificaUtilKwhM2Anio",
                "produccion.seleccion.produccionEspecifica",
                "produccion.seleccionada.produccionEspecificaUtil",
              ]),
            ),
          ],
        ]),
      )}

      <div class="page-break"></div>

      ${section(
        "6. Analisis financiero",
        `${keyValueTable([
          ["Moneda", findValue(result, ["financiero.moneda"])],
          [
            "Factura actual anual",
            moneyValue(
              findValue(result, [
                "financiero.resumen.facturaActualAnio1",
                "financiero.facturaActualAnual",
              ]),
            ),
          ],
          [
            "Ahorro solar anual",
            moneyValue(
              findValue(result, [
                "financiero.ahorroSolarAnual",
                "financiero.resumen.ahorroSolarAnio1",
                "financiero.resumen.ahorroSolarAnual",
                "financiero.ahorroAnual",
                "produccion.configuracionSeleccionada.ahorroAnual",
                "produccion.seleccion.ahorroAnualMXN",
                "produccion.seleccionada.ahorroAnual",
              ]),
            ),
          ],
          [
            "Inversion total",
            moneyValue(
              findValue(result, [
                "financiero.inversionTotal",
                "financiero.resumen.inversionTotal",
                "produccion.configuracionSeleccionada.inversionTotal",
                "produccion.seleccion.inversionMXN",
                "produccion.seleccionada.inversion",
              ]),
            ),
          ],
          [
            "O&M anual",
            moneyValue(
              findValue(result, [
                "financiero.opexAnualEstimado",
                "financiero.desgloseInversion.operacionMantenimientoAnual",
                "financiero.opexAnual",
              ]) ?? estimateAnnualOpex(result),
            ),
          ],
          [
            "Periodo de retorno",
            yearsValue(
              findValue(result, [
                "financiero.periodoRetornoSimpleAnios",
                "financiero.resumen.retornoAnio",
                "financiero.resumen.retornoSimpleAnios",
                "financiero.payback",
                "produccion.configuracionSeleccionada.periodoRetornoSimpleAnios",
                "produccion.seleccion.periodoRetorno",
                "produccion.seleccionada.periodoRetorno",
              ]),
            ),
          ],
          [
            "TIR",
            percentValue(
              findValue(result, [
                "financiero.tirPorcentaje",
                "financiero.resumen.tirPorcentaje",
                "financiero.tir",
                "produccion.configuracionSeleccionada.tirPorcentaje",
                "produccion.seleccion.TIR",
                "produccion.seleccionada.TIR",
              ]),
            ),
          ],
          [
            "VAN",
            moneyValue(
              findValue(result, [
                "financiero.van",
                "financiero.VAN",
                "financiero.npv",
                "produccion.configuracionSeleccionada.van",
                "produccion.seleccion.VAN",
                "produccion.seleccionada.VAN",
              ]),
            ),
          ],
        ])}
        ${Array.isArray(projection) ? projectionTable(projection) : ""}`,
      )}

      ${section("7. Graficas de resultados", chartsSection(result))}

      ${section(
        "8. Analisis tecnico y recomendaciones",
        `<h3 class="subsection-title">Viabilidad tecnica</h3>
        <p>${escapeHtml(stringValue(findValue(result, ["analisis.viabilidadTecnica", "analisis.viabilidad_tecnica"]), "No disponible."))}</p>
        <h3 class="subsection-title">Viabilidad economica</h3>
        <p>${escapeHtml(stringValue(findValue(result, ["analisis.viabilidadEconomica", "analisis.viabilidad_economica"]), "No disponible."))}</p>
        <h3 class="subsection-title">Recomendaciones</h3>
        ${bulletList(asStringArray(findValue(result, ["analisis.recomendaciones"])))}
        <h3 class="subsection-title">Limitaciones</h3>
        ${bulletList(asStringArray(findValue(result, ["analisis.limitaciones"])))}`,
      )}

    </main>
  </body>
</html>`;
}

function section(title: string, content: string) {
  return `<section><h2 class="section-title">${escapeHtml(title)}</h2>${content}</section>`;
}

function metaBox(label: string, value: unknown) {
  return `<div><span class="label">${escapeHtml(label)}</span><span class="value">${escapeHtml(formatValue(value))}</span></div>`;
}

function metric(label: string, value: unknown) {
  return `<div class="metric"><strong>${escapeHtml(formatValue(value))}</strong><span>${escapeHtml(label)}</span></div>`;
}

function keyValueTable(rows: [string, unknown][]) {
  const visibleRows = rows.filter(
    ([, value]) => formatValue(value) !== "No disponible",
  );

  if (visibleRows.length === 0) return "";

  return `<table class="kv"><tbody>${visibleRows
    .map(
      ([label, value]) =>
        `<tr><td>${escapeHtml(label)}</td><td>${escapeHtml(formatValue(value))}</td></tr>`,
    )
    .join("")}</tbody></table>`;
}

function projectionTable(rows: JsonValue[]) {
  return `<h3 class="subsection-title">Proyeccion financiera</h3>
  <table>
    <thead>
      <tr>
        <th>Anio</th>
        <th>Factura trad.</th>
        <th>Factura solar</th>
        <th>Ahorro</th>
        <th>Flujo acum.</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .slice(0, 10)
        .map((row) => {
          const record = isRecord(row) ? row : {};
          return `<tr>
            <td>${escapeHtml(formatValue(record.anio))}</td>
            <td>${escapeHtml(moneyValue(record.facturaTradicional))}</td>
            <td>${escapeHtml(moneyValue(record.facturaConSolar))}</td>
            <td>${escapeHtml(moneyValue(record.ahorroSolar))}</td>
            <td>${escapeHtml(moneyValue(record.flujoAcumulado))}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>`;
}

function configurationsTable(value: unknown) {
  if (!Array.isArray(value) || value.length === 0) return "";

  return `<h3 class="subsection-title">Configuraciones evaluadas</h3>
  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Area</th>
        <th>Colectores</th>
        <th>Almacenamiento</th>
        <th>Produccion util</th>
        <th>Fraccion solar</th>
        <th>Inversion</th>
        <th>Retorno</th>
      </tr>
    </thead>
    <tbody>
      ${value
        .slice(0, 8)
        .map((row) => {
          const record = isRecord(row) ? row : {};
          return `<tr>
            <td>${escapeHtml(formatValue(record.id))}</td>
            <td>${escapeHtml(areaValue(record.areaInstaladaM2 ?? record.areaInstalada))}</td>
            <td>${escapeHtml(formatValue(record.numeroColectores ?? record.numColectores))}</td>
            <td>${escapeHtml(volumeValue(record.almacenamientoLitros ?? record.volumenAlmacenamiento ?? record.almacenamiento))}</td>
            <td>${escapeHtml(energyValue(record.produccionSolarUtilKwhAnio ?? record.produccionSolarUtil))}</td>
            <td>${escapeHtml(percentValue(record.fraccionSolarPorcentaje ?? record.fraccionSolar))}</td>
            <td>${escapeHtml(moneyValue(record.inversionTotal ?? record.inversionMXN ?? record.inversion))}</td>
            <td>${escapeHtml(yearsValue(record.periodoRetornoSimpleAnios ?? record.periodoRetorno))}</td>
          </tr>`;
        })
        .join("")}
    </tbody>
  </table>`;
}

function chartsSection(result: JsonRecord) {
  const monthly = findValue(result, ["graficas.produccionMensual"]);
  const cashFlow = findValue(result, ["graficas.flujoCaja"]);
  const comparison = findValue(result, ["graficas.comparacionConfiguraciones"]);
  const solarFraction = findValue(result, ["produccion.fraccionSolar"]);

  return `<div class="chart-grid">
    <div class="chart-card">
      <h3>Produccion solar util vs demanda</h3>
      ${monthlyBars(Array.isArray(monthly) ? monthly : [])}
      <div class="legend"><span class="demand">Demanda</span><span class="solar">Solar util</span></div>
    </div>
    <div class="chart-card">
      <h3>Fraccion solar</h3>
      ${solarDonut(toNumber(solarFraction) ?? 0)}
      <div class="legend"><span class="solar">Solar</span><span class="demand">Auxiliar</span></div>
    </div>
    <div class="chart-card">
      <h3>Comparacion de configuraciones</h3>
      ${comparisonBars(Array.isArray(comparison) ? comparison : [])}
      <div class="legend"><span class="solar">Produccion util</span><span class="demand">Inversion</span></div>
    </div>
    <div class="chart-card">
      <h3>Flujo de caja acumulado</h3>
      ${cashFlowLine(Array.isArray(cashFlow) ? cashFlow : [])}
      <div class="legend"><span class="cash">Flujo acumulado</span></div>
    </div>
  </div>`;
}

function monthlyBars(rows: JsonValue[]) {
  const data = rows
    .filter(isRecord)
    .slice(0, 12)
    .map((row) => ({
      label: monthAbbrev(formatValue(row.mes)),
      demand: toNumber(row.demandaKwh) ?? 0,
      solar: toNumber(row.solarUtilKwh) ?? 0,
    }));
  const max = Math.max(1, ...data.flatMap((row) => [row.demand, row.solar]));
  const width = 360;
  const height = 180;
  const chartHeight = 120;
  const groupWidth = (width - 30) / Math.max(data.length, 1);

  return `<svg viewBox="0 0 ${width} ${height}" role="img">
    <line x1="24" y1="10" x2="24" y2="132" stroke="#cbd5e1" stroke-width="1" />
    <line x1="24" y1="132" x2="350" y2="132" stroke="#cbd5e1" stroke-width="1" />
    ${data
      .map((row, index) => {
        const x = 28 + index * groupWidth;
        const demandHeight = (row.demand / max) * chartHeight;
        const solarHeight = (row.solar / max) * chartHeight;
        return `<rect x="${x}" y="${132 - demandHeight}" width="8" height="${demandHeight}" fill="#94a3b8" />
          <rect x="${x + 10}" y="${132 - solarHeight}" width="8" height="${solarHeight}" fill="#0b63e5" />
          <text x="${x + 7}" y="150" text-anchor="middle" font-size="8" fill="#64748b">${escapeSvg(row.label)}</text>`;
      })
      .join("")}
    <text x="24" y="170" font-size="8" fill="#64748b">kWh/mes</text>
  </svg>`;
}

function solarDonut(fractionValue: number) {
  const fraction = Math.max(
    0,
    Math.min(1, fractionValue > 1 ? fractionValue / 100 : fractionValue),
  );
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - fraction);

  return `<svg viewBox="0 0 220 180" role="img">
    <circle cx="110" cy="84" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="22" />
    <circle cx="110" cy="84" r="${radius}" fill="none" stroke="#0b63e5" stroke-width="22"
      stroke-dasharray="${circumference}" stroke-dashoffset="${offset}" transform="rotate(-90 110 84)" />
    <text x="110" y="80" text-anchor="middle" font-size="24" font-weight="700" fill="#092c5f">${numberFormat(fraction * 100, 1)}%</text>
    <text x="110" y="101" text-anchor="middle" font-size="10" fill="#64748b">fraccion solar</text>
  </svg>`;
}

function comparisonBars(rows: JsonValue[]) {
  const data = rows
    .filter(isRecord)
    .slice(0, 6)
    .map((row, index) => ({
      label: formatValue(row.nombre || `C${index + 1}`).slice(0, 12),
      production: toNumber(row.produccionSolarUtilKwhAnio) ?? 0,
      investment: toNumber(row.inversionTotal) ?? 0,
    }));
  const maxProduction = Math.max(1, ...data.map((row) => row.production));
  const maxInvestment = Math.max(1, ...data.map((row) => row.investment));
  const width = 360;
  const rowHeight = 23;
  const height = Math.max(150, data.length * rowHeight + 34);

  return `<svg viewBox="0 0 ${width} ${height}" role="img">
    ${data
      .map((row, index) => {
        const y = 16 + index * rowHeight;
        const productionWidth = (row.production / maxProduction) * 120;
        const investmentWidth = (row.investment / maxInvestment) * 120;
        return `<text x="4" y="${y + 9}" font-size="8" fill="#475569">${escapeSvg(row.label)}</text>
          <rect x="86" y="${y}" width="${productionWidth}" height="8" fill="#0b63e5" />
          <rect x="86" y="${y + 10}" width="${investmentWidth}" height="8" fill="#94a3b8" />
          <text x="${90 + Math.max(productionWidth, investmentWidth)}" y="${y + 9}" font-size="8" fill="#64748b">${numberFormat(row.production, 0)} kWh</text>`;
      })
      .join("")}
  </svg>`;
}

function cashFlowLine(rows: JsonValue[]) {
  const data = rows
    .filter(isRecord)
    .slice(0, 20)
    .map((row) => ({
      year: toNumber(row.anio) ?? 0,
      value: toNumber(row.flujoAcumulado) ?? 0,
    }));
  const width = 360;
  const height = 180;
  const min = Math.min(0, ...data.map((row) => row.value));
  const max = Math.max(1, ...data.map((row) => row.value));
  const range = max - min || 1;
  const points = data
    .map((row, index) => {
      const x = 28 + (index / Math.max(data.length - 1, 1)) * 310;
      const y = 132 - ((row.value - min) / range) * 110;
      return `${x},${y}`;
    })
    .join(" ");
  const zeroY = 132 - ((0 - min) / range) * 110;

  return `<svg viewBox="0 0 ${width} ${height}" role="img">
    <line x1="24" y1="132" x2="350" y2="132" stroke="#cbd5e1" stroke-width="1" />
    <line x1="24" y1="${zeroY}" x2="350" y2="${zeroY}" stroke="#f97316" stroke-width="1" stroke-dasharray="4 3" />
    <polyline points="${points}" fill="none" stroke="#10b981" stroke-width="3" />
    ${data
      .filter(
        (_, index) =>
          index === 0 || index === data.length - 1 || (index + 1) % 5 === 0,
      )
      .map((row) => {
        const originalIndex = data.indexOf(row);
        const x = 28 + (originalIndex / Math.max(data.length - 1, 1)) * 310;
        return `<text x="${x}" y="150" text-anchor="middle" font-size="8" fill="#64748b">${row.year}</text>`;
      })
      .join("")}
    <text x="24" y="170" font-size="8" fill="#64748b">MXN acumulados</text>
  </svg>`;
}

function bulletList(items: string[]) {
  if (items.length === 0) return "";
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`;
}

function value(source: JsonRecord, keys: string[], fallback: unknown) {
  return (
    keys
      .map((key) => source[key])
      .find((item) => item !== undefined && item !== "") ?? fallback
  );
}

function findValue(source: JsonRecord, paths: string[]) {
  for (const path of paths) {
    const found = getPath(source, path);
    if (found !== undefined && found !== null && found !== "") return found;
  }
  return undefined;
}

function getPath(source: JsonRecord, path: string) {
  return path.split(".").reduce<unknown>((current, part) => {
    if (!isRecord(current)) return undefined;
    return current[part];
  }, source);
}

function estimateDailyDemandKwh(input: JsonRecord, result: JsonRecord) {
  const demandLiters = toNumber(
    findValue(result, ["proceso.demandaDiaria", "proceso.demandaVolumen"]) ??
      value(input, ["demanda"], undefined),
  );
  const inlet = toNumber(
    findValue(result, ["proceso.temperaturaEntrada", "proceso.tempEntrada"]) ??
      value(input, ["temperaturaEntrada"], undefined),
  );
  const outlet = toNumber(
    findValue(result, ["proceso.temperaturaSalida", "proceso.tempSalida"]) ??
      value(input, ["temperaturaSalida"], undefined),
  );

  if (
    demandLiters === undefined ||
    inlet === undefined ||
    outlet === undefined
  ) {
    return undefined;
  }

  return (demandLiters * 4.186 * (outlet - inlet)) / 3600;
}

function estimateAnnualOpex(result: JsonRecord) {
  const investment = toNumber(
    findValue(result, [
      "financiero.resumen.inversionTotal",
      "financiero.inversionTotal",
      "produccion.seleccion.inversionMXN",
      "produccion.configuracionSeleccionada.inversion",
    ]),
  );
  const opexRatio = toNumber(
    findValue(result, [
      "financiero.costoOperacionMantenimientoAnualRelativo",
      "financiero.costoOperacionMantenimientoAnual",
      "financiero.costoOperacionMantenimientoPorc",
    ]),
  );

  if (investment === undefined || opexRatio === undefined) return undefined;
  return investment * opexRatio;
}

function asStringArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.map(formatValue).filter((item) => item !== "No disponible");
}

function stringValue(value: unknown, fallback: string) {
  const formatted = formatValue(value);
  return formatted === "No disponible" ? fallback : formatted;
}

function moneyValue(value: unknown) {
  if (typeof value === "number") return `$${numberFormat(value)}`;
  const formatted = formatValue(value);
  return formatted === "No disponible" || formatted.startsWith("$")
    ? formatted
    : `$${formatted}`;
}

function energyValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value)} kWh/año`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} kWh/año`;
}

function dailyEnergyValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value)} kWh/día`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} kWh/día`;
}

function specificEnergyValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value)} kWh/m²-año`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} kWh/m²-año`;
}

function dailySolarValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value)} kWh/m²-día`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} kWh/m²-día`;
}

function percentValue(value: unknown) {
  if (typeof value === "number") {
    const percent = value <= 1 ? value * 100 : value;
    return `${numberFormat(percent, 1)}%`;
  }
  const formatted = formatValue(value);
  return formatted === "No disponible" || formatted.includes("%")
    ? formatted
    : `${formatted}%`;
}

function areaValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value, 1)} m²`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} m²`;
}

function volumeValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value, 0)} L`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} L`;
}

function yearsValue(value: unknown) {
  if (typeof value === "number") return `${numberFormat(value, 1)} años`;
  const formatted = formatValue(value);
  return formatted === "No disponible" ? formatted : `${formatted} años`;
}

function numberFormat(value: number, digits = 1) {
  return new Intl.NumberFormat("es-MX", {
    maximumFractionDigits: digits,
    minimumFractionDigits: value % 1 === 0 ? 0 : digits,
  }).format(value);
}

function monthAbbrev(value: string) {
  return value.slice(0, 3);
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "")
    return "No disponible";
  if (typeof value === "boolean") return value ? "Sí" : "No";
  if (typeof value === "number")
    return Number.isFinite(value) ? numberFormat(value) : "No disponible";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(formatValue).join(", ");
  if (isRecord(value)) {
    return Object.entries(value)
      .slice(0, 6)
      .map(
        ([key, entryValue]) =>
          `${humanizeKey(key)}: ${formatValue(entryValue)}`,
      )
      .join(" | ");
  }
  return String(value);
}

function humanizeKey(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function escapeHtml(value: unknown) {
  return formatValue(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeSvg(value: unknown) {
  return escapeHtml(value);
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
