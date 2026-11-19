# Agenti Fairpolicy per agenzie e broker assicurativi

*Tradotto da Claude; revisione di un madrelingua in attesa. Fa fede il [README](README.md) in inglese.*

Trenta piccoli agenti MCP per il back office di agenzie e broker assicurativi indipendenti. Ognuno ha **un solo compito**, come verificare l’estratto provvigioni di una compagnia rispetto alla provvigione attesa, riconciliare il conto fiduciario premi o trovare i rinnovi senza revisione, e non può fare altro. Leggono i file che la vostra agenzia già esporta: elenchi di polizze e scadenze da Applied Epic, Vertafore AMS360 e Sagitta, HawkSoft, EZLynx o QQCatalyst, estratti provvigionali, registri di download e fogli di calcolo.

Parte di Fair Agents di Mythos Machines. Licenza MIT · Node 20 o successivo · solo file locali · nessuna credenziale · nessuna dipendenza. Il software è gratuito; si paga un’installazione a prezzo fisso sui vostri file.

## Provare

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

Ogni agente ha una `demo` su file fittizi, un `eval` con i propri casi di test e un server MCP (`npx -y <agente> mcp --root <cartella>`).

## Gli agenti

**Provvigioni (5):** `fairpolicy-commission-statements` (estratto contro provvigione attesa), `fairpolicy-missing-commissions` (polizze mai liquidate), `fairpolicy-commission-chargebacks` (storni per annullamento), `fairpolicy-producer-splits` (quote dei produttori), `fairpolicy-contingency-bonus` (bonus di risultato).

**Incasso, conto fiduciario e premi (6):** `fairpolicy-trust-account` (conto fiduciario premi), `fairpolicy-receivables-aging` (premi da incassare), `fairpolicy-direct-agency-bill` (doppia fatturazione), `fairpolicy-premium-finance` (finanziamento premi), `fairpolicy-carrier-payables` (conto corrente compagnie), `fairpolicy-return-premiums` (premi da rimborsare).

**Rinnovi, portafoglio e fidelizzazione (6):** `fairpolicy-renewal-remarket` (rinnovi senza revisione), `fairpolicy-commercial-renewals` (tempistiche rinnovi aziende), `fairpolicy-lapsed-policies` (polizze scadute e annullate), `fairpolicy-cross-sell` (clienti monoramo), `fairpolicy-producer-retention` (mantenimento per produttore), `fairpolicy-book-valuation` (sintesi del portafoglio (non è una perizia)).

**Servizio (6):** `fairpolicy-certificate-limits` (certificati rispetto alle polizze), `fairpolicy-additional-insureds` (assicurati aggiuntivi e rinunce), `fairpolicy-pending-endorsements` (appendici in sospeso), `fairpolicy-policy-checking` (polizza rispetto al vincolato), `fairpolicy-open-claims` (sinistri aperti), `fairpolicy-loss-runs` (andamento sinistri per cliente).

**Abilitazioni, fascicoli E&O e dati (7):** `fairpolicy-license-renewals` (abilitazioni e formazione), `fairpolicy-carrier-appointments` (mandati delle compagnie), `fairpolicy-signed-declinations` (moduli firmati e rinunce), `fairpolicy-workers-comp-audits` (regolazioni premio), `fairpolicy-data-quality` (qualità dei dati), `fairpolicy-duplicate-clients` (clienti duplicati), `fairpolicy-download-errors` (errori di download).

## Come restano sicuri

- **Un compito per agente.** Ogni agente ha il proprio elenco di strumenti; qualsiasi altro nome è bloccato, anche se inventato.
- **Nulla di vincolante avviene da sé.** Nessun agente emette, annulla, modifica, colloca o raccomanda coperture, paga una compagnia, sposta denaro fiduciario, emette certificati o invia messaggi. Le bozze aspettano il clic di una persona nominata, anche in modalità Auto.
- **I dati dei clienti sono mascherati.** Nomi, codici cliente, date di nascita, numeri di patente, indirizzi, telefoni ed e-mail sono sostituiti da pseudonimi come `CL-3f9a1c2e` in tutto ciò che arriva al modello di IA. I file sul vostro computer conservano i valori reali.
- **Solo file locali.** Nessuna chiamata di rete, nessuna telemetria, nessuna credenziale. Ogni chiamata finisce in un registro concatenato con hash in `.fairpolicy/`.
- **Le vostre regole.** Aliquote provvigionali, ripartizioni, scaglioni di bonus, ore di formazione e scadenze sono impostazioni nei vostri file. Le regole su abilitazioni, mandati e conti fiduciari variano per Stato; i valori sono impostazioni confermate dalla vostra agenzia, mai consulenza legale.

## Limiti

- I formati di esportazione sono stati scritti in base alla conoscenza dei sistemi e non testati su un account reale; `inspect` mostra come è stato letto un file.
- Non è consulenza legale, fiscale, contabile o assicurativa. Una persona abilitata decide cosa offrire, emettere, modificare o inviare.

MIT © 2026 Kurt Francisco
