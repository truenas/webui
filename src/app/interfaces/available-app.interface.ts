import { ApiTimestamp } from 'app/interfaces/api-date.interface';
import { Capability, AppRunAsContext } from 'app/interfaces/app.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface AvailableApp {
  healthy: boolean;
  installed: boolean;
  categories: string[];
  name: string;
  title: string;
  description: string;
  app_readme: string;
  capabilities: Capability[];
  run_as_context: AppRunAsContext[];
  location: string;
  healthy_error: string;
  latest_version: string;
  latest_app_version: string;
  icon_url: string;
  popularity_rank: number;
  train: string;
  catalog: string;
  last_update: ApiTimestamp;
  recommended: boolean;
  maintainers: AppMaintainer[];
  tags: string[];
  home: string;
  latest_human_version: string;
  screenshots: string[];
  sources: string[];
  versions: unknown;
}

export interface AppMaintainer {
  email: string;
  name: string;
  url: string;
}

/**
 * Reads an `app.available` / `app.latest` / `app.similar` row as `AvailableApp`, via `unknown` because
 * the types don't overlap: `last_update` is really a `{ $date }` envelope (gap 15 in
 * docs/devs/typed-api-client.md), and some fields arrive through the model's open index signature.
 */
export function toAvailableApp(app: WebUiQueryEntity<'app.available'>): AvailableApp {
  return app as unknown as AvailableApp;
}
