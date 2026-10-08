import { test, expect } from '../../src/fixtures/api.ts';
import { APPROVED_ORG } from '../../src/config/env.ts';

// Thread detail shape contract. Fields verified against trinity
// `src/pages/Helpdesk/Threads/Info/*` component props:
//   - thread?.id             (Info/index.js, ServerlessAppSheet.js, Properties.js)
//   - thread?.status         (Chat/ChatWidget.js, Chat/printConversation.js)
//   - thread?.priority       (Info/Properties.js priority chip)
//   - thread?.copilotAppId   (Info/ThreadCustomFields.js)
//   - thread?.accountId      (scope guard — must match APPROVED_ORG)
//   - thread?.createdAt      (SlaDetails.js, header timestamp)
//   - thread?.assigneeId     (nullable; Properties.js assignee bubble)
// Add more only when a new UI reader lands in trinity.
function fail (field: string, reason: string): never {
  throw new Error(`contract: thread.${field} ${reason}`);
}

test.describe.serial('Contract: thread detail', () => {
  test('detail carries the info-panel fields @contract', async ({ api }) => {
    const rows = await api.helpdesk.listThreads();
    if (!rows.length) test.skip(true, 'No threads provisioned; cannot assert contract.');
    const id = String(rows[0].id);
    const detail = await api.helpdesk.thread(id);

    if (typeof detail.id !== 'string' || detail.id !== id) fail('id', 'must echo requested id as string');
    if (detail.accountId !== APPROVED_ORG) fail('accountId', `must equal APPROVED_ORG (${APPROVED_ORG})`);
    if (typeof detail.status !== 'string') fail('status', 'must be a string');
    if (detail.priority != null && typeof detail.priority !== 'string') fail('priority', 'must be string or null');
    if (typeof detail.createdAt !== 'string' || Number.isNaN(Date.parse(detail.createdAt))) fail('createdAt', 'must be an ISO date string');
    if (detail.assigneeId != null && typeof detail.assigneeId !== 'string') fail('assigneeId', 'must be string or null');
    if (typeof detail.copilotAppId !== 'string' || !detail.copilotAppId.length) fail('copilotAppId', 'must be a non-empty string');

    expect(detail.id).toBe(id);
  });
});
