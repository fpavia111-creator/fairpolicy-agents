# Agents Fairpolicy pour agences et cabinets de courtage

*Traduit par Claude ; relecture par un locuteur natif en attente. Le [README](README.md) anglais fait foi.*

Trente petits agents MCP pour le back-office des agences et cabinets de courtage indépendants. Chacun a **une seule tâche**, par exemple contrôler un bordereau de commissions d’assureur contre la commission attendue, rapprocher le compte de primes en fiducie ou trouver les renouvellements sans revue, et ne peut rien faire d’autre. Ils lisent les fichiers que votre agence exporte déjà : listes de polices et d’échéances d’Applied Epic, Vertafore AMS360 et Sagitta, HawkSoft, EZLynx ou QQCatalyst, bordereaux de commissions, journaux de téléchargement et tableurs.

Fait partie de Fair Agents de Mythos Machines. Licence MIT · Node 20 ou plus · fichiers locaux uniquement · aucun identifiant · aucune dépendance. Le logiciel est gratuit ; ce qui est payant, c’est une mise en place à prix fixe sur vos propres fichiers.

## Essayer

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

Chaque agent a une `demo` sur des fichiers fictifs, un `eval` avec ses propres cas de test et un serveur MCP (`npx -y <agent> mcp --root <dossier>`).

## Les agents

**Commissions (5):** `fairpolicy-commission-statements` (bordereau contre commission attendue), `fairpolicy-missing-commissions` (polices jamais commissionnées), `fairpolicy-commission-chargebacks` (reprises sur résiliation), `fairpolicy-producer-splits` (parts des producteurs), `fairpolicy-contingency-bonus` (commissions de résultat).

**Encaissement, fiducie et primes (6):** `fairpolicy-trust-account` (compte de primes en fiducie), `fairpolicy-receivables-aging` (primes à encaisser), `fairpolicy-direct-agency-bill` (double facturation), `fairpolicy-premium-finance` (financement des primes), `fairpolicy-carrier-payables` (compte courant assureur), `fairpolicy-return-premiums` (primes à rembourser).

**Renouvellements, portefeuille et fidélisation (6):** `fairpolicy-renewal-remarket` (renouvellements sans revue), `fairpolicy-commercial-renewals` (calendrier des renouvellements entreprises), `fairpolicy-lapsed-policies` (polices échues et résiliées), `fairpolicy-cross-sell` (clients monoéquipés), `fairpolicy-producer-retention` (conservation par producteur), `fairpolicy-book-valuation` (synthèse du portefeuille (pas une évaluation)).

**Service (6):** `fairpolicy-certificate-limits` (attestations contre polices), `fairpolicy-additional-insureds` (assurés additionnels et renonciations), `fairpolicy-pending-endorsements` (avenants en attente), `fairpolicy-policy-checking` (police contre note de couverture), `fairpolicy-open-claims` (sinistres ouverts), `fairpolicy-loss-runs` (sinistralité par client).

**Agréments, dossiers E&O et données (7):** `fairpolicy-license-renewals` (agréments et formation continue), `fairpolicy-carrier-appointments` (mandats d’assureurs), `fairpolicy-signed-declinations` (formulaires signés et refus), `fairpolicy-workers-comp-audits` (régularisations de prime), `fairpolicy-data-quality` (qualité des données), `fairpolicy-duplicate-clients` (clients en double), `fairpolicy-carrier-feed-errors` (erreurs de téléchargement).

## Comment ils restent sûrs

- **Une tâche par agent.** Chaque agent a sa propre liste d’outils ; tout autre nom d’outil est bloqué, même inventé.
- **Rien d’engageant ne se fait tout seul.** Aucun agent ne souscrit, résilie, avenante, place ou recommande une garantie, ne paie un assureur, ne déplace l’argent en fiducie, n’émet d’attestation ni n’envoie de message. Les brouillons attendent le clic d’une personne nommée, même en mode Auto.
- **Les données clients sont masquées.** Noms, codes clients, dates de naissance, numéros de permis, adresses, téléphones et e-mails sont remplacés par des pseudonymes comme `CL-3f9a1c2e` dans tout ce qui part vers le modèle d’IA. Les fichiers sur votre ordinateur gardent les vraies valeurs.
- **Fichiers locaux uniquement.** Aucun appel réseau, aucune télémétrie, aucun identifiant. Chaque appel est consigné dans un journal chaîné par hachage sous `.fairpolicy/`.
- **Vos règles.** Taux de commission, partages, grilles de bonus, heures de formation et délais sont des paramètres dans vos propres fichiers. Les règles d’agrément, de mandat et de fiducie varient selon l’État ; les valeurs sont des paramètres confirmés par votre agence, jamais un conseil juridique.

## Limites

- Les formats d’export ont été écrits d’après la connaissance des logiciels, sans test sur un compte réel ; `inspect` montre comment un fichier a été lu.
- Ce n’est pas un conseil juridique, fiscal, comptable ou de garantie. Une personne habilitée décide de ce qui est proposé, souscrit, modifié ou envoyé.

MIT © 2026 Kurt Francisco
