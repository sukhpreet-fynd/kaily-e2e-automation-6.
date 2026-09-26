import { test } from '../../src/fixtures/test.ts';
import { inboundConfig } from '../../src/config/env.ts';
import { testMessage } from '../../src/data/test-message.ts';
import { IntegrationInbound } from '../../src/channels/integration-inbound.ts';
import { eventually } from '../../src/polling/eventually.ts';

test('API-injected inbound web text appears in Helpdesk @p0 @writes', async ({ helpdesk, helpdeskPage }) => {
  test.skip(process.env.KAILY_ENABLE_INBOUND !== 'true', 'Inbound creation disabled pending app selection and side-effect isolation.');
  const config = inboundConfig();
  const data = testMessage();
  test.info().annotations.push({ type: 'synthetic-run', description: data.runId });
  const startedAt = Date.now();
  const receipt = await new IntegrationInbound(helpdesk).createInbound(data);
  await eventually(ms => helpdesk.listThreads({ id: receipt.threadId }, ms),
    rows => rows.some(row => row.id === receipt.threadId), { timeoutMs: config.pollTimeout });
  const messages = await eventually(ms => helpdesk.messages(config.appId, receipt.threadId, ms),
    rows => rows.some(row => row.id === receipt.messageId), { timeoutMs: config.pollTimeout, allowNotFound: true });
  const message = messages.find(row => row.id === receipt.messageId)!;
  if (message.content !== data.content || message.role !== 'user' || message.userId !== receipt.userId || message.threadId !== receipt.threadId) {
    throw new Error('Persisted inbound message does not match the synthetic content, sender or thread.');
  }
  const createdAt = typeof message.createdAt === 'string' ? message.createdAt : '';
  const timestamp = Date.parse(createdAt);
  if (!Number.isFinite(timestamp) || timestamp < startedAt - 60_000 || timestamp > Date.now() + 60_000) {
    throw new Error('Inbound message timestamp is invalid or outside the run window.');
  }
  await helpdeskPage.openSyntheticThread(data, receipt);
  await helpdeskPage.assertMessage(data, createdAt);
});
