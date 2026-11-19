import { fileURLToPath } from 'node:url';
import { demoRuntime, printStep } from 'fairpolicy-core';

export async function demo(manifest) {
  const rt = demoRuntime(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), { mode: 'auto', autoActions: ['commissions_draft_inquiry'] });
  process.stdout.write(`Fairpolicy Commission Statements demo (fictional agency, carriers and clients, October 2026) in ${rt.root}\n`);
  const f = { statement: 'statement-2026-10.csv', policies: 'policies.csv', schedule: 'schedule.json' };
  const c = await rt.call('commissions_check', f);
  printStep('Check every statement line against the expected commission', c);
  for (const i of c.result.items) process.stdout.write(`    ${i.policy_number.padEnd(12)} ${String(i.transaction_type).padEnd(13)} expected ${String(i.expected ?? '-').padStart(8)}  paid ${String(i.paid).padStart(8)}  ${i.status}\n`);
  printStep('Explain the workers comp line', await rt.call('commissions_explain', { ...f, policy_number: 'WC-88120' }));
  printStep('Write the commission worklist', await rt.call('commissions_write_report', f));
  const d = await rt.call('commissions_draft_inquiry', { ...f, carrier: 'Sample Casualty', from: 'Casey Park, Example Agency (fictional)', contact: 'commissions@sample-casualty.example' });
  printStep('Draft a commission inquiry to the carrier that paid the renewal rate on new business', d);
  const args = { draft: d.result.draft, draft_sha256: d.result.draft_sha256, accept_open_issues: true, note: 'Rates checked against the agency agreement' };
  const p = await rt.call('commissions_request_send', args);
  printStep('Approve sending: waits for a named person even in Auto', p);
  rt.approvals.approve(p.approval_id, 'Casey Park (fictional)');
  printStep('Same call after the click (recorded; a person sends it)', await rt.call('commissions_request_send', args));
  printStep('The agent tries to post the commission in the agency system itself', await rt.call('ams_post_commission', {}));
}
