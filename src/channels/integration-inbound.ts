import { inboundConfig } from '../config/env.ts';
import type { HelpdeskClient } from '../api/helpdesk-client.ts';
import { identifier, jsonRequest, object } from '../api/transport.ts';
import type { TestMessage } from '../data/test-message.ts';
import type { InboundChannel, InboundReceipt } from './inbound-channel.ts';

export class IntegrationInbound implements InboundChannel {
  private readonly helpdesk: HelpdeskClient;
  constructor(helpdesk: HelpdeskClient) { this.helpdesk = helpdesk; }
  async createInbound(data: TestMessage): Promise<InboundReceipt> {
    const config = inboundConfig();
    await this.helpdesk.verifyIntegration(config.appId, config.integrationId, config.integrationToken);
    const headers = { 'x-integration-id': config.integrationId, 'x-integration-token': config.integrationToken };
    const user = object(await jsonRequest(config.integrationBase, '/v1/users', headers, 'POST', {
      hostId: data.runId, name: data.customerName, surfaces: ['web'],
    }));
    const userId = identifier(user.id);
    const thread = object(await jsonRequest(config.integrationBase, '/v1/conversations', headers, 'POST', {
      title: data.title, userId, meta: { surface: 'web' }, appendMeta: true,
    }));
    const threadId = identifier(thread.id);
    // Verify org/app ownership and top-level surface before adding a message.
    const persisted = await this.helpdesk.thread(threadId);
    if (persisted.copilotAppId !== config.appId || object(persisted.meta).surface !== 'web' || persisted.userId !== userId) {
      throw new Error('Created thread failed scope/surface verification; message not sent. Synthetic records retained.');
    }
    // Do NOT pass generateAssistantMessage=false: the string is truthy in the current backend.
    const message = object(await jsonRequest(config.integrationBase,
      `/v1/conversations/${encodeURIComponent(threadId)}/messages`, headers, 'POST', {
        id: data.messageId, userId, role: 'user', content: data.content,
      }));
    return { userId, threadId, messageId: identifier(message.id), surface: 'web' };
  }
}
