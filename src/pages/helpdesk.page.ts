import { expect, type Page } from '@playwright/test';
import { coreConfig } from '../config/env.ts';
import type { TestMessage } from '../data/test-message.ts';
import type { InboundReceipt } from '../channels/inbound-channel.ts';

export class HelpdeskPage {
  private readonly page: Page;
  constructor(page: Page) { this.page = page; }
  async assertLoaded() {
    await expect(this.page.getByRole('columnheader', { name: 'Thread ID', exact: true })).toBeVisible();
    await expect(this.page.getByRole('columnheader', { name: 'Customer', exact: true })).toBeVisible();
  }
  async openSyntheticThread(data: TestMessage, receipt: InboundReceipt) {
    const config = coreConfig();
    const query = new URLSearchParams({ view: 'table', q: data.runId });
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?${query}`);
    await this.assertLoaded();
    const row = this.page.getByRole('row').filter({ has: this.page.getByText(data.customerName, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row.getByRole('img', { name: 'Web surface', exact: true })).toBeVisible();
    await row.getByText(data.content, { exact: true }).click();
    await expect(this.page).toHaveURL(url =>
      url.pathname === `/kaily/asia-south1/accounts/${config.orgId}/helpdesk/${receipt.threadId}` ||
      (url.pathname === `/kaily/asia-south1/accounts/${config.orgId}/helpdesk` && url.searchParams.get('threadId') === receipt.threadId));
  }
  async assertMessage(data: TestMessage, createdAt: string) {
    const row = this.page.getByTestId('message-bubble-row').filter({ has: this.page.getByText(data.content, { exact: true }) });
    await expect(row).toHaveCount(1);
    await expect(row.getByText(data.content, { exact: true })).toBeVisible();
    const time = new Date(createdAt).toLocaleTimeString('en-US', {
      timeZone: coreConfig().timezone, hour: '2-digit', minute: '2-digit', hour12: true,
    });
    await expect(row.getByText(time, { exact: true })).toBeVisible();
  }
}
