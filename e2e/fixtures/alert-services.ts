/**
 * Alert service preconditions, cleanup and readback, over the API.
 *
 * Every service the suite makes is a Slack one: its only setting is a webhook
 * URL, and saving one sends nothing — only the form's Send Test Alert does, and
 * the suite never presses it. Every URL is under `example.com`, which RFC 2606
 * reserves, so even a service that did fire could reach nothing.
 *
 * Middleware does not hold names unique, and a form saved twice by a retried
 * test leaves two services with one name. So these helpers key on the name, and
 * removal takes every match.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** An alert service as middleware reports it, with its id narrowed — see `GroupRecord`. */
type AlertServiceEntry = Extract<CallResponse<E2eApiDirectory, 'alertservice.query'>, unknown[]>[number];

export type AlertServiceRecord = AlertServiceEntry & { id: number };

/** Every alert service middleware holds under a name. */
async function findAlertServices(client: E2eApiClient, name: string): Promise<AlertServiceRecord[]> {
  const services = await firstValueFrom(
    client.api.query('alertservice.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return services as AlertServiceRecord[];
}

/**
 * The appliance's own record of the alert service with this name, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findAlertService(client: E2eApiClient, name: string): Promise<AlertServiceRecord | undefined> {
  const [service] = await findAlertServices(client, name);
  return service;
}

/** Removes every alert service with this name, if any. */
export async function ensureAlertServiceAbsent(client: E2eApiClient, name: string): Promise<void> {
  for (const service of await findAlertServices(client, name)) {
    await firstValueFrom(
      client.api.call('alertservice.delete', [service.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates an enabled Slack alert service at Warning, if none has this name already.
 *
 * For the service an edit or a delete acts on, and for a bystander. Never for
 * the service under test in a create — that one goes through the form.
 */
export async function ensureSlackAlertServicePresent(
  client: E2eApiClient,
  { name, url }: { name: string; url: string },
): Promise<void> {
  if (await findAlertService(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('alertservice.create', [{
      name,
      enabled: true,
      level: 'WARNING',
      attributes: { type: 'Slack', url },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
