# Fairpolicy-Agenten für Versicherungsmakler und -agenturen

*Von Claude übersetzt; Prüfung durch Muttersprachler steht aus. Die englische [README](README.md) ist maßgeblich.*

Dreißig kleine MCP-Agenten für das Backoffice unabhängiger Versicherungsagenturen und Makler. Jeder ist für **eine Aufgabe** zuständig, etwa die Courtageabrechnung eines Versicherers gegen die erwartete Courtage zu prüfen, das Prämientreuhandkonto abzustimmen oder Verlängerungen ohne Prüfung zu finden, und kann nichts anderes tun. Sie lesen die Dateien, die Ihre Agentur schon exportiert: Vertrags- und Ablauflisten aus Applied Epic, Vertafore AMS360 und Sagitta, HawkSoft, EZLynx oder QQCatalyst, Courtageabrechnungen, Download-Protokolle und Tabellen.

Teil von Fair Agents von Mythos Machines. MIT-Lizenz · Node 20 oder neuer · nur lokale Dateien · keine Zugangsdaten · keine Abhängigkeiten. Die Software ist kostenlos; bezahlt wird eine Einrichtung zum Festpreis auf Ihren eigenen Dateien.

## Ausprobieren

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

Jeder Agent hat eine `demo` mit fiktiven Dateien, ein `eval` mit eigenen Testfällen und einen MCP-Server (`npx -y <agent> mcp --root <ordner>`).

## Die Agenten

**Courtagen (5):** `fairpolicy-commission-statements` (Abrechnung gegen erwartete Courtage), `fairpolicy-missing-commissions` (nie abgerechnete Verträge), `fairpolicy-commission-chargebacks` (Rückbelastungen bei Storno), `fairpolicy-producer-splits` (Vermittleranteile), `fairpolicy-contingency-bonus` (Bonusstaffeln der Versicherer).

**Maklerinkasso, Treuhand und Prämiengelder (6):** `fairpolicy-trust-account` (Prämientreuhandkonto), `fairpolicy-receivables-aging` (Beitragsforderungen), `fairpolicy-direct-agency-bill` (Doppelte Rechnungsstellung), `fairpolicy-premium-finance` (Prämienfinanzierung), `fairpolicy-carrier-payables` (Kontokorrent der Versicherer), `fairpolicy-return-premiums` (Beitragsrückerstattungen).

**Verlängerungen, Bestand und Kundenbindung (6):** `fairpolicy-renewal-remarket` (Verlängerungen ohne Prüfung), `fairpolicy-commercial-renewals` (Zeitplan Gewerbeverlängerungen), `fairpolicy-lapsed-policies` (abgelaufene und stornierte Verträge), `fairpolicy-cross-sell` (Kunden mit nur einer Sparte), `fairpolicy-producer-retention` (Bestandserhalt je Vermittler), `fairpolicy-book-valuation` (Bestandsübersicht (keine Bewertung)).

**Service (6):** `fairpolicy-certificate-limits` (Versicherungsbestätigungen gegen Verträge), `fairpolicy-additional-insureds` (Mitversicherte und Regressverzicht), `fairpolicy-pending-endorsements` (offene Vertragsänderungen), `fairpolicy-policy-checking` (Police gegen Deckungszusage), `fairpolicy-open-claims` (offene Schäden), `fairpolicy-loss-runs` (Schadenverlauf je Kunde).

**Regelkonformität und Daten (7):** `fairpolicy-license-renewals` (Zulassungen und Weiterbildung), `fairpolicy-carrier-appointments` (Bestellungen bei Versicherern), `fairpolicy-signed-declinations` (unterschriebene Formulare und Verzichte), `fairpolicy-workers-comp-audits` (Beitragsrevisionen), `fairpolicy-data-quality` (Datenqualität der Verträge), `fairpolicy-duplicate-clients` (doppelte Kunden), `fairpolicy-download-errors` (Fehler beim Datenabruf).

## Wie sie sicher bleiben

- **Eine Aufgabe je Agent.** Jeder Agent hat seine eigene Werkzeugliste; jeder andere Werkzeugname wird blockiert, auch erfundene.
- **Nichts Verbindliches geschieht von selbst.** Kein Agent deckt, storniert, ändert, vermittelt oder empfiehlt Versicherungsschutz, bezahlt einen Versicherer, bewegt Treuhandgeld, stellt Bestätigungen aus oder sendet Nachrichten. Entwürfe warten auf den Klick einer namentlich genannten Person, auch im Auto-Modus.
- **Kundendaten werden maskiert.** Namen, Kundennummern, Geburtsdaten, Führerscheinnummern, Adressen, Telefonnummern und E-Mails werden in allem, was an das KI-Modell geht, durch Pseudonyme wie `CL-3f9a1c2e` ersetzt. Die Dateien auf Ihrem Rechner behalten die echten Werte.
- **Nur lokale Dateien.** Keine Netzwerkaufrufe, keine Telemetrie, keine Zugangsdaten. Jeder Aufruf landet in einem hashverketteten Protokoll unter `.fairpolicy/`.
- **Ihre Regeln.** Courtagesätze, Aufteilungen, Bonusstaffeln, Weiterbildungsstunden und Fristen stehen in Ihren eigenen Einstellungsdateien. Zulassungs-, Bestellungs- und Treuhandregeln unterscheiden sich je Bundesstaat; die Werte sind Einstellungen, die Ihre Agentur bestätigt, keine Rechtsberatung.

## Grenzen

- Die Exportformate wurden aus Kenntnis der Systeme geschrieben und nicht gegen ein echtes Konto getestet; `inspect` zeigt, wie eine Datei gelesen wurde.
- Keine Rechts-, Steuer-, Buchhaltungs- oder Deckungsberatung. Eine zugelassene Person entscheidet, was angeboten, gebunden, geändert oder gesendet wird.

MIT © 2026 Kurt Francisco
