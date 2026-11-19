# 保険代理店・ブローカー向け Fairpolicy エージェント

*Claude による翻訳です。ネイティブの確認は未実施です。正本は英語の [README](README.md) です。*

独立系保険代理店・ブローカーのバックオフィス向けの小さな MCP エージェント 30 個です。各エージェントは**一つの仕事**だけを担当します。たとえば保険会社の手数料精算書を期待手数料と照合する、保険料信託口座を照合する、見直しのない更新を見つける、といった仕事で、それ以外は何もできません。代理店がすでに出力しているファイルを読みます：Applied Epic、Vertafore AMS360・Sagitta、HawkSoft、EZLynx、QQCatalyst の契約・満期リスト、手数料精算書、ダウンロードログ、表計算ファイル。

Mythos Machines の Fair Agents の一部です。MIT ライセンス · Node 20 以上 · ローカルファイルのみ · 認証情報なし · 依存関係なし。ソフトウェアは無料で、有料なのはお客様のファイルでの定額セットアップです。

## 試してみる

```bash
npx -y fairpolicy-commission-statements demo
npx -y fairpolicy-trust-account demo
```

各エージェントには架空ファイルでの `demo`、独自テストケースの `eval`、MCP サーバー（`npx -y <agent> mcp --root <folder>`）があります。

## エージェント一覧

**手数料 (5):** `fairpolicy-commission-statements` (精算書と期待手数料の照合), `fairpolicy-missing-commissions` (未精算の契約), `fairpolicy-commission-chargebacks` (解約時の手数料戻し), `fairpolicy-producer-splits` (募集人配分), `fairpolicy-contingency-bonus` (成績連動ボーナス).

**代理店集金・信託・保険料 (6):** `fairpolicy-trust-account` (保険料信託口座), `fairpolicy-receivables-aging` (集金売掛金), `fairpolicy-direct-agency-bill` (二重請求), `fairpolicy-premium-finance` (保険料ファイナンス), `fairpolicy-carrier-payables` (保険会社精算), `fairpolicy-return-premiums` (返戻保険料).

**更新・保有・継続 (6):** `fairpolicy-renewal-remarket` (見直しのない更新), `fairpolicy-commercial-renewals` (企業契約の更改日程), `fairpolicy-lapsed-policies` (失効・解約契約), `fairpolicy-cross-sell` (単一種目の顧客), `fairpolicy-producer-retention` (募集人別継続率), `fairpolicy-book-valuation` (保有契約の概要（評価ではありません）).

**サービス (6):** `fairpolicy-certificate-limits` (証明書と契約の照合), `fairpolicy-additional-insureds` (追加被保険者と代位放棄), `fairpolicy-pending-endorsements` (未完了の異動), `fairpolicy-policy-checking` (証券と引受内容の照合), `fairpolicy-open-claims` (未決事故), `fairpolicy-loss-runs` (顧客別損害履歴).

**資格・E&O書類・データ (7):** `fairpolicy-license-renewals` (資格と継続教育), `fairpolicy-carrier-appointments` (保険会社の委託), `fairpolicy-signed-declinations` (署名書類と辞退書), `fairpolicy-workers-comp-audits` (保険料精算監査), `fairpolicy-data-quality` (契約データ品質), `fairpolicy-duplicate-clients` (重複顧客), `fairpolicy-download-errors` (ダウンロードエラー).

## 安全のしくみ

- **一エージェント一業務。** 各エージェントは専用のツール一覧を持ち、それ以外のツール名（モデルが作り出した名前も含む）はブロックされます。
- **拘束力のある操作は自動では起きません。** 引受・解約・異動・付保の手配や推奨、保険会社への支払い、信託資金の移動、証明書の発行、メッセージ送信はどのエージェントも行いません。下書きは Auto モードでも、指名された担当者のクリックを待ちます。
- **顧客データはマスクされます。** 氏名、顧客コード、生年月日、運転免許番号、住所、電話、メールは、AI モデルに返す内容ではすべて `CL-3f9a1c2e` のような仮名に置き換えられます。お客様のコンピューターに書き出すファイルには実際の値が残ります。
- **ローカルファイルのみ。** ネットワーク通信、テレメトリ、認証情報はありません。すべての呼び出しは `.fairpolicy/` 配下のハッシュ連鎖監査ログに記録されます。
- **ルールはお客様のもの。** 手数料率、配分、ボーナス表、継続教育時間、期限はお客様の設定ファイルにあります。資格・委託・信託口座のルールは州ごとに異なり、値は代理店が確認した設定であって、法的助言ではありません。

## 制約

- エクスポート形式は各システムの知識から作成したもので、実際のアカウントでは検証していません。`inspect` でファイルの読み方を確認できます。
- 法律・税務・会計・補償に関する助言ではありません。何を提案・引受・変更・送付するかは資格のある担当者が決めます。

MIT © 2026 Kurt Francisco
