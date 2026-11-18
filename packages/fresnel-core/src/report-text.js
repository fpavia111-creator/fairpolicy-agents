// Words in the reports people read, in the nine report languages: the page chrome
// and the column headings every Fresnel worklist uses. Reason sentences inside rows
// stay in English (they quote policy numbers and amounts the same way in every
// language). Written by Claude; native review pending.
//
// Order in every row: en, de, fr, es, pt (Brazil), it, ja, zh (Simplified), ko.
import { LANGS, normLang } from './lang.js';

const row = (...v) => Object.fromEntries(LANGS.map((l, i) => [l, v[i] ?? v[0]]));

export const REPORT_TEXT = {
  all_rows: row('All rows ({n})', 'Alle Zeilen ({n})', 'Toutes les lignes ({n})', 'Todas las filas ({n})', 'Todas as linhas ({n})', 'Tutte le righe ({n})', '全行 ({n})', '全部行 ({n})', '전체 행 ({n})'),
  limits: row('Limits', 'Grenzen', 'Limites', 'Límites', 'Limites', 'Limiti', '制約', '局限', '한계'),
  none: row('None.', 'Keine.', 'Aucun.', 'Ninguno.', 'Nenhum.', 'Nessuno.', 'なし。', '无。', '없음.'),
  footer: row(
    'Written by a Fresnel agent from your files on this computer. Nothing was bound, cancelled, endorsed, sent or paid. This page contains client information: keep it in your secure folder and do not e-mail it.',
    'Von einem Fresnel-Agenten aus Ihren Dateien auf diesem Rechner erstellt. Nichts wurde gebunden, storniert, nachgetragen, gesendet oder bezahlt. Diese Seite enthält Kundendaten: Bewahren Sie sie in Ihrem geschützten Ordner auf und versenden Sie sie nicht per E-Mail.',
    'Rédigé par un agent Fresnel à partir de vos fichiers sur cet ordinateur. Rien n’a été souscrit, résilié, avenanté, envoyé ni payé. Cette page contient des données clients : conservez-la dans votre dossier sécurisé et ne l’envoyez pas par e-mail.',
    'Generado por un agente de Fresnel a partir de sus archivos en este equipo. No se emitió, anuló, modificó, envió ni pagó nada. Esta página contiene datos de clientes: guárdela en su carpeta segura y no la envíe por correo electrónico.',
    'Gerado por um agente Fresnel a partir dos seus arquivos neste computador. Nada foi emitido, cancelado, endossado, enviado ou pago. Esta página contém dados de clientes: guarde-a na sua pasta segura e não a envie por e-mail.',
    'Prodotto da un agente Fresnel dai vostri file su questo computer. Nulla è stato emesso, annullato, modificato con appendice, inviato o pagato. Questa pagina contiene dati dei clienti: conservatela nella cartella protetta e non inviatela per e-mail.',
    'このコンピューター上のファイルから Fresnel エージェントが作成しました。引受・解約・異動・送信・支払いは一切行っていません。このページには顧客情報が含まれます。安全なフォルダーに保管し、メールで送らないでください。',
    '由 Fresnel 智能体根据本机文件生成。未承保、未退保、未批改、未发送、未付款。本页面含有客户信息：请保存在安全文件夹中，不要通过电子邮件发送。',
    '이 컴퓨터의 파일로 Fresnel 에이전트가 작성했습니다. 아무것도 인수·해지·배서·전송·지급하지 않았습니다. 이 페이지에는 고객 정보가 있으니 보안 폴더에 보관하고 이메일로 보내지 마세요.'),
  review_note: row('', 'Übersetzt von Claude; die Prüfung durch Muttersprachler steht noch aus.', 'Traduit par Claude ; relecture par un locuteur natif en attente.', 'Traducido por Claude; pendiente de revisión por un hablante nativo.', 'Traduzido por Claude; revisão por falante nativo pendente.', 'Tradotto da Claude; revisione di un madrelingua in attesa.', 'Claude による翻訳です。ネイティブスピーカーの確認は未実施です。', '由 Claude 翻译，尚未经母语人士审校。', 'Claude가 번역했으며 원어민 검토는 아직 받지 않았습니다.'),
  reasons_english: row('', 'Die Begründungen in den Zeilen stehen auf Englisch, damit Policennummern und Beträge überall gleich lauten.', 'Les motifs dans les lignes restent en anglais pour que numéros de police et montants se lisent partout de la même façon.', 'Los motivos de cada fila se mantienen en inglés para que números de póliza e importes se lean igual en todas partes.', 'Os motivos nas linhas ficam em inglês para que números de apólice e valores sejam lidos da mesma forma em todo lugar.', 'I motivi nelle righe restano in inglese, così numeri di polizza e importi si leggono ovunque allo stesso modo.', '各行の理由は、証券番号と金額をどこでも同じに読めるよう英語のままです。', '各行中的原因保持英文，以便保单号和金额在各处读法一致。', '각 행의 사유는 증권번호와 금액이 어디서나 같게 읽히도록 영어로 둡니다.'),
};

// Column headings (keys are the column names the agents write).
export const COLUMN_LABELS = {
  policy_number: row('Policy', 'Vertrag', 'Police', 'Póliza', 'Apólice', 'Polizza', '証券番号', '保单号', '증권번호'),
  client: row('Client', 'Kunde', 'Client', 'Cliente', 'Cliente', 'Cliente', '顧客', '客户', '고객'),
  client_id: row('Client code', 'Kundennummer', 'Code client', 'Código de cliente', 'Código do cliente', 'Codice cliente', '顧客コード', '客户编号', '고객 코드'),
  carrier: row('Carrier', 'Versicherer', 'Assureur', 'Aseguradora', 'Seguradora', 'Compagnia', '保険会社', '保险公司', '보험사'),
  line: row('Line', 'Sparte', 'Branche', 'Ramo', 'Ramo', 'Ramo', '種目', '险种', '보종'),
  effective_date: row('Effective', 'Beginn', 'Effet', 'Efecto', 'Início', 'Decorrenza', '始期', '生效日', '개시일'),
  expiration_date: row('Expires', 'Ablauf', 'Échéance', 'Vencimiento', 'Fim de vigência', 'Scadenza', '満期', '到期日', '만기일'),
  premium: row('Premium', 'Beitrag', 'Prime', 'Prima', 'Prêmio', 'Premio', '保険料', '保费', '보험료'),
  commission: row('Commission', 'Courtage', 'Commission', 'Comisión', 'Comissão', 'Provvigione', '手数料', '佣金', '수수료'),
  commission_rate: row('Commission %', 'Courtagesatz %', 'Taux de commission %', '% comisión', '% comissão', '% provvigione', '手数料率 %', '佣金率 %', '수수료율 %'),
  producer: row('Producer', 'Vermittler', 'Producteur', 'Productor', 'Produtor', 'Produttore', '募集人', '业务员', '설계사'),
  csr: row('Account manager', 'Sachbearbeiter', 'Gestionnaire', 'Gestor', 'Atendente', 'Gestore', '事務担当', '客服', '사무담당'),
  transaction_type: row('Transaction', 'Vorgang', 'Mouvement', 'Movimiento', 'Movimento', 'Movimento', '取引区分', '交易类型', '거래구분'),
  bill_type: row('Billing', 'Inkasso', 'Encaissement', 'Cobro', 'Cobrança', 'Incasso', '集金方法', '收费方式', '수납방법'),
  state: row('State', 'Bundesland', 'État', 'Estado', 'Estado', 'Stato', '州', '州', '주'),
  claim_number: row('Claim', 'Schaden', 'Sinistre', 'Siniestro', 'Sinistro', 'Sinistro', '事故番号', '理赔号', '사고번호'),
  loss_date: row('Date of loss', 'Schadendatum', 'Date du sinistre', 'Fecha del siniestro', 'Data do sinistro', 'Data sinistro', '事故日', '出险日期', '사고일'),
  reserve: row('Reserve', 'Reserve', 'Provision', 'Reserva', 'Reserva', 'Riserva', '支払備金', '未决赔款', '준비금'),
  incurred: row('Incurred', 'Schadenaufwand', 'Charge sinistre', 'Incurrido', 'Incorrido', 'Costo sinistri', '発生損害額', '已发生赔款', '발생손해액'),
  loss_ratio: row('Loss ratio %', 'Schadenquote %', 'Ratio S/P %', 'Siniestralidad %', 'Sinistralidade %', 'Rapporto sinistri/premi %', '損害率 %', '赔付率 %', '손해율 %'),
  vin: row('VIN', 'FIN', 'VIN', 'VIN', 'Chassi', 'Telaio', '車台番号', '车架号', '차대번호'),
  date: row('Date', 'Datum', 'Date', 'Fecha', 'Data', 'Data', '日付', '日期', '날짜'),
  expected: row('Expected', 'Erwartet', 'Attendu', 'Esperado', 'Esperado', 'Atteso', '期待額', '应收', '예상액'),
  received: row('Received', 'Erhalten', 'Reçu', 'Recibido', 'Recebido', 'Ricevuto', '受領額', '已收', '수령액'),
  paid: row('Paid', 'Bezahlt', 'Payé', 'Pagado', 'Pago', 'Pagato', '支払額', '已付', '지급액'),
  difference: row('Difference', 'Differenz', 'Écart', 'Diferencia', 'Diferença', 'Differenza', '差額', '差额', '차액'),
  variance: row('Difference', 'Differenz', 'Écart', 'Diferencia', 'Diferença', 'Differenza', '差額', '差额', '차액'),
  amount: row('Amount', 'Betrag', 'Montant', 'Importe', 'Valor', 'Importo', '金額', '金额', '금액'),
  total: row('Total', 'Summe', 'Total', 'Total', 'Total', 'Totale', '合計', '合计', '합계'),
  count: row('Count', 'Anzahl', 'Nombre', 'Cantidad', 'Quantidade', 'Numero', '件数', '数量', '건수'),
  policies: row('Policies', 'Verträge', 'Polices', 'Pólizas', 'Apólices', 'Polizze', '契約数', '保单数', '계약 수'),
  accounts: row('Accounts', 'Kunden', 'Clients', 'Cuentas', 'Contas', 'Clienti', '顧客数', '客户数', '고객 수'),
  status: row('Status', 'Status', 'Statut', 'Estado', 'Situação', 'Stato', '状態', '状态', '상태'),
  findings: row('Findings', 'Befunde', 'Constats', 'Hallazgos', 'Achados', 'Rilievi', '検出事項', '发现', '발견 사항'),
  reasons: row('Reasons', 'Gründe', 'Motifs', 'Motivos', 'Motivos', 'Motivi', '理由', '原因', '사유'),
  reason: row('Reason', 'Grund', 'Motif', 'Motivo', 'Motivo', 'Motivo', '理由', '原因', '사유'),
  detail: row('Detail', 'Einzelheiten', 'Détail', 'Detalle', 'Detalhe', 'Dettaglio', '詳細', '详情', '세부'),
  category: row('Category', 'Kategorie', 'Catégorie', 'Categoría', 'Categoria', 'Categoria', '分類', '类别', '분류'),
  next_step: row('Next step', 'Nächster Schritt', 'Étape suivante', 'Siguiente paso', 'Próximo passo', 'Passo successivo', '次の対応', '下一步', '다음 단계'),
  priority: row('Priority', 'Priorität', 'Priorité', 'Prioridad', 'Prioridade', 'Priorità', '優先度', '优先级', '우선순위'),
  days: row('Days', 'Tage', 'Jours', 'Días', 'Dias', 'Giorni', '日数', '天数', '일수'),
  age_days: row('Age (days)', 'Alter (Tage)', 'Âge (jours)', 'Antigüedad (días)', 'Idade (dias)', 'Età (giorni)', '経過日数', '账龄（天）', '경과 일수'),
  days_left: row('Days left', 'Verbleibende Tage', 'Jours restants', 'Días restantes', 'Dias restantes', 'Giorni rimanenti', '残り日数', '剩余天数', '남은 일수'),
  bucket: row('Aging bucket', 'Altersklasse', 'Tranche d’ancienneté', 'Tramo de antigüedad', 'Faixa de vencimento', 'Fascia di anzianità', '経過区分', '账龄区间', '경과 구간'),
  balance: row('Balance', 'Saldo', 'Solde', 'Saldo', 'Saldo', 'Saldo', '残高', '余额', '잔액'),
  deadline: row('Deadline', 'Frist', 'Échéance', 'Plazo', 'Prazo', 'Scadenza', '期限', '截止日期', '기한'),
  due: row('Due', 'Fällig', 'Échéance', 'Vence', 'Vencimento', 'Scadenza', '期日', '到期日', '기한'),
  due_date: row('Due date', 'Fälligkeit', 'Date d’échéance', 'Fecha de vencimiento', 'Data de vencimento', 'Data di scadenza', '期日', '到期日', '기한일'),
  rate: row('Rate', 'Satz', 'Taux', 'Tasa', 'Taxa', 'Aliquota', '率', '费率', '요율'),
  percent: row('%', '%', '%', '%', '%', '%', '%', '%', '%'),
  share: row('Share', 'Anteil', 'Part', 'Proporción', 'Participação', 'Quota', '割合', '占比', '비율'),
  decision: row('Decision', 'Entscheidung', 'Décision', 'Decisión', 'Decisão', 'Decisione', '判断', '决定', '결정'),
  decided_by: row('Decided by', 'Entschieden von', 'Décidé par', 'Decidido por', 'Decidido por', 'Deciso da', '判断者', '决定人', '결정자'),
  owner: row('Owner', 'Verantwortlich', 'Responsable', 'Responsable', 'Responsável', 'Responsabile', '担当者', '负责人', '담당자'),
  notes: row('Notes', 'Notizen', 'Notes', 'Notas', 'Observações', 'Note', 'メモ', '备注', '메모'),
  document: row('Document', 'Unterlage', 'Document', 'Documento', 'Documento', 'Documento', '書類', '文件', '서류'),
  missing: row('Missing', 'Fehlt', 'Manquant', 'Falta', 'Faltando', 'Mancante', '不足', '缺失', '누락'),
  file: row('File', 'Datei', 'Fichier', 'Archivo', 'Arquivo', 'File', 'ファイル', '文件', '파일'),
  field: row('Field', 'Feld', 'Champ', 'Campo', 'Campo', 'Campo', '項目', '字段', '필드'),
  message: row('Finding', 'Befund', 'Constat', 'Hallazgo', 'Achado', 'Rilievo', '指摘', '发现', '지적 사항'),
  fix: row('How to fix', 'Behebung', 'Correction', 'Cómo corregir', 'Como corrigir', 'Come correggere', '修正方法', '修正方法', '수정 방법'),
  severity: row('Severity', 'Schweregrad', 'Gravité', 'Gravedad', 'Gravidade', 'Gravità', '重大度', '严重程度', '심각도'),
  metric: row('Measure', 'Kennzahl', 'Indicateur', 'Indicador', 'Indicador', 'Indicatore', '指標', '指标', '지표'),
  value: row('Value', 'Wert', 'Valeur', 'Valor', 'Valor', 'Valore', '値', '数值', '값'),
  target: row('Target', 'Ziel', 'Objectif', 'Objetivo', 'Meta', 'Obiettivo', '目標', '目标', '목표'),
  month: row('Month', 'Monat', 'Mois', 'Mes', 'Mês', 'Mese', '月', '月份', '월'),
  year: row('Year', 'Jahr', 'Année', 'Año', 'Ano', 'Anno', '年', '年份', '연도'),
  rule: row('Check', 'Prüfung', 'Contrôle', 'Verificación', 'Verificação', 'Controllo', 'チェック', '检查项', '점검 항목'),
  risk: row('Risk', 'Risiko', 'Risque', 'Riesgo', 'Risco', 'Rischio', 'リスク', '风险', '위험'),
  action: row('Action', 'Maßnahme', 'Action', 'Acción', 'Ação', 'Azione', '対応', '操作', '조치'),
  issue: row('Issue', 'Problem', 'Problème', 'Problema', 'Problema', 'Problema', '問題', '问题', '문제'),
  source: row('Source', 'Quelle', 'Source', 'Fuente', 'Fonte', 'Fonte', '出典', '来源', '출처'),
  statement: row('Statement', 'Abrechnung', 'Bordereau', 'Liquidación', 'Extrato', 'Estratto', '精算書', '结算单', '정산서'),
  installment: row('Installment', 'Rate', 'Échéance', 'Cuota', 'Parcela', 'Rata', '分割払額', '分期金额', '할부금'),
  license: row('Licence', 'Zulassung', 'Agrément', 'Licencia', 'Licença', 'Licenza', '登録', '执照', '자격'),
  hours: row('Hours', 'Stunden', 'Heures', 'Horas', 'Horas', 'Ore', '時間', '小时', '시간'),
};

/** Category labels (kept for agents that group findings by category; few use it). */
export const CATEGORY_LABELS = {
  money: row('Money', 'Geld', 'Argent', 'Dinero', 'Dinheiro', 'Denaro', '金銭', '资金', '금전'),
  service: row('Service', 'Service', 'Service', 'Servicio', 'Atendimento', 'Servizio', 'サービス', '服务', '서비스'),
  compliance: row('Compliance setting', 'Einstellung zur Regelkonformität', 'Paramètre de conformité', 'Ajuste de cumplimiento', 'Configuração de conformidade', 'Impostazione di conformità', 'コンプライアンス設定', '合规设置', '준법 설정'),
  data: row('Data quality', 'Datenqualität', 'Qualité des données', 'Calidad de datos', 'Qualidade dos dados', 'Qualità dei dati', 'データ品質', '数据质量', '데이터 품질'),
  other: row('Other', 'Sonstiges', 'Autre', 'Otro', 'Outro', 'Altro', 'その他', '其他', '기타'),
};

/** Section titles the agents' report pages share. */
export const SECTION_TITLES = {
  by_carrier: row('By carrier', 'Nach Versicherer', 'Par assureur', 'Por aseguradora', 'Por seguradora', 'Per compagnia', '保険会社別', '按保险公司', '보험사별'),
  by_producer: row('By producer', 'Nach Vermittler', 'Par producteur', 'Por productor', 'Por produtor', 'Per produttore', '募集人別', '按业务员', '설계사별'),
  by_line: row('By line', 'Nach Sparte', 'Par branche', 'Por ramo', 'Por ramo', 'Per ramo', '種目別', '按险种', '보종별'),
  by_client: row('By client', 'Nach Kunde', 'Par client', 'Por cliente', 'Por cliente', 'Per cliente', '顧客別', '按客户', '고객별'),
  by_state: row('By state', 'Nach Bundesland', 'Par État', 'Por estado', 'Por estado', 'Per stato', '州別', '按州', '주별'),
  by_rule: row('By check', 'Nach Prüfung', 'Par contrôle', 'Por verificación', 'Por verificação', 'Per controllo', 'チェック別', '按检查项', '점검 항목별'),
  by_severity: row('By severity', 'Nach Schweregrad', 'Par gravité', 'Por gravedad', 'Por gravidade', 'Per gravità', '重大度別', '按严重程度', '심각도별'),
  by_month: row('By month', 'Nach Monat', 'Par mois', 'Por mes', 'Por mês', 'Per mese', '月別', '按月份', '월별'),
  by_status: row('By status', 'Nach Status', 'Par statut', 'Por estado', 'Por status', 'Per stato', 'ステータス別', '按状态', '상태별'),
  by_bucket: row('By age bucket', 'Nach Altersklasse', 'Par tranche d’âge', 'Por antigüedad', 'Por faixa de idade', 'Per fascia di anzianità', '経過日数別', '按账龄', '경과 기간별'),
  summary: row('Summary', 'Zusammenfassung', 'Résumé', 'Resumen', 'Resumo', 'Riepilogo', '概要', '摘要', '요약'),
};
/** A shared section title as { en, de, ... } for writeWorklist. */
export const sectionTitle = (key) => SECTION_TITLES[key] || { en: key };

/** Text and labels for one language. */
export function reportText(lang) {
  const l = normLang(lang);
  const pick = (e, fallback) => (e ? e[l] || e.en : fallback);
  return {
    lang: l,
    t: (key, vars = {}) => String(pick(REPORT_TEXT[key], key)).replace(/\{(\w+)\}/g, (m, k) => (vars[k] === undefined ? m : String(vars[k]))),
    column: (c) => pick(COLUMN_LABELS[c], c.replace(/_/g, ' ')),
    category: (c) => pick(CATEGORY_LABELS[c], c),
    /** A title given as a string, or as { en, de, ... }. */
    title: (x) => (x && typeof x === 'object' ? x[l] || x.en : String(x ?? '')),
  };
}
