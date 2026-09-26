import type { TestMessage } from '../data/test-message.ts';
export interface InboundReceipt {
  userId: string; threadId: string; messageId: string; surface: 'web';
}
export interface InboundChannel {
  createInbound(data: TestMessage): Promise<InboundReceipt>;
}
