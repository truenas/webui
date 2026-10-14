import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';

export interface StaticRoute {
  description: string;
  destination: string;
  gateway: string;
  id: number;
}

export type UpdateStaticRoute = Omit<StaticRoute, 'id'>;

/** Reads a `staticroute.query` row. Middleware leaves the defaulted `description` optional. */
export function toStaticRoute(route: WebUiQueryEntity<'staticroute.query'>): StaticRoute {
  return route as StaticRoute;
}
