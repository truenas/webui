/**
 * The graphs the Reporting page draws, over the API.
 *
 * Read-only. Reporting has nothing to create or clean up: middleware collects the data on its own,
 * and the page only reads it back.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/**
 * The title middleware gives the graph called `name`, or undefined when it does not offer one.
 *
 * Read rather than written into the spec, because the title is middleware's and is what every id
 * on the report is keyed by.
 */
export async function findGraphTitle(client: E2eApiClient, name: string): Promise<string | undefined> {
  const graphs = await firstValueFrom(
    client.api.query('reporting.netdata_graphs', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return graphs.find((graph) => graph.name === name)?.title;
}
