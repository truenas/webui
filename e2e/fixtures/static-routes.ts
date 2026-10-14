/**
 * Static route preconditions, cleanup and readback, over the API.
 *
 * A route has no name, and middleware does not hold destinations unique: a form
 * saved twice by a retried test leaves two routes to the same network. So these
 * helpers key on the destination, and removal takes every match.
 *
 * Every destination is a /26 of 198.51.100.0/24 and every gateway is in
 * 192.0.2.0/24. RFC 5737 reserves both for documentation, so nothing the suite
 * or the appliance talks to lives behind either, and a route to one cannot take
 * a real path away. Saving or deleting a route restarts the routing service,
 * which re-applies every route middleware holds; the appliance's default route
 * is not one of them and is left alone.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A static route as middleware reports it, with its id narrowed — see `GroupRecord`. */
type StaticRouteEntry = Extract<CallResponse<E2eApiDirectory, 'staticroute.query'>, unknown[]>[number];

export type StaticRouteRecord = StaticRouteEntry & { id: number };

/** Every static route middleware holds to a destination. */
async function findStaticRoutes(client: E2eApiClient, destination: string): Promise<StaticRouteRecord[]> {
  const routes = await firstValueFrom(
    client.api.query('staticroute.query', [['destination', '=', destination]]).pipe(timeout(readTimeoutMs)),
  );

  return routes as StaticRouteRecord[];
}

/**
 * The appliance's own record of the route to a destination, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findStaticRoute(
  client: E2eApiClient,
  destination: string,
): Promise<StaticRouteRecord | undefined> {
  const [route] = await findStaticRoutes(client, destination);
  return route;
}

/** Removes every route to a destination, if any. */
export async function ensureStaticRouteAbsent(client: E2eApiClient, destination: string): Promise<void> {
  for (const route of await findStaticRoutes(client, destination)) {
    await firstValueFrom(
      client.api.call('staticroute.delete', [route.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a route to a destination through a gateway, if there is none to that
 * destination already.
 *
 * For the route an edit or a delete acts on, and for a bystander. Never for the
 * route under test in a create — that one goes through the form.
 */
export async function ensureStaticRoutePresent(
  client: E2eApiClient,
  { destination, gateway, description }: { destination: string; gateway: string; description: string },
): Promise<void> {
  if (await findStaticRoute(client, destination)) {
    return;
  }

  await firstValueFrom(
    client.api.call('staticroute.create', [{ destination, gateway, description }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
