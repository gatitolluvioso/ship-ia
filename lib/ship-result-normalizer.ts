type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonRecord = Record<string, JsonValue>;

type NormalizedConfig = {
  id: number | null;
  nombre: string;
  areaInstaladaM2: number | null;
  numeroColectores: number | null;
  almacenamientoLitros: number | null;
  produccionSolarUtilKwhAnio: number | null;
  produccionEspecificaUtilKwhM2Anio: number | null;
  fraccionSolar: number | null;
  fraccionSolarPorcentaje: number | null;
  inversionTotal: number | null;
  ahorroAnual: number | null;
  periodoRetornoSimpleAnios: number | null;
  periodoRetornoReportadoAnios: number | null;
  tirPorcentaje: number | null;
  van: number | null;
  criterio: string;
};

export function normalizeShipResult(rawResult: unknown, rawInput: unknown) {
  const result = isRecord(rawResult) ? rawResult : {};
  const input = isRecord(rawInput) ? rawInput : {};
  const warnings: string[] = [];

  const productionRaw = result.produccion;
  const configsRaw = Array.isArray(productionRaw)
    ? productionRaw
    : findValue(result, ["produccion.configuraciones"]);
  const selectedId = firstNumber(result, [
    "analisis.configuracion_seleccionada",
    "analisis.configuracionSeleccionada",
  ]);
  const selectedFromList =
    Array.isArray(configsRaw) && selectedId !== null
      ? configsRaw.find((config) => {
          if (!isRecord(config)) return false;
          return (
            toNumber(config.id) === selectedId ||
            toNumber(config.configuracion) === selectedId
          );
        })
      : undefined;
  const selectedRaw =
    findFirstRecord(result, [
      "produccion.configuracionSeleccionada",
      "produccion.seleccionada",
      "produccion.seleccion",
      "solar.configuracionSeleccionada",
      "financiero.configuracionSeleccionada",
    ]) ?? (isRecord(selectedFromList) ? selectedFromList : undefined);
  const configs = Array.isArray(configsRaw)
    ? configsRaw
        .filter(isRecord)
        .map((config, index) =>
          normalizeConfig(config, `Configuracion ${index + 1}`, warnings),
        )
    : [];
  const selected =
    selectedRaw !== undefined
      ? normalizeConfig(selectedRaw, "Seleccionada", warnings)
      : (configs[0] ?? emptyConfig("Seleccionada"));

  const dailyDemandKwh =
    firstNumber(result, [
      "proceso.demandaEnergetica",
      "proceso.demandaTermicaDiariaKwh",
    ]) ?? estimateDailyDemandKwh(input, result);
  const operationDays = estimateOperationDays(input, result);
  const annualDemandKwh =
    firstNumber(result, [
      "produccion.energiaDemandadaKwhAnio",
      "produccion.demandaTermicaAnualKwh",
      "demanda.energiaUtilAnualKwh",
    ]) ?? (dailyDemandKwh !== null ? dailyDemandKwh * operationDays : null);
  const fuelPrice =
    firstNumber(result, ["proceso.precioCombustible"]) ??
    toNumber(input.precioCombustible);
  const currency = stringValue(
    findValue(result, ["financiero.moneda", "financiero.unidadMonetaria"]) ??
      inferCurrency(String(input.unidadPrecio ?? "")),
    "MXN",
  );
  const facturaActualAnual =
    firstNumber(result, [
      "financiero.resumen.facturaActualAnual",
      "financiero.resumen.facturaActualAnio1",
      "financiero.facturaActualAnual",
    ]) ??
    (annualDemandKwh !== null && fuelPrice !== null
      ? annualDemandKwh * fuelPrice
      : null);
  const opexAnual =
    firstNumber(result, [
      "financiero.opexAnualEstimado",
      "financiero.desgloseInversion.operacionMantenimientoAnual",
      "financiero.opexAnual",
    ]) ?? estimateAnnualOpex(result, selected.inversionTotal);
  const normalizedConfigs =
    configs.length > 0
      ? configs
      : [selected].filter((config) => config.inversionTotal !== null);
  const graficas = normalizeCharts(
    result,
    selected,
    normalizedConfigs,
    annualDemandKwh,
    opexAnual,
  );

  if (selected.fraccionSolar !== null && selected.fraccionSolar > 1) {
    warnings.push(
      "La fraccion solar reportada por la IA excedia 100% y fue normalizada.",
    );
  }

  return {
    ubicacion: {
      pais: stringValue(
        findValue(result, ["ubicacion.pais"]) ?? input.pais,
        "",
      ),
      estado: stringValue(findValue(result, ["ubicacion.estado"]), ""),
      ciudad: stringValue(
        findValue(result, ["ubicacion.ciudad"]) ?? input.ciudad,
        "",
      ),
      coordenadas: findValue(result, ["ubicacion.coordenadas"]) ?? null,
      altitud: firstNumber(result, ["ubicacion.altitud"]),
      clima: stringValue(findValue(result, ["ubicacion.clima"]), ""),
      fuente: "normalizado_desde_resultado_ia",
    },
    proceso: {
      industria: stringValue(
        findValue(result, ["proceso.industria"]) ?? input.industria,
        "",
      ),
      combustible: stringValue(
        findValue(result, ["proceso.combustible"]) ?? input.combustible,
        "",
      ),
      precioCombustible: fuelPrice,
      unidadPrecio: stringValue(
        findValue(result, ["proceso.unidadPrecio"]) ?? input.unidadPrecio,
        "",
      ),
      fluido: stringValue(
        findValue(result, ["proceso.fluido"]) ?? input.fluido,
        "",
      ),
      presion:
        firstNumber(result, ["proceso.presion"]) ?? toNumber(input.presion),
      unidadPresion: stringValue(
        findValue(result, ["proceso.unidadPresion"]) ?? input.unidadPresion,
        "",
      ),
      tipoCircuito: stringValue(
        findValue(result, ["proceso.tipoCircuito"]) ?? input.tipoCircuito,
        "",
      ),
      temperaturaEntradaC:
        firstNumber(result, [
          "proceso.temperaturaEntrada",
          "proceso.tempEntrada",
        ]) ?? toNumber(input.temperaturaEntrada),
      temperaturaSalidaC:
        firstNumber(result, [
          "proceso.temperaturaSalida",
          "proceso.tempSalida",
        ]) ?? toNumber(input.temperaturaSalida),
      demandaDiaria:
        firstNumber(result, [
          "proceso.demandaDiaria",
          "proceso.demanda",
          "proceso.demandaVolumen",
        ]) ?? toNumber(input.demanda),
      unidadDemanda: stringValue(
        findValue(result, ["proceso.unidadDemanda"]) ?? input.unidadDemanda,
        "",
      ),
      demandaEnergeticaKwhDia: dailyDemandKwh,
      diasOperacionAnual: operationDays,
      horarioOperacion: findValue(result, ["proceso.horarioOperacion"]) ?? {
        inicio: input.horarioInicio ?? "",
        fin: input.horarioFin ?? "",
      },
      mesesOperacion:
        findValue(result, ["proceso.mesesOperacion"]) ??
        input.mesesOperacion ??
        [],
      diasOperacion:
        findValue(result, ["proceso.diasOperacion"]) ??
        input.diasOperacion ??
        [],
    },
    solar: {
      modeloColector: stringValue(
        findValue(result, ["solar.modeloColector"]) ?? input.modeloColector,
        "",
      ),
      tipoColector: stringValue(
        findValue(result, ["solar.tipoColector", "solar.colectorTipo"]),
        "",
      ),
      areaMaxDisponibleM2:
        firstNumber(result, ["solar.areaMaxDisponible", "solar.areaMaxima"]) ??
        toNumber(input.areaDisponible),
      eficienciaColector: firstNumber(result, [
        "solar.eficienciaColector",
        "solar.eficienciaColector.referencia",
        "solar.eficienciaColectorPromedio",
        "solar.eficienciaNominal",
      ]),
      radiacionAnualKwhM2:
        firstNumber(result, [
          "solar.radiacionAnualKwhM2",
          "solar.radiacionTMY.anual",
          "produccion.radiacionDisponibleKwhM2Anio",
        ]) ?? null,
      radiacionMediaDiariaKwhM2:
        firstNumber(result, [
          "solar.radiacionMediaDiariaKwhM2",
          "solar.irradianciaPromedioAnual",
          "solar.TMY.radiacionMediaAnual",
          "solar.tmy.radiacionMediaAnual",
        ]) ?? null,
      temperaturaAmbienteMediaC:
        firstNumber(result, [
          "solar.temperaturaAmbienteMediaC",
          "solar.temperaturaAmbientePromedio",
          "solar.temperaturaAmbienteMedia",
          "solar.TMY.temperaturaMediaAnual",
        ]) ?? null,
      perdidasSistema:
        firstNumber(result, [
          "solar.perdidasSistema.estimadas",
          "solar.perdidasSistema",
          "solar.perdidasTermicasCampo",
        ]) ?? null,
      configuracionSeleccionada: selected,
      configuracionesEvaluadas: configs,
    },
    produccion: {
      energiaDemandadaKwhAnio: annualDemandKwh,
      demandaEnergeticaKwhDia: dailyDemandKwh,
      produccionSolarUtilKwhAnio: selected.produccionSolarUtilKwhAnio,
      produccionEspecificaUtilKwhM2Anio:
        firstNumber(result, ["produccion.produccionEspecificaUtilKwhM2Anio"]) ??
        selected.produccionEspecificaUtilKwhM2Anio,
      fraccionSolar: selected.fraccionSolar,
      fraccionSolarPorcentaje: selected.fraccionSolarPorcentaje,
      areaInstaladaM2: selected.areaInstaladaM2,
      numeroColectores: selected.numeroColectores,
      almacenamientoLitros: selected.almacenamientoLitros,
      configuracionSeleccionada: selected,
      configuraciones: configs,
    },
    financiero: {
      moneda: currency,
      periodoAnalisisAnios:
        firstNumber(result, [
          "financiero.periodoAnalisis",
          "financiero.vidaUtil",
        ]) ?? 20,
      tasaDescuento: firstNumber(result, ["financiero.tasaDescuento"]),
      inflacionEnergetica: firstNumber(result, [
        "financiero.inflacionEnergetica",
      ]),
      facturaActualAnual,
      ahorroSolarAnual: selected.ahorroAnual,
      inversionTotal: selected.inversionTotal,
      opexAnualEstimado: opexAnual,
      periodoRetornoSimpleAnios: selected.periodoRetornoSimpleAnios,
      periodoRetornoReportadoAnios: selected.periodoRetornoReportadoAnios,
      tirPorcentaje: selected.tirPorcentaje,
      van: selected.van,
    },
    analisis: {
      resumenEjecutivo:
        stringValue(
          findValue(result, [
            "analisis.resumenEjecutivo",
            "analisis.observacionesSeleccion",
            "analisis.detalleSeleccion",
          ]),
          "",
        ) || selected.criterio,
      viabilidadTecnica: stringValue(
        findValue(result, ["analisis.viabilidadTecnica"]),
        "",
      ),
      viabilidadEconomica: stringValue(
        findValue(result, ["analisis.viabilidadEconomica"]),
        "",
      ),
      criteriosSeleccion:
        findValue(result, [
          "analisis.criteriosSeleccion",
          "analisis.criteriosEvaluacion",
        ]) ?? [],
      recomendaciones: findValue(result, ["analisis.recomendaciones"]) ?? [],
      limitaciones: findValue(result, ["analisis.limitaciones"]) ?? [],
      advertencias: warnings,
      rawResult: result,
    },
    graficas,
  };
}

function normalizeCharts(
  result: JsonRecord,
  selected: NormalizedConfig,
  configs: NormalizedConfig[],
  annualDemandKwh: number | null,
  opexAnual: number | null,
) {
  const rawMonthly = findValue(result, ["graficas.produccionMensual"]);
  const rawCashFlow = findValue(result, ["graficas.flujoCaja"]);
  const rawComparison = findValue(result, [
    "graficas.comparacionConfiguraciones",
  ]);

  return {
    produccionMensual: Array.isArray(rawMonthly)
      ? rawMonthly.filter(isRecord).map(normalizeMonthlyPoint)
      : estimateMonthlyProduction(
          annualDemandKwh,
          selected.produccionSolarUtilKwhAnio,
        ),
    flujoCaja: Array.isArray(rawCashFlow)
      ? rawCashFlow.filter(isRecord).map(normalizeCashFlowPoint)
      : estimateCashFlow(selected, opexAnual),
    comparacionConfiguraciones: Array.isArray(rawComparison)
      ? rawComparison.filter(isRecord).map(normalizeComparisonPoint)
      : configs.map((config) => ({
          nombre: config.nombre,
          areaInstaladaM2: config.areaInstaladaM2 ?? 0,
          produccionSolarUtilKwhAnio: config.produccionSolarUtilKwhAnio ?? 0,
          inversionTotal: config.inversionTotal ?? 0,
          periodoRetornoSimpleAnios: config.periodoRetornoSimpleAnios ?? 0,
        })),
  };
}

function normalizeMonthlyPoint(point: JsonRecord) {
  return {
    mes: stringValue(point.mes, ""),
    demandaKwh: toNumber(point.demandaKwh) ?? 0,
    solarUtilKwh: toNumber(point.solarUtilKwh) ?? 0,
    energiaAuxiliarKwh: toNumber(point.energiaAuxiliarKwh) ?? 0,
  };
}

function normalizeCashFlowPoint(point: JsonRecord) {
  return {
    anio: toNumber(point.anio) ?? 0,
    flujoNeto: toNumber(point.flujoNeto) ?? 0,
    flujoAcumulado: toNumber(point.flujoAcumulado) ?? 0,
  };
}

function normalizeComparisonPoint(point: JsonRecord) {
  return {
    nombre: stringValue(point.nombre, ""),
    areaInstaladaM2: toNumber(point.areaInstaladaM2) ?? 0,
    produccionSolarUtilKwhAnio: toNumber(point.produccionSolarUtilKwhAnio) ?? 0,
    inversionTotal: toNumber(point.inversionTotal) ?? 0,
    periodoRetornoSimpleAnios: toNumber(point.periodoRetornoSimpleAnios) ?? 0,
  };
}

function normalizeConfig(
  config: JsonRecord,
  fallbackName: string,
  warnings: string[],
): NormalizedConfig {
  const investment = firstNumberFromRecord(config, [
    "inversionTotal",
    "inversionMXN",
    "inversion",
    "inversion_mxn",
  ]);
  const savings = firstNumberFromRecord(config, [
    "ahorroAnual",
    "ahorroAnualMXN",
    "ahorroSolarAnual",
    "ahorro_anual_mxn",
  ]);
  const reportedPayback = firstNumberFromRecord(config, [
    "periodoRetorno",
    "payback",
    "retorno",
    "periodo_retorno_anos",
  ]);
  const storageLiters = firstNumberFromRecord(config, [
    "almacenamiento",
    "volumenAlmacenamiento",
    "almacenamientoLitros",
  ]);
  const storageM3 = firstNumberFromRecord(config, ["almacenamiento_m3"]);
  const calculatedPayback =
    investment !== null && savings !== null && savings > 0
      ? investment / savings
      : null;
  const payback =
    calculatedPayback !== null
      ? round(calculatedPayback, 1)
      : reportedPayback !== null
        ? round(reportedPayback, 1)
        : null;
  const fraction = normalizeFraction(
    firstNumberFromRecord(config, ["fraccionSolar", "fraccion_solar"]),
    warnings,
  );
  const tir = normalizePercent(
    firstNumberFromRecord(config, [
      "tirPorcentaje",
      "TIR",
      "tir",
      "tir_percent",
    ]),
  );

  if (
    calculatedPayback !== null &&
    reportedPayback !== null &&
    Math.abs(calculatedPayback - reportedPayback) >
      Math.max(1, calculatedPayback * 0.25)
  ) {
    warnings.push(
      `Payback reportado (${reportedPayback}) no coincide con inversion/ahorro; se uso ${round(calculatedPayback, 1)}.`,
    );
  }

  return {
    id: firstNumberFromRecord(config, ["id", "configuracion"]),
    nombre: stringValue(config.nombre, fallbackName),
    areaInstaladaM2: firstNumberFromRecord(config, [
      "areaInstalada",
      "areaInstaladaM2",
      "area",
      "area_colectores_m2",
    ]),
    numeroColectores: firstNumberFromRecord(config, [
      "numeroColectores",
      "numColectores",
      "colectores",
      "num_colectores",
    ]),
    almacenamientoLitros:
      storageLiters !== null
        ? storageLiters
        : storageM3 !== null
          ? storageM3 * 1000
          : null,
    produccionSolarUtilKwhAnio: firstNumberFromRecord(config, [
      "produccionSolarUtil",
      "produccionSolarUtilKwhAnio",
      "produccion_solar_util_kWh_anual",
    ]),
    produccionEspecificaUtilKwhM2Anio: firstNumberFromRecord(config, [
      "produccionEspecificaUtilKwhM2Anio",
      "produccionEspecificaUtil",
      "produccionEspecifica",
      "produccion_especifica_kWh_m2",
    ]),
    fraccionSolar: fraction,
    fraccionSolarPorcentaje:
      fraction !== null ? round(fraction * 100, 1) : null,
    inversionTotal: investment,
    ahorroAnual: savings,
    periodoRetornoSimpleAnios: payback,
    periodoRetornoReportadoAnios: reportedPayback,
    tirPorcentaje: tir,
    van: firstNumberFromRecord(config, ["VAN", "van", "npv", "van_mxn"]),
    criterio: stringValue(
      config.criterio ??
        config.criterioSeleccion ??
        config.criterio_evaluacion ??
        config.justificacion,
      "",
    ),
  };
}

function emptyConfig(name: string): NormalizedConfig {
  return {
    id: null,
    nombre: name,
    areaInstaladaM2: null,
    numeroColectores: null,
    almacenamientoLitros: null,
    produccionSolarUtilKwhAnio: null,
    produccionEspecificaUtilKwhM2Anio: null,
    fraccionSolar: null,
    fraccionSolarPorcentaje: null,
    inversionTotal: null,
    ahorroAnual: null,
    periodoRetornoSimpleAnios: null,
    periodoRetornoReportadoAnios: null,
    tirPorcentaje: null,
    van: null,
    criterio: "",
  };
}

function estimateDailyDemandKwh(input: JsonRecord, result: JsonRecord) {
  const demandLiters =
    firstNumber(result, [
      "proceso.demandaDiaria",
      "proceso.demandaVolumen",
      "proceso.demanda",
    ]) ?? toNumber(input.demanda);
  const inlet =
    firstNumber(result, [
      "proceso.temperaturaEntrada",
      "proceso.tempEntrada",
    ]) ?? toNumber(input.temperaturaEntrada);
  const outlet =
    firstNumber(result, ["proceso.temperaturaSalida", "proceso.tempSalida"]) ??
    toNumber(input.temperaturaSalida);

  if (demandLiters === null || inlet === null || outlet === null) return null;
  return round((demandLiters * 4.186 * (outlet - inlet)) / 3600, 1);
}

function estimateOperationDays(input: JsonRecord, result: JsonRecord) {
  const monthsValue =
    findValue(result, ["proceso.mesesOperacion"]) ?? input.mesesOperacion;
  const daysValue =
    findValue(result, ["proceso.diasOperacion"]) ?? input.diasOperacion;
  const months = Array.isArray(monthsValue) ? monthsValue.length : 12;
  const daysPerWeek = Array.isArray(daysValue) ? daysValue.length : 7;
  return Math.round((365 * months * daysPerWeek) / (12 * 7));
}

function estimateAnnualOpex(result: JsonRecord, investment: number | null) {
  const ratio = firstNumber(result, [
    "financiero.costoOperacionMantenimientoAnualRelativo",
    "financiero.costoOperacionMantenimientoAnual",
    "financiero.costoOperacionMantenimientoPorc",
  ]);
  if (investment === null || ratio === null) return null;
  return ratio <= 1 ? round(investment * ratio, 1) : ratio;
}

function estimateMonthlyProduction(
  annualDemandKwh: number | null,
  annualSolarKwh: number | null,
) {
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
  const solarShape = [
    0.078, 0.082, 0.095, 0.098, 0.101, 0.092, 0.084, 0.081, 0.078, 0.075, 0.066,
    0.07,
  ];
  const demand = annualDemandKwh ?? 0;
  const solar = annualSolarKwh ?? 0;

  return months.map((month, index) => {
    const demandKwh = demand / 12;
    const solarUtilKwh = solar * solarShape[index];
    return {
      mes: month,
      demandaKwh: round(demandKwh, 1),
      solarUtilKwh: round(solarUtilKwh, 1),
      energiaAuxiliarKwh: round(Math.max(0, demandKwh - solarUtilKwh), 1),
    };
  });
}

function estimateCashFlow(config: NormalizedConfig, opexAnual: number | null) {
  const investment = config.inversionTotal ?? 0;
  const savings = config.ahorroAnual ?? 0;
  const opex = opexAnual ?? 0;
  let accumulated = -investment;

  return Array.from({ length: 20 }, (_, index) => {
    const year = index + 1;
    const flujoNeto = year === 1 ? -investment : savings - opex;
    accumulated = year === 1 ? -investment : accumulated + flujoNeto;

    return {
      anio: year,
      flujoNeto: round(flujoNeto, 1),
      flujoAcumulado: round(accumulated, 1),
    };
  });
}

function normalizeFraction(value: number | null, warnings: string[]) {
  if (value === null) return null;
  if (value > 1 && value <= 100) return round(value / 100, 4);
  if (value > 100) {
    warnings.push(`Fraccion solar invalida (${value}); se limito a 100%.`);
    return 1;
  }
  return round(Math.max(0, value), 4);
}

function normalizePercent(value: number | null) {
  if (value === null) return null;
  return value <= 1 ? round(value * 100, 2) : round(value, 2);
}

function firstNumber(source: JsonRecord, paths: string[]) {
  for (const path of paths) {
    const parsed = toNumber(getPath(source, path));
    if (parsed !== null) return parsed;
  }
  return null;
}

function firstNumberFromRecord(source: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const parsed = toNumber(source[key]);
    if (parsed !== null) return parsed;
  }
  return null;
}

function findFirstRecord(source: JsonRecord, paths: string[]) {
  for (const path of paths) {
    const value = getPath(source, path);
    if (isRecord(value)) return value;
  }
  return undefined;
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

function inferCurrency(unit: string) {
  if (unit.toUpperCase().includes("MXN") || unit.includes("$")) return "MXN";
  return "MXN";
}

function stringValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() !== "" ? value : fallback;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function round(value: number, digits: number) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
