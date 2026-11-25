# 보험 대리점·중개사를 위한 Fairpolicy 에이전트

*Claude가 번역했으며 원어민 검토는 아직입니다. 영어 [README](README.md)가 기준입니다.*

독립 보험 대리점과 중개사의 백오피스를 위한 작은 MCP 에이전트 30개입니다. 각 에이전트는 **한 가지 일**만 맡습니다. 예를 들어 보험사 수수료 정산서를 기대 수수료와 대조하거나, 보험료 신탁계좌를 대사하거나, 검토 기록이 없는 갱신을 찾는 일이며, 그 밖의 일은 할 수 없습니다. 대리점이 이미 내보내는 파일을 읽습니다: Applied Epic, Vertafore AMS360·Sagitta, HawkSoft, EZLynx, QQCatalyst의 계약·만기 목록, 수수료 정산서, 다운로드 로그, 스프레드시트.

Mythos Machines의 Fair Agents에 속합니다. MIT 라이선스 · Node 20 이상 · 로컬 파일만 · 자격 증명 없음 · 의존성 없음. 소프트웨어는 무료이며, 유료는 고객 파일에 대한 고정 가격 설정입니다.

## 사용해 보기

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

각 에이전트에는 가상 파일로 돌리는 `demo`, 자체 테스트 케이스가 있는 `eval`, MCP 서버(`npx -y <agent> mcp --root <folder>`)가 있습니다.

## 에이전트

**수수료 (5):** `fairpolicy-commission-statements` (정산서와 기대 수수료 대조), `fairpolicy-missing-commissions` (정산되지 않은 계약), `fairpolicy-commission-chargebacks` (해지 수수료 환수), `fairpolicy-producer-splits` (설계사 배분), `fairpolicy-contingency-bonus` (성과 보너스).

**대리점 수납·신탁·보험료 (6):** `fairpolicy-trust-account` (보험료 신탁계좌), `fairpolicy-receivables-aging` (수금 미수금), `fairpolicy-direct-agency-bill` (이중 청구), `fairpolicy-premium-finance` (보험료 금융), `fairpolicy-carrier-payables` (보험사 정산), `fairpolicy-return-premiums` (환급 보험료).

**갱신·보유·유지 (6):** `fairpolicy-renewal-remarket` (검토 없는 갱신), `fairpolicy-commercial-renewals` (기업보험 갱신 일정), `fairpolicy-lapsed-policies` (실효·해지 계약), `fairpolicy-cross-sell` (단일 보종 고객), `fairpolicy-producer-retention` (설계사별 유지율), `fairpolicy-book-valuation` (보유 계약 요약(평가 아님)).

**서비스 (6):** `fairpolicy-certificate-limits` (증명서와 계약 대조), `fairpolicy-additional-insureds` (추가 피보험자와 대위 포기), `fairpolicy-pending-endorsements` (처리 중인 배서), `fairpolicy-policy-checking` (증권과 인수 내용 대조), `fairpolicy-open-claims` (미결 사고), `fairpolicy-loss-runs` (고객별 손해 이력).

**자격·E&O 서류·데이터 (7):** `fairpolicy-license-renewals` (자격과 보수 교육), `fairpolicy-carrier-appointments` (보험사 위촉), `fairpolicy-signed-declinations` (서명 서류와 거절서), `fairpolicy-workers-comp-audits` (보험료 정산 감사), `fairpolicy-data-quality` (계약 데이터 품질), `fairpolicy-duplicate-clients` (중복 고객), `fairpolicy-carrier-feed-errors` (다운로드 오류).

## 안전 장치

- **에이전트마다 한 가지 일.** 각 에이전트는 자체 도구 목록을 가지며, 다른 도구 이름(모델이 지어낸 이름 포함)은 차단됩니다.
- **구속력 있는 일은 저절로 일어나지 않습니다.** 어떤 에이전트도 인수·해지·배서·보험 주선이나 추천, 보험사 지급, 신탁 자금 이동, 증명서 발급, 메시지 전송을 하지 않습니다. 초안은 Auto 모드에서도 지정된 사람의 클릭을 기다립니다.
- **고객 데이터는 가려집니다.** AI 모델로 가는 모든 내용에서 이름, 고객 코드, 생년월일, 운전면허 번호, 주소, 전화, 이메일은 `CL-3f9a1c2e` 같은 가명으로 바뀝니다. 고객 컴퓨터에 쓰는 파일에는 실제 값이 남습니다.
- **로컬 파일만.** 네트워크 호출, 텔레메트리, 자격 증명이 없습니다. 모든 호출은 `.fairpolicy/` 아래 해시 체인 감사 로그에 남습니다.
- **규칙은 고객의 것.** 수수료율, 배분, 보너스 등급, 보수 교육 시간, 기한은 고객의 설정 파일에 있습니다. 자격·위촉·신탁계좌 규칙은 주마다 다르며, 값은 대리점이 확인한 설정일 뿐 법률 자문이 아닙니다.

## 한계

- 내보내기 형식은 각 시스템에 대한 지식으로 작성했으며 실제 계정으로 검증하지 않았습니다. `inspect`로 파일을 어떻게 읽었는지 볼 수 있습니다.
- 법률·세무·회계·보장 자문이 아닙니다. 무엇을 제안·인수·변경·발송할지는 자격 있는 사람이 정합니다.

MIT © 2026 Kurt Francisco
