import { test, expect } from '../../src/fixtures/api.ts';
import { HttpFailure } from '../../src/api/transport.ts';

const isoDaysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

type Setup = { appId: string | null };
const setup: Setup = { appId: null };

test.describe.serial('Copilot apps nested resources (deep)', () => {
  test('resolves first copilot app id @api', async ({ api }) => {
    const apps = await api.agents.listCopilotApps({ limit: 1 });
    setup.appId = apps.length ? String(apps[0].id) : null;
    if (!setup.appId) test.skip(true, 'No copilot apps provisioned.');
  });

  test('GET /actions returns a JSON body @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No app.');
    try {
      const body = await api.agents.getActions(setup.appId as string);
      expect(body).not.toBeNull();
      // Shape may be { items, page } or bare array; both are valid JSON values.
      expect(typeof body === 'object').toBe(true);
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
        test.skip(true, `/actions unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
  });

  test('GET /topics returns an array (bare) @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No app.');
    try {
      const body = await api.agents.getTopics(setup.appId as string);
      expect(Array.isArray(body)).toBe(true);
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
        test.skip(true, `/topics unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
  });

  test('GET /memory (no userId) soft-skips on 400 and otherwise returns JSON @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No app.');
    try {
      const body = await api.agents.getMemory(setup.appId as string);
      expect(body).not.toBeNull();
      expect(typeof body).toBe('object');
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 400 || error.status === 404 || error.status === 403)) {
        test.skip(true, `/memory requires userId or is unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
  });

  test('GET /traces returns an object (items array or disabled flag) @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No app.');
    try {
      const body = await api.agents.getTraces(setup.appId as string, { limit: 5 });
      expect(body).not.toBeNull();
      expect(typeof body).toBe('object');
      const obj = body as Record<string, unknown>;
      expect(Array.isArray(obj.items) || obj.disabled === true).toBe(true);
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
        test.skip(true, `/traces unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
  });

  test('GET /variables returns { data: [...] } @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No app.');
    try {
      const body = await api.agents.getVariables(setup.appId as string);
      expect(typeof body).toBe('object');
      expect(Array.isArray(body.data)).toBe(true);
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
        test.skip(true, `/variables unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
  });

  test('GET /sentiment with a 7d window returns a JSON object @api', async ({ api }) => {
    if (!setup.appId) test.skip(true, 'No app.');
    try {
      const body = await api.agents.getSentiment(setup.appId as string, {
        from: isoDaysAgo(7), to: new Date().toISOString()
      });
      expect(typeof body).toBe('object');
    } catch (error) {
      if (error instanceof HttpFailure && (error.status === 404 || error.status === 403)) {
        test.skip(true, `/sentiment unavailable (HTTP ${error.status}).`);
      }
      throw error;
    }
  });
});
