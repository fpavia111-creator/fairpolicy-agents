# 面向保险代理与经纪机构的 Fairpolicy 智能体

*由 Claude 翻译，尚未经母语人士审校。以英文 [README](README.md) 为准。*

为独立保险代理和经纪机构后台设计的 30 个小型 MCP 智能体。每个只负责**一项工作**，例如将保险公司佣金结算单与预期佣金核对、核对保费信托账户、找出没有复核的续保，除此之外什么也做不了。它们读取贵机构已经导出的文件：Applied Epic、Vertafore AMS360 与 Sagitta、HawkSoft、EZLynx 或 QQCatalyst 的保单与到期清单、佣金结算单、下载日志和电子表格。

Mythos Machines 旗下 Fair Agents 的一部分。MIT 许可 · Node 20 或更高版本 · 仅本地文件 · 无需凭据 · 无依赖。软件免费；收费的是在您自己的文件上进行的固定价格部署。

## 试用

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

每个智能体都有基于虚构文件的 `demo`、自带测试用例的 `eval`，以及 MCP 服务器（`npx -y <agent> mcp --root <folder>`）。

## 智能体

**佣金 (5):** `fairpolicy-commission-statements` (结算单与预期佣金核对), `fairpolicy-missing-commissions` (从未结算的保单), `fairpolicy-commission-chargebacks` (退保佣金回扣), `fairpolicy-producer-splits` (业务员分成), `fairpolicy-contingency-bonus` (业绩奖金).

**代理收费、信托与保费 (6):** `fairpolicy-trust-account` (保费信托账户), `fairpolicy-receivables-aging` (代收应收款), `fairpolicy-direct-agency-bill` (重复收费), `fairpolicy-premium-finance` (保费融资), `fairpolicy-carrier-payables` (保险公司往来账), `fairpolicy-return-premiums` (应退保费).

**续保、业务组合与留存 (6):** `fairpolicy-renewal-remarket` (未复核的续保), `fairpolicy-commercial-renewals` (商业险续保时间表), `fairpolicy-lapsed-policies` (失效与退保保单), `fairpolicy-cross-sell` (单一险种客户), `fairpolicy-producer-retention` (按业务员留存率), `fairpolicy-book-valuation` (业务组合概览（非估值）).

**服务 (6):** `fairpolicy-certificate-limits` (凭证与保单核对), `fairpolicy-additional-insureds` (附加被保险人与放弃代位), `fairpolicy-pending-endorsements` (待处理批改), `fairpolicy-policy-checking` (保单与承保内容核对), `fairpolicy-open-claims` (未结赔案), `fairpolicy-loss-runs` (按客户赔付记录).

**执照、E&O 档案与数据 (7):** `fairpolicy-license-renewals` (执照与继续教育), `fairpolicy-carrier-appointments` (保险公司委任), `fairpolicy-signed-declinations` (签署表格与拒保声明), `fairpolicy-workers-comp-audits` (保费审计), `fairpolicy-data-quality` (保单数据质量), `fairpolicy-duplicate-clients` (重复客户), `fairpolicy-download-errors` (下载错误).

## 如何保持安全

- **每个智能体一项工作。** 每个智能体有自己的工具允许清单；其他任何工具名（包括模型编造的）都会被阻止。
- **任何有约束力的操作都不会自动发生。** 没有智能体会承保、退保、批改、安排或推荐保障，向保险公司付款，移动信托资金，签发凭证或发送消息。草稿即使在 Auto 模式下也要等待指定人员点击。
- **客户数据会被遮蔽。** 返回给 AI 模型的内容中，姓名、客户编号、出生日期、驾照号码、地址、电话和电子邮件都会替换为 `CL-3f9a1c2e` 这样的化名。写在您电脑上的文件保留真实值。
- **仅本地文件。** 无网络调用、无遥测、无凭据。每次调用都写入 `.fairpolicy/` 下的哈希链审计日志。
- **规则由您决定。** 佣金率、分成、奖金档位、继续教育学时和期限都是您自己文件中的设置。执照、委任和信托账户规则因州而异；这些值是贵机构确认的设置，绝非法律建议。

## 局限

- 导出格式是根据对各系统的了解编写的，未在真实账户上测试；`inspect` 会显示文件是如何读取的。
- 不构成法律、税务、会计或保障建议。由持证人员决定提供、承保、变更或发送什么。

MIT © 2026 Kurt Francisco
