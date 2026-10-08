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
 * Reads an `app.available` / `app.latest` / `app.similar` row into the shape the apps pages are
 * written against. It describes the same object, but the two types do not overlap, so the
 * conversion goes through `unknown`:
 * - `last_update` is typed as a plain string where middleware sends a `{ $date }` envelope
 *   (gap 15 in docs/devs/typed-api-client.md);
 * - `capabilities`, `run_as_context` and `versions` arrive through the model's open
 *   `{ [k: string]: unknown }` rather than as declared fields.
 */
export function toAvailableApp(app: WebUiQueryEntity<'app.available'>): AvailableApp {
  return app as unknown as AvailableApp;
}
