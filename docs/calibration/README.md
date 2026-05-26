# Calibration cases

This folder stores reference cases used to calibrate SHIP IA outputs against
known SHIP-style reports.

## Inecol / Moscafrut case

Source files provided by the user:

- `Inecol v4-simulation-100-report (1).pdf`
- `Reporte Tecnico- 06082024 (1).docx`

Use `inecol-shipcal-result.json` as a target shape for the AI-generated
`resultJson`. The values come primarily from the SHIPcal PDF report, with the
DOCX used as technical narrative/context.

Important note: the DOCX mentions `23,031.5 kWh/year` for supplied production,
while the SHIPcal PDF reports `24,260.4 kWh/year`. For calibration, prefer the
PDF value because it is the direct tool output.
