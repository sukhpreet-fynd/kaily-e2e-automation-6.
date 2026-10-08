import { expect, type Page, type Locator } from '@playwright/test';
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
  // trinity/src/pages/Helpdesk/Threads/index.js:1666-1672 — "Table View" switch sets view=table.
  async switchToTableView() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=table`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Threads/index.js:1659-1665 — "Card View" switch sets view=card.
  async switchToCardView() {
    const config = coreConfig();
    await this.page.goto(`${config.baseURL}accounts/${config.orgId}/helpdesk?view=card`, { waitUntil: 'domcontentloaded' });
  }
  // trinity/src/pages/Helpdesk/Threads/Views/CardView.js:168 — data-testid="thread-card-list".
  async assertCardViewLoaded() {
    await expect(this.page.getByTestId('thread-card-list')).toBeVisible();
  }
  // trinity/src/pages/Helpdesk/index.js:21 — thread detail route is /helpdesk/:threadId.
  async openFirstThread(): Promise<string> {
    const firstRow = this.page.getByRole('row').nth(1);
    await firstRow.waitFor({ state: 'visible' });
    await firstRow.click();
    await this.page.waitForURL(url =>
      /\/accounts\/[^/]+\/helpdesk\/[^/?]+/.test(url.pathname) ||
      url.searchParams.has('threadId'));
    const pathMatch = new URL(this.page.url()).pathname.match(/\/helpdesk\/([^/?]+)$/);
    return pathMatch?.[1] ?? new URL(this.page.url()).searchParams.get('threadId') ?? '';
  }
  // trinity/src/pages/Helpdesk/Threads/index.js:1698-1706 — SearchPlaceHolder renders an <input> with
  // placeholder="Search". We only assert the input accepts text; server-side filtering is out of scope.
  async searchFor(query: string) {
    const input = this.page.getByPlaceholder('Search', { exact: true }).first();
    await input.fill(query);
    await expect(input).toHaveValue(query);
  }
  // trinity/src/pages/Helpdesk/components/FilterPopover.js:160 — "Filter" button; :194 panel data-testid.
  async openFiltersPanel() {
    await this.page.getByRole('button', { name: 'Filter', exact: false }).first().click();
    await expect(this.page.getByTestId('filter-popover-panel')).toBeVisible();
  }
  // trinity/src/pages/Helpdesk/Threads/Views/TableView.js:170 — testId={`select-thread-${id}`}.
  // trinity/src/pages/Helpdesk/Threads/BulkUpdate/BulkActionBar.js:95-106 — role="status" with "N tickets selected".
  async selectThreadsForBulk(n: number) {
    const checkboxes = this.page.locator('[data-testid^="select-thread-"]');
    const total = Math.min(n, await checkboxes.count());
    for (let i = 0; i < total; i++) await checkboxes.nth(i).click();
    await expect(this.page.getByText(/\d+ tickets? selected/).first()).toBeVisible();
  }
  // trinity/src/pages/Helpdesk/Threads/Views/FullView.js:125 renders PageWrapper > Body; message bubbles use
  // trinity/src/pages/Helpdesk/Threads/Chat/MessageBubble.js:749 data-testid="message-bubble-row". The chat
  // panel is always mounted for a loaded thread even when no messages exist (ChatSection at :591).
  async assertThreadDetailPanel() {
    const config = coreConfig();
    await expect(this.page).toHaveURL(new RegExp(`/accounts/${config.orgId}/helpdesk/[^/?]+`));
    const chatIndicator = this.page.locator('[data-testid^="mobile-thread-"]')
      .or(this.page.getByTestId('message-bubble-row').first())
      .or(this.page.getByRole('button', { name: /Back|Close/i }));
    await expect(chatIndicator.first()).toBeVisible();
  }
  threadRows(): Locator {
    return this.page.getByRole('row');
  }
  // trinity/src/pages/Helpdesk/Threads/Views/TableView.js:182-290 — Header strings on the
  // react-table columns: Thread ID, Sources, Title, Customer, Status, Assignee.
  columnHeaders(): Locator {
    return this.page.getByRole('columnheader');
  }
  async assertTableColumns() {
    for (const name of ['Thread ID', 'Title', 'Customer', 'Status', 'Assignee']) {
      await expect(this.page.getByRole('columnheader', { name, exact: true })).toBeVisible();
    }
  }
  // trinity/src/common/components/AdvancedPagination.js:98,145-152 — wrapper has data-testid
  // "advanced-pagination"; next-page button is an IconAction with data-tip="Next page".
  // Returns the next-page clickable locator (may have count 0 if list is single-page).
  nextPageButton(): Locator {
    return this.page.getByTestId('advanced-pagination').locator('[data-tip="Next page"]');
  }
  async firstRowId(): Promise<string | null> {
    // Thread rows have no stable id attribute; use the per-row select checkbox testid
    // "select-thread-<id>" (trinity/src/pages/Helpdesk/Threads/Views/TableView.js:170).
    const first = this.page.locator('[data-testid^="select-thread-"]').first();
    if (await first.count() === 0) return null;
    const testid = await first.getAttribute('data-testid');
    return testid ? testid.replace(/^select-thread-/, '') : null;
  }
  async paginate(): Promise<boolean> {
    const btn = this.nextPageButton();
    if (await btn.count() === 0) return false;
    const isDisabled = await btn.getAttribute('disabled');
    if (isDisabled !== null) return false;
    await btn.click();
    return true;
  }
  // trinity/src/pages/Helpdesk/Threads/index.js:1768-1773 — empty state uses NoDataFound with
  // title "No Threads" and subtitle "Looks like nothing's started yet".
  emptyStateLocator(): Locator {
    return this.page.getByText('No Threads', { exact: true })
      .or(this.page.getByText("Looks like nothing's started yet", { exact: true }));
  }
  urlFilterState(): string {
    return new URL(this.page.url()).search;
  }
  // trinity/src/pages/Helpdesk/Threads/Views/FullView.js:138-142 — ThreadInfo is mounted inside
  // DetailsSection (320px right pane) whenever a thread is open on desktop. There's no explicit
  // "open info" affordance on desktop; it's always rendered. On mobile a kebab menu opens it,
  // but tests run desktop viewport.
  async openThreadInfoPanel() {
    // No-op on desktop: info panel is always mounted next to the chat.
    await this.assertInfoSidebar();
  }
  messageBubbles(): Locator {
    return this.page.getByTestId('message-bubble-row');
  }
  // trinity/src/pages/Helpdesk/Threads/Info/Properties.js:320-367 — Label text "Assignee",
  // "Status", "Priority" are rendered in the Properties card.
  // trinity/src/pages/Helpdesk/Threads/Info/SlaDetails.js:362-468 — SLA section only renders
  // when thread.sla is set; we soft-check its presence by looking for an "SLA" text landmark.
  async assertInfoSidebar() {
    const missing: string[] = [];
    for (const label of ['Assignee', 'Status', 'Priority']) {
      const found = await this.page.getByText(label, { exact: true }).first().isVisible().catch(() => false);
      if (!found) missing.push(label);
    }
    if (missing.length) throw new Error(`Info sidebar is missing expected sections: ${missing.join(', ')}`);
  }
  // trinity/src/pages/Helpdesk/Threads/Chat/MessageInput.js:856,882 — composer uses
  // placeholder "Write a reply…" (RichMessageEditor or plain Textarea). Read-only check.
  composerLocator(): Locator {
    return this.page.getByPlaceholder('Write a reply…').first();
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
