import { fileURLToPath } from 'node:url';
import { familyDemo } from 'fairpolicy-core';

export const demo = (manifest) => familyDemo(manifest, fileURLToPath(new URL('../fixtures', import.meta.url)), {
  title: 'Fairpolicy Book Valuation', args: { policies: 'book.csv', settings: 'book-settings.json' },
  checkLabel: 'Summarise the book', columns: ['metric', 'value'],
  explain: { metric: 'top_carrier_share_pct' }, explainLabel: 'Explain the carrier concentration',
});
