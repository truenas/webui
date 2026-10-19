/**
 * Reporting exporters, over the API: `reporting.exporters.query` to find one, `create` to seed one
 * and `delete` to remove it.
 *
 * Every exporter the suite makes is a Graphite one pointed at `127.0.0.1`, where nothing listens, so
 * nothing leaves the appliance. Middleware stores the exporter and regenerates netdata's config
 * without contacting the destination, so an exporter can be saved whether or not anything answers.
 *
 * Deleting the exporters is the whole restoration: netdata goes back to having none, and nothing
 * else global changes.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** Graphite's required attributes, the only ones the suite ever sets. */
export interface GraphiteDestination {
  destinationIp: string;
  destinationPort: number;
  namespace: string;
}

/** An exporter as middleware stores it, with only the fields the suite reads. */
export interface StoredExporter {
  id: number;
  name: string;
  enabled: boolean;
  attributes: Record<string, unknown>;
}

/** Every exporter middleware holds under a name. */
async function findExporters(client: E2eApiClient, name: string): Promise<StoredExporter[]> {
  const exporters = await firstValueFrom(
    client.api.query('reporting.exporters.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return exporters as unknown as StoredExporter[];
}

/**
 * The appliance's own record of the exporter with this name, or undefined.
 *
 * `query`, not `queryOne`: absence is an ordinary answer here.
 */
export async function findExporter(client: E2eApiClient, name: string): Promise<StoredExporter | undefined> {
  const [exporter] = await findExporters(client, name);
  return exporter;
}

/** How many exporters middleware holds under a name. */
export async function countExporters(client: E2eApiClient, name: string): Promise<number> {
  return (await findExporters(client, name)).length;
}

/** Removes every exporter with this name, if any. */
export async function ensureExporterAbsent(client: E2eApiClient, name: string): Promise<void> {
  for (const exporter of await findExporters(client, name)) {
    await firstValueFrom(
      client.api.call('reporting.exporters.delete', [exporter.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates an enabled Graphite exporter, if none has this name already.
 *
 * For the exporter an edit or a delete acts on, and for a bystander. Never for the exporter under
 * test in a create: that one goes through the form.
 */
export async function ensureGraphiteExporterPresent(
  client: E2eApiClient,
  name: string,
  destination: GraphiteDestination,
): Promise<StoredExporter> {
  const existing = await findExporter(client, name);
  if (existing) {
    return existing;
  }

  await firstValueFrom(
    client.api.call('reporting.exporters.create', [{
      name,
      enabled: true,
      attributes: {
        exporter_type: 'GRAPHITE',
        destination_ip: destination.destinationIp,
        destination_port: destination.destinationPort,
        namespace: destination.namespace,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );

  const stored = await findExporter(client, name);
  if (!stored) {
    throw new Error(`reporting.exporters.create returned, and there is no exporter named "${name}"`);
  }
  return stored;
}
