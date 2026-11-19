# Agentes Fairpolicy para agencias y corredurías de seguros

*Traducido por Claude; pendiente de revisión por un hablante nativo. El [README](README.md) en inglés es el que vale.*

Treinta pequeños agentes MCP para la trastienda de agencias y corredurías de seguros independientes. Cada uno tiene **una sola tarea**, como revisar la liquidación de comisiones de una aseguradora contra la comisión esperada, conciliar la cuenta fiduciaria de primas o encontrar renovaciones sin revisión, y no puede hacer nada más. Leen los archivos que su agencia ya exporta: listas de pólizas y vencimientos de Applied Epic, Vertafore AMS360 y Sagitta, HawkSoft, EZLynx o QQCatalyst, liquidaciones de comisiones, registros de descargas y hojas de cálculo.

Parte de Fair Agents de Mythos Machines. Licencia MIT · Node 20 o superior · solo archivos locales · sin credenciales · sin dependencias. El software es gratis; lo que se paga es una puesta en marcha a precio fijo sobre sus propios archivos.

## Probar

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

Cada agente tiene una `demo` con archivos ficticios, un `eval` con sus propios casos de prueba y un servidor MCP (`npx -y <agente> mcp --root <carpeta>`).

## Los agentes

**Comisiones (5):** `fairpolicy-commission-statements` (liquidación frente a comisión esperada), `fairpolicy-missing-commissions` (pólizas sin comisión), `fairpolicy-commission-chargebacks` (contracargos por anulación), `fairpolicy-producer-splits` (repartos de productores), `fairpolicy-contingency-bonus` (bonos por resultados).

**Cobro por agencia, fiducia y primas (6):** `fairpolicy-trust-account` (cuenta fiduciaria de primas), `fairpolicy-receivables-aging` (primas por cobrar), `fairpolicy-direct-agency-bill` (doble cobro), `fairpolicy-premium-finance` (financiación de primas), `fairpolicy-carrier-payables` (cuenta corriente con aseguradoras), `fairpolicy-return-premiums` (primas a devolver).

**Renovaciones, cartera y retención (6):** `fairpolicy-renewal-remarket` (renovaciones sin revisión), `fairpolicy-commercial-renewals` (calendario de renovaciones comerciales), `fairpolicy-lapsed-policies` (pólizas vencidas y anuladas), `fairpolicy-cross-sell` (clientes con un solo ramo), `fairpolicy-producer-retention` (retención por productor), `fairpolicy-book-valuation` (resumen de cartera (no es una tasación)).

**Servicio (6):** `fairpolicy-certificate-limits` (certificados frente a pólizas), `fairpolicy-additional-insureds` (asegurados adicionales y renuncias), `fairpolicy-pending-endorsements` (suplementos pendientes), `fairpolicy-policy-checking` (póliza frente a la cobertura vinculada), `fairpolicy-open-claims` (siniestros abiertos), `fairpolicy-loss-runs` (siniestralidad por cliente).

**Cumplimiento y datos (7):** `fairpolicy-license-renewals` (licencias y formación continua), `fairpolicy-carrier-appointments` (nombramientos de aseguradoras), `fairpolicy-signed-declinations` (formularios firmados y renuncias), `fairpolicy-workers-comp-audits` (auditorías de prima), `fairpolicy-data-quality` (calidad de datos), `fairpolicy-duplicate-clients` (clientes duplicados), `fairpolicy-download-errors` (errores de descarga).

## Cómo se mantienen seguros

- **Una tarea por agente.** Cada agente tiene su propia lista de herramientas; cualquier otro nombre se bloquea, incluso uno inventado.
- **Nada vinculante ocurre solo.** Ningún agente emite, anula, modifica, coloca ni recomienda coberturas, paga a una aseguradora, mueve dinero fiduciario, emite certificados ni envía mensajes. Los borradores esperan el clic de una persona con nombre, incluso en modo Auto.
- **Los datos de clientes se enmascaran.** Nombres, códigos, fechas de nacimiento, licencias de conducir, direcciones, teléfonos y correos se sustituyen por seudónimos como `CL-3f9a1c2e` en todo lo que llega al modelo de IA. Los archivos en su equipo conservan los valores reales.
- **Solo archivos locales.** Sin llamadas de red, sin telemetría, sin credenciales. Cada llamada queda en un registro encadenado por hash en `.fairpolicy/`.
- **Sus reglas.** Tasas de comisión, repartos, escalas de bonos, horas de formación y plazos son ajustes en sus propios archivos. Las reglas de licencias, nombramientos y cuentas fiduciarias varían por estado; los valores son ajustes que su agencia confirma, nunca asesoría legal.

## Límites

- Los formatos de exportación se escribieron a partir del conocimiento de cada sistema y no se probaron con una cuenta real; `inspect` muestra cómo se leyó un archivo.
- No es asesoría legal, fiscal, contable ni de coberturas. Una persona con licencia decide qué se ofrece, se emite, se cambia o se envía.

MIT © 2026 Kurt Francisco
