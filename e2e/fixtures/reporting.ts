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

/** webui's `stringToTitleCase`, replicated: every word capitalised and the rest lowercased. */
function toTitleCase(text: string): string {
  return text.replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.substring(1).toLowerCase());
}

/**
 * The title the Reporting page gives the report the graph called `name` draws for `identifier`, or
 * undefined when middleware offers no such graph or collects nothing for that identifier.
 *
 * Built the way `ReportsDashboardComponent.flattenReports` builds it: middleware's title with
 * `{identifier}` filled in (`Interface Traffic ({identifier})`), or, for a title without the
 * placeholder, ` - ` and the identifier in title case.
 */
export async function findGraphTitleFor(
  client: E2eApiClient,
  name: string,
  identifier: string,
): Promise<string | undefined> {
  const graphs = await firstValueFrom(
    client.api.query('reporting.netdata_graphs', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  const graph = graphs.find((entry) => entry.name === name);
  if (!graph || !Array.isArray(graph.identifiers) || !graph.identifiers.includes(identifier)) {
    return undefined;
  }

  if (graph.title.includes('{identifier}')) {
    return graph.title.replace('{identifier}', identifier);
  }

  return `${graph.title} - ${toTitleCase(identifier)}`;
}
