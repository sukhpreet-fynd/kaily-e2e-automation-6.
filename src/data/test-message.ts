import { randomUUID } from 'node:crypto';
export function testMessage() {
  const runId = `p0-${randomUUID()}`;
  return { runId, customerName: `P0 Customer ${runId}`, title: `P0 inbound ${runId}`,
    content: `P0 inbound text ${runId}`, messageId: `${runId}-message` };
}
export type TestMessage = ReturnType<typeof testMessage>;
