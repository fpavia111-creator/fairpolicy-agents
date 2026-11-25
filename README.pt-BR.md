# Agentes Fairpolicy para corretoras e agências de seguros

*Traduzido por Claude; revisão por falante nativo pendente. O [README](README.md) em inglês prevalece.*

Trinta pequenos agentes MCP para o back-office de corretoras e agências de seguros independentes. Cada um tem **uma única tarefa**, como conferir o extrato de comissões de uma seguradora com a comissão esperada, conciliar a conta fiduciária de prêmios ou encontrar renovações sem revisão, e não pode fazer mais nada. Eles leem os arquivos que sua agência já exporta: listas de apólices e vencimentos do Applied Epic, Vertafore AMS360 e Sagitta, HawkSoft, EZLynx ou QQCatalyst, extratos de comissão, registros de download e planilhas.

Parte do Fair Agents da Mythos Machines. Licença MIT · Node 20 ou superior · apenas arquivos locais · sem credenciais · sem dependências. O software é gratuito; o que se paga é uma implantação a preço fixo nos seus próprios arquivos.

## Experimentar

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

Cada agente tem uma `demo` com arquivos fictícios, um `eval` com casos de teste próprios e um servidor MCP (`npx -y <agente> mcp --root <pasta>`).

## Os agentes

**Comissões (5):** `fairpolicy-commission-statements` (extrato contra comissão esperada), `fairpolicy-missing-commissions` (apólices sem comissão), `fairpolicy-commission-chargebacks` (estornos por cancelamento), `fairpolicy-producer-splits` (divisões de produtores), `fairpolicy-contingency-bonus` (bônus por desempenho).

**Cobrança, conta fiduciária e prêmios (6):** `fairpolicy-trust-account` (conta fiduciária de prêmios), `fairpolicy-receivables-aging` (prêmios a receber), `fairpolicy-direct-agency-bill` (cobrança dupla), `fairpolicy-premium-finance` (financiamento de prêmios), `fairpolicy-carrier-payables` (conta corrente com seguradoras), `fairpolicy-return-premiums` (prêmios a restituir).

**Renovações, carteira e retenção (6):** `fairpolicy-renewal-remarket` (renovações sem revisão), `fairpolicy-commercial-renewals` (cronograma de renovações empresariais), `fairpolicy-lapsed-policies` (apólices vencidas e canceladas), `fairpolicy-cross-sell` (clientes com um só ramo), `fairpolicy-producer-retention` (retenção por produtor), `fairpolicy-book-valuation` (resumo da carteira (não é avaliação)).

**Atendimento (6):** `fairpolicy-certificate-limits` (certificados contra apólices), `fairpolicy-additional-insureds` (segurados adicionais e renúncias), `fairpolicy-pending-endorsements` (endossos pendentes), `fairpolicy-policy-checking` (apólice contra a cobertura contratada), `fairpolicy-open-claims` (sinistros abertos), `fairpolicy-loss-runs` (histórico de sinistros por cliente).

**Licenças, arquivos de E&O e dados (7):** `fairpolicy-license-renewals` (licenças e educação continuada), `fairpolicy-carrier-appointments` (nomeações de seguradoras), `fairpolicy-signed-declinations` (formulários assinados e recusas), `fairpolicy-workers-comp-audits` (auditorias de prêmio), `fairpolicy-data-quality` (qualidade dos dados), `fairpolicy-duplicate-clients` (clientes duplicados), `fairpolicy-carrier-feed-errors` (erros de download).

## Como se mantêm seguros

- **Uma tarefa por agente.** Cada agente tem sua própria lista de ferramentas; qualquer outro nome é bloqueado, mesmo inventado.
- **Nada vinculante acontece sozinho.** Nenhum agente emite, cancela, endossa, coloca ou recomenda coberturas, paga uma seguradora, movimenta dinheiro fiduciário, emite certificados ou envia mensagens. Os rascunhos aguardam o clique de uma pessoa nomeada, mesmo no modo Auto.
- **Os dados de clientes são mascarados.** Nomes, códigos, datas de nascimento, CNH, endereços, telefones e e-mails são trocados por pseudônimos como `CL-3f9a1c2e` em tudo o que vai para o modelo de IA. Os arquivos no seu computador mantêm os valores reais.
- **Apenas arquivos locais.** Sem chamadas de rede, sem telemetria, sem credenciais. Cada chamada vai para um registro encadeado por hash em `.fairpolicy/`.
- **Suas regras.** Taxas de comissão, divisões, faixas de bônus, horas de educação continuada e prazos são configurações nos seus próprios arquivos. Regras de licença, nomeação e conta fiduciária variam por estado; os valores são configurações que sua agência confirma, nunca aconselhamento jurídico.

## Limites

- Os formatos de exportação foram escritos a partir do conhecimento de cada sistema e não testados em uma conta real; `inspect` mostra como um arquivo foi lido.
- Não é aconselhamento jurídico, fiscal, contábil ou de coberturas. Uma pessoa habilitada decide o que oferecer, emitir, alterar ou enviar.

MIT © 2026 Kurt Francisco
