import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { normalizeShipResult } from "@/lib/ship-result-normalizer";

const configurationSchema = {
  type: "object",
  additionalProperties: true,
  required: [
    "id",
    "nombre",
    "areaInstaladaM2",
    "numeroColectores",
    "almacenamientoLitros",
    "produccionSolarUtilKwhAnio",
    "produccionEspecificaUtilKwhM2Anio",
    "fraccionSolar",
    "fraccionSolarPorcentaje",
    "inversionTotal",
    "ahorroAnual",
    "periodoRetornoSimpleAnios",
    "tirPorcentaje",
    "van",
    "criterio",
  ],
  properties: {
    id: { type: "number" },
    nombre: { type: "string" },
    areaInstaladaM2: { type: "number" },
    numeroColectores: { type: "number" },
    almacenamientoLitros: { type: "number" },
    produccionSolarUtilKwhAnio: { type: "number" },
    produccionEspecificaUtilKwhM2Anio: { type: "number" },
    fraccionSolar: { type: "number" },
    fraccionSolarPorcentaje: { type: "number" },
    inversionTotal: { type: "number" },
    ahorroAnual: { type: "number" },
    periodoRetornoSimpleAnios: { type: "number" },
    tirPorcentaje: { type: "number" },
    van: { type: "number" },
    criterio: { type: "string" },
  },
};

const resultSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "ubicacion",
    "proceso",
    "solar",
    "produccion",
    "financiero",
    "analisis",
    "graficas",
  ],
  properties: {
    ubicacion: { type: "object", additionalProperties: true },
    proceso: { type: "object", additionalProperties: true },
    solar: { type: "object", additionalProperties: true },
    produccion: {
      type: "object",
      additionalProperties: true,
      required: [
        "energiaDemandadaKwhAnio",
        "demandaEnergeticaKwhDia",
        "configuraciones",
        "configuracionSeleccionada",
      ],
      properties: {
        energiaDemandadaKwhAnio: { type: "number" },
        demandaEnergeticaKwhDia: { type: "number" },
        produccionSolarUtilKwhAnio: { type: "number" },
        produccionEspecificaUtilKwhM2Anio: { type: "number" },
        fraccionSolar: { type: "number" },
        fraccionSolarPorcentaje: { type: "number" },
        areaInstaladaM2: { type: "number" },
        numeroColectores: { type: "number" },
        almacenamientoLitros: { type: "number" },
        configuraciones: {
          type: "array",
          minItems: 5,
          items: configurationSchema,
        },
        configuracionSeleccionada: configurationSchema,
      },
    },
    financiero: {
      type: "object",
      additionalProperties: true,
      properties: {
        moneda: { type: "string" },
        facturaActualAnual: { type: "number" },
        ahorroSolarAnual: { type: "number" },
        inversionTotal: { type: "number" },
        opexAnualEstimado: { type: "number" },
        periodoRetornoSimpleAnios: { type: "number" },
        tirPorcentaje: { type: "number" },
        van: { type: "number" },
      },
    },
    analisis: { type: "object", additionalProperties: true },
    graficas: {
      type: "object",
      additionalProperties: true,
      required: [
        "produccionMensual",
        "flujoCaja",
        "comparacionConfiguraciones",
      ],
      properties: {
        produccionMensual: {
          type: "array",
          minItems: 12,
          items: {
            type: "object",
            additionalProperties: true,
            required: ["mes", "demandaKwh", "solarUtilKwh", "energiaAuxiliarKwh"],
            properties: {
              mes: { type: "string" },
              demandaKwh: { type: "number" },
              solarUtilKwh: { type: "number" },
              energiaAuxiliarKwh: { type: "number" },
            },
          },
        },
        flujoCaja: {
          type: "array",
          minItems: 5,
          items: {
            type: "object",
            additionalProperties: true,
            required: ["anio", "flujoNeto", "flujoAcumulado"],
            properties: {
              anio: { type: "number" },
              flujoNeto: { type: "number" },
              flujoAcumulado: { type: "number" },
            },
          },
        },
        comparacionConfiguraciones: {
          type: "array",
          minItems: 5,
          items: {
            type: "object",
            additionalProperties: true,
            required: [
              "nombre",
              "areaInstaladaM2",
              "produccionSolarUtilKwhAnio",
              "inversionTotal",
              "periodoRetornoSimpleAnios",
            ],
            properties: {
              nombre: { type: "string" },
              areaInstaladaM2: { type: "number" },
              produccionSolarUtilKwhAnio: { type: "number" },
              inversionTotal: { type: "number" },
              periodoRetornoSimpleAnios: { type: "number" },
            },
          },
        },
      },
    },
  },
};

const systemPrompt = `
Actúa como una herramienta profesional de prefactibilidad SHIP (Solar Heat for Industrial Processes) similar a SHIPcal del CIMAV.

Genera una simulación preliminar de un sistema solar térmico industrial utilizando únicamente los datos proporcionados por el usuario.

Usa una simulación dinámica horaria basada en un Typical Meteorological Year (TMY) representativo de la ubicación indicada.

Obtén automáticamente los datos climáticos, solares y energéticos necesarios para la ubicación del proyecto, usando valores técnicamente razonables y coherentes con el país, región y ciudad.

Realiza el dimensionamiento mediante un análisis técnico-económico de ciclo de vida LCCA a 20 años.

Optimiza el sistema buscando la mejor relación entre:
- inversión inicial,
- ahorro energético,
- producción solar útil,
- fracción solar,
- almacenamiento térmico,
- costos de operación y mantenimiento,
- periodo de retorno,
- VAN,
- TIR,
- costo nivelado del calor solar,
- y utilización real del sistema.

Jerarquía de selección:
1. Menor periodo de retorno razonable.
2. Mayor TIR relativa.
3. Menor inversión inicial relativa.
4. Producción solar útil suficiente.
5. Alta utilización real del sistema.
6. Fracción solar técnicamente razonable.
7. VAN positivo.

No selecciones una configuración más grande únicamente porque tenga mayor VAN absoluto.

No selecciones una configuración más grande únicamente porque tenga mayor fracción solar.

La fracción solar no debe ser el criterio principal de selección.

El sistema debe dimensionarse económicamente, no por máxima cobertura solar ni por mínima inversión inicial.

No sobredimensiones el sistema.

No subdimensionar el sistema.

No utilices automáticamente toda el área disponible.

El área disponible representa únicamente el límite máximo físico de instalación, no el área que debe instalarse.

No consideres que una configuración no está sobredimensionada solo porque usa un bajo porcentaje del área disponible.

El sobredimensionamiento depende de:
- demanda térmica,
- producción útil,
- almacenamiento,
- excedentes solares,
- utilización del sistema,
- inversión,
- TIR,
- VAN,
- y periodo de retorno.

Regla final de selección económica:

La configuración seleccionada no debe priorizar una fracción solar más alta si esto aumenta considerablemente la inversión y empeora el periodo de retorno.

Si una configuración compacta logra una producción solar útil suficiente con menor inversión y mejor retorno, debe seleccionarse sobre configuraciones más grandes.

Para procesos de demanda térmica diaria pequeña o moderada, el sistema debe preferir configuraciones compactas con alta rentabilidad relativa, aunque la fracción solar no sea máxima.

No selecciones configuraciones con payback alto si existen alternativas menores con producción útil suficiente y mejor retorno económico.

En la selección final, el periodo de retorno simple y la TIR tienen mayor peso que incrementar la fracción solar por encima de un rango razonable.

Una configuración más grande debe descartarse si:
- aumenta mucho la inversión,
- aumenta el almacenamiento,
- reduce la rentabilidad relativa,
- tiene payback mayor,
- reduce la producción específica útil,
- y solo mejora la fracción solar de forma marginal.

Regla estricta de coherencia técnico-económica:

La configuración seleccionada debe tener coherencia entre área instalada, producción solar útil y demanda térmica.

No selecciones configuraciones donde aumentar el área instalada reduzca la producción específica útil del sistema sin una justificación técnica clara.

La producción solar útil específica debe mantenerse en un rango razonable para el tipo de colector, temperatura de operación y ubicación.

Si una configuración de menor área logra producción solar útil similar o mayor que una configuración más grande, selecciona la configuración de menor área, menor inversión y mejor retorno.

Rechaza configuraciones con baja utilización del campo solar, exceso de almacenamiento o inversión elevada si no mejoran claramente la producción útil, el ahorro anual, la TIR o el periodo de retorno.

No selecciones automáticamente la configuración con mayor VAN si esa configuración requiere un aumento considerable de área, almacenamiento e inversión y presenta peor periodo de retorno o menor eficiencia económica marginal.

La configuración seleccionada debe priorizar el menor periodo de retorno razonable y la mejor rentabilidad relativa, siempre que mantenga una producción solar útil suficiente.

Si una configuración menor ya alcanza una fracción solar técnicamente relevante y una producción útil cercana a la demanda aprovechable del proceso, no escales el sistema solo para aumentar la fracción solar.

Rechaza configuraciones con fracción solar muy alta si para lograrla se requiere aumentar significativamente el área instalada, el almacenamiento y la inversión, reduciendo la TIR o aumentando el periodo de retorno.

En la selección final, da mayor peso al payback, TIR, producción útil específica y utilización real del sistema que al VAN absoluto.

Regla para evitar subdimensionamiento:

No selecciones una configuración demasiado pequeña si reduce la producción útil por debajo de un nivel técnicamente aprovechable para el proceso.

Si una configuración compacta ligeramente mayor mantiene inversión razonable y mejora claramente la producción solar útil, la fracción solar y el ahorro anual sin empeorar de forma importante el retorno, debe preferirse sobre la opción más pequeña.

No castigues artificialmente la producción útil de sistemas compactos. Para un campo solar compacto correctamente dimensionado, la producción útil debe ser coherente con la radiación local, la temperatura de operación, la eficiencia del colector y el horario de demanda.

Regla final de calibración financiera:

No infles los costos instalados de sistemas compactos.

Para sistemas solares térmicos compactos con colectores planos industriales, el costo total instalado debe ser proporcional al número de colectores, al volumen de almacenamiento y a la complejidad real de integración.

Si el sistema seleccionado es compacto, evita asignar costos de ingeniería, integración, estructura, bombeo o control desproporcionados frente al costo de los colectores y almacenamiento.

El costo de operación y mantenimiento anual debe mantenerse proporcional al tamaño del sistema y normalmente debe representar una fracción baja de la inversión total.

La inversión total debe permitir coherencia entre:
- ahorro anual,
- periodo de retorno,
- TIR,
- VAN,
- tamaño del campo solar,
- volumen de almacenamiento,
- y costo del combustible.

Si el sistema seleccionado tiene buen ahorro anual pero el payback o la TIR resultan débiles, revisa si la inversión estimada está sobredimensionada para el tamaño del sistema.

No uses costos excesivamente conservadores si estos generan una rentabilidad artificialmente baja en sistemas técnicamente compactos y bien aprovechados.

En configuraciones compactas con producción solar útil significativa, alta utilización del sistema y bajo excedente, la inversión debe mantenerse en un rango coherente con el tamaño del campo solar y no debe penalizar innecesariamente el análisis LCCA.

No penalices financieramente sistemas compactos con costos instalados excesivos.

No asumas costos demasiado bajos que generen retornos artificialmente optimistas.

Los costos instalados deben ser proporcionales al tamaño del sistema, considerando:
- colectores solares,
- estructura,
- almacenamiento térmico,
- bombeo,
- tuberías,
- aislamiento,
- intercambiador de calor si aplica,
- control,
- integración hidráulica,
- ingeniería,
- instalación,
- puesta en marcha,
- y operación y mantenimiento.

El almacenamiento térmico no debe escalarse automáticamente con el área instalada.

El almacenamiento debe dimensionarse principalmente en función de:
- demanda diaria,
- volumen diario del proceso,
- horario de consumo,
- temperatura requerida,
- y desfase entre producción solar y demanda.

Para procesos con demanda diaria moderada, el volumen de almacenamiento no debe exceder varias veces el volumen diario del proceso salvo que exista una razón técnica explícita y una mejora económica demostrable.

El almacenamiento térmico debe tender a un volumen cercano al volumen diario requerido por el proceso, salvo que el análisis demuestre que un volumen mayor mejora claramente el payback, la TIR y la utilización solar.

El área instalada recomendada debe ser la menor área que logre:
- producción solar útil suficiente,
- fracción solar razonable,
- alta utilización real del campo solar,
- bajo excedente,
- y retorno económico favorable.

No aumentes el número de colectores únicamente para elevar la fracción solar.

No reduzcas excesivamente el número de colectores si eso provoca una producción solar útil baja o una fracción solar poco relevante para el proceso.

La fracción solar debe mantenerse en rangos físicamente realistas para aplicaciones SHIP industriales.

Una fracción solar baja puede ser aceptable si el sistema tiene alta rentabilidad y la demanda es grande o difícil de cubrir.

Una fracción solar media o alta puede ser aceptable si el sistema no genera excedentes excesivos y mantiene buen desempeño económico.

Evita fracciones solares artificialmente altas cuando impliquen sobredimensionamiento, exceso de almacenamiento, baja utilización solar o retorno económico deficiente.

Evita fracciones solares demasiado bajas cuando el recurso solar, el costo del combustible y la demanda térmica permitan una cobertura mayor con buena rentabilidad.

Considera:
- irradiancia solar horaria,
- temperatura ambiente,
- demanda térmica del proceso,
- temperatura de entrada,
- temperatura de salida requerida,
- salto térmico,
- horario de operación,
- días de operación,
- meses de operación,
- perfil parcial de carga,
- pérdidas térmicas del campo solar,
- pérdidas térmicas del almacenamiento,
- excedentes solares no aprovechados,
- respaldo con combustible convencional,
- disponibilidad solar anual,
- eficiencia del colector,
- almacenamiento térmico,
- inversión inicial,
- operación y mantenimiento,
- inflación energética,
- tasa de descuento,
- VAN,
- TIR,
- periodo de retorno,
- y LCCA a 20 años.

Evalúa al menos cinco configuraciones posibles, desde una alternativa pequeña hasta una alternativa de mayor cobertura.

Descarta como sobredimensionadas las configuraciones que aumenten área, almacenamiento e inversión sin mejorar proporcionalmente:
- producción solar útil,
- fracción solar aprovechable,
- TIR,
- periodo de retorno,
- producción específica útil,
- y utilización real del sistema.

Para cada configuración evaluada, reporta:
- área instalada,
- número de colectores,
- almacenamiento,
- producción solar útil,
- producción solar útil específica,
- fracción solar,
- inversión,
- ahorro anual,
- periodo de retorno,
- TIR,
- VAN,
- y criterio de evaluación.

La configuración seleccionada debe justificar claramente:
- por qué no está sobredimensionada,
- por qué no está subdimensionada,
- por qué su almacenamiento es adecuado,
- por qué su producción útil es suficiente,
- y por qué su retorno económico es razonable.

Responde únicamente con un objeto JSON válido.

No agregues explicaciones fuera del JSON.

DATOS DE ENTRADA:

{}

ESTRUCTURA DEL JSON:

IMPORTANTE:
- Usa exactamente los nombres de campos indicados abajo.
- No cambies nombres.
- No uses snake_case.
- No pongas "produccion" como array.
- Las configuraciones evaluadas deben ir siempre en "produccion.configuraciones".
- La configuracion seleccionada debe ir siempre en "produccion.configuracionSeleccionada".
- "fraccionSolar" debe estar entre 0 y 1.
- "fraccionSolarPorcentaje" debe estar entre 0 y 100.
- "tirPorcentaje" debe estar en porcentaje, por ejemplo 17.4, no 0.174.
- "periodoRetornoSimpleAnios" debe ser inversionTotal / ahorroAnual.
- Si un valor no se conoce, estima un valor razonable; no uses null ni "No disponible" en campos numericos obligatorios.
- Los campos resumen de "produccion" deben copiar los valores de "produccion.configuracionSeleccionada"; no los dejes en 0 si la configuracion seleccionada tiene datos.
- "produccion.produccionSolarUtilKwhAnio", "produccion.produccionEspecificaUtilKwhM2Anio", "produccion.fraccionSolar", "produccion.fraccionSolarPorcentaje", "produccion.areaInstaladaM2", "produccion.numeroColectores" y "produccion.almacenamientoLitros" deben ser iguales a los de "produccion.configuracionSeleccionada".
- Incluye siempre la seccion "graficas".
- "graficas.produccionMensual" debe tener 12 meses y conservar coherencia anual: la suma de solarUtilKwh debe aproximarse a "produccion.produccionSolarUtilKwhAnio" y la suma de demandaKwh debe aproximarse a "produccion.energiaDemandadaKwhAnio".
- "graficas.flujoCaja" debe representar el flujo acumulado del proyecto durante al menos 10 anios.
- "graficas.comparacionConfiguraciones" debe resumir las mismas configuraciones de "produccion.configuraciones".

{
  "ubicacion": {
    "pais": "string",
    "estado": "string",
    "ciudad": "string",
    "coordenadas": {
      "latitud": 0,
      "longitud": 0
    },
    "altitud": 0,
    "clima": "string",
    "fuente": "string"
  },
  "proceso": {
    "industria": "string",
    "combustible": "string",
    "precioCombustible": 0,
    "unidadPrecio": "string",
    "fluido": "string",
    "presion": 0,
    "unidadPresion": "string",
    "tipoCircuito": "string",
    "temperaturaEntradaC": 0,
    "temperaturaSalidaC": 0,
    "demandaDiaria": 0,
    "unidadDemanda": "string",
    "demandaEnergeticaKwhDia": 0,
    "diasOperacionAnual": 0,
    "horarioOperacion": {
      "inicio": "HH:mm",
      "fin": "HH:mm"
    },
    "mesesOperacion": [],
    "diasOperacion": []
  },
  "solar": {
    "modeloColector": "string",
    "tipoColector": "string",
    "areaMaxDisponibleM2": 0,
    "eficienciaColector": 0,
    "radiacionAnualKwhM2": 0,
    "radiacionMediaDiariaKwhM2": 0,
    "temperaturaAmbienteMediaC": 0,
    "perdidasSistema": 0
  },
  "produccion": {
    "energiaDemandadaKwhAnio": 0,
    "demandaEnergeticaKwhDia": 0,
    "produccionSolarUtilKwhAnio": 0,
    "produccionEspecificaUtilKwhM2Anio": 0,
    "fraccionSolar": 0,
    "fraccionSolarPorcentaje": 0,
    "areaInstaladaM2": 0,
    "numeroColectores": 0,
    "almacenamientoLitros": 0,
    "configuraciones": [
      {
        "id": 1,
        "nombre": "string",
        "areaInstaladaM2": 0,
        "numeroColectores": 0,
        "almacenamientoLitros": 0,
        "produccionSolarUtilKwhAnio": 0,
        "produccionEspecificaUtilKwhM2Anio": 0,
        "fraccionSolar": 0,
        "fraccionSolarPorcentaje": 0,
        "inversionTotal": 0,
        "ahorroAnual": 0,
        "periodoRetornoSimpleAnios": 0,
        "tirPorcentaje": 0,
        "van": 0,
        "criterio": "string"
      }
    ],
    "configuracionSeleccionada": {
      "id": 1,
      "nombre": "string",
      "areaInstaladaM2": 0,
      "numeroColectores": 0,
      "almacenamientoLitros": 0,
      "produccionSolarUtilKwhAnio": 0,
      "produccionEspecificaUtilKwhM2Anio": 0,
      "fraccionSolar": 0,
      "fraccionSolarPorcentaje": 0,
      "inversionTotal": 0,
      "ahorroAnual": 0,
      "periodoRetornoSimpleAnios": 0,
      "tirPorcentaje": 0,
      "van": 0,
      "criterio": "string"
    }
  },
  "financiero": {
    "moneda": "string",
    "periodoAnalisisAnios": 20,
    "tasaDescuento": 0,
    "inflacionEnergetica": 0,
    "facturaActualAnual": 0,
    "ahorroSolarAnual": 0,
    "inversionTotal": 0,
    "opexAnualEstimado": 0,
    "periodoRetornoSimpleAnios": 0,
    "tirPorcentaje": 0,
    "van": 0
  },
  "analisis": {
    "resumenEjecutivo": "string",
    "viabilidadTecnica": "string",
    "viabilidadEconomica": "string",
    "criteriosSeleccion": [],
    "recomendaciones": [],
    "limitaciones": [],
    "advertencias": []
  },
  "graficas": {
    "produccionMensual": [
      {
        "mes": "Enero",
        "demandaKwh": 0,
        "solarUtilKwh": 0,
        "energiaAuxiliarKwh": 0
      }
    ],
    "flujoCaja": [
      {
        "anio": 1,
        "flujoNeto": 0,
        "flujoAcumulado": 0
      }
    ],
    "comparacionConfiguraciones": [
      {
        "nombre": "string",
        "areaInstaladaM2": 0,
        "produccionSolarUtilKwhAnio": 0,
        "inversionTotal": 0,
        "periodoRetornoSimpleAnios": 0
      }
    ]
  }
}
`;

function safeParseJson(text: string) {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const user = getCurrentUser(req);

    if (!user) {
      return NextResponse.json(
        { error: "Debes iniciar sesion para generar simulaciones" },
        { status: 401 },
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no esta configurada" },
        { status: 500 },
      );
    }

    const inputJson = await req.json();
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      instructions: systemPrompt,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `Genera un resultJson SHIP completo a partir de este formulario:\n\n${JSON.stringify(
                inputJson,
                null,
                2,
              )}`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "ship_prefeasibility_result",
          schema: resultSchema,
          strict: false,
        },
      },
    });

    const outputText = response.output_text;
    const rawResultJson = safeParseJson(outputText);
    const resultJson = normalizeShipResult(rawResultJson, inputJson);

    return NextResponse.json({
      success: true,
      resultJson,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "No se pudo generar la simulacion IA" },
      { status: 500 },
    );
  }
}
