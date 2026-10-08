import { HelpdeskClient } from './helpdesk-client.ts';
import { HelpdeskSettingsClient } from './helpdesk-settings-client.ts';
import { AgentsClient } from './agents-client.ts';
import { SettingsClient } from './settings-client.ts';
import { AnalyticsClient } from './analytics-client.ts';
import { AuditClient } from './audit-client.ts';
import { DevelopersClient } from './developers-client.ts';
import { AgentUsersClient } from './agent-users-client.ts';
import { HealthClient } from './health-client.ts';

export type ApiClientConfig = { mainBase: string; orgId: string };
export type ApiClients = {
  helpdesk: HelpdeskClient;
  helpdeskSettings: HelpdeskSettingsClient;
  agents: AgentsClient;
  settings: SettingsClient;
  analytics: AnalyticsClient;
  audit: AuditClient;
  developers: DevelopersClient;
  agentUsers: AgentUsersClient;
  health: HealthClient;
};

export function makeApiClients(config: ApiClientConfig, headers: Record<string, string>): ApiClients {
  return {
    helpdesk: new HelpdeskClient(config, headers),
    helpdeskSettings: new HelpdeskSettingsClient(config, headers),
    agents: new AgentsClient(config, headers),
    settings: new SettingsClient(config, headers),
    analytics: new AnalyticsClient(config, headers),
    audit: new AuditClient(config, headers),
    developers: new DevelopersClient(config, headers),
    agentUsers: new AgentUsersClient(config, headers),
    health: new HealthClient(config.mainBase),
  };
}
