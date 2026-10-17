/**
 * The graphs the Reporting page draws, over the API.
 *
 * Read-only. Reporting has nothing to create or clean up: middleware collects the data on its own,
 * and the page only reads it back.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** The fields of a `reporting.netdata_graphs` row the page builds its report titles from. */
interface NetdataGraph {
  name: string;
  title: string;
  /** What the graph is drawn per (a NIC, a disk), or null for a graph drawn once. */
  identifiers?: string[] | null;
}

async function findGraph(client: E2eApiClient, name: string): Promise<NetdataGraph | undefined> {
  const response = await firstValueFrom(
    client.api.query('reporting.netdata_graphs', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return (response as unknown as NetdataGraph[]).find((graph) => graph.name === name);
}

/**
 * The title middleware gives the graph called `name`, or undefined when it does not offer one.
 *
 * Read rather than written into the spec, because the title is middleware's and is what every id
 * on the report is keyed by.
 */
export async function findGraphTitle(client: E2eApiClient, name: string): Promise<string | undefined> {
  return (await findGraph(client, name))?.title;
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
  const graph = await findGraph(client, name);
  if (!graph?.identifiers?.includes(identifier)) {
    return undefined;
  }

  if (graph.title.includes('{identifier}')) {
    return graph.title.replace('{identifier}', identifier);
  }

  return `${graph.title} - ${toTitleCase(identifier)}`;
}

/**
 * Of `candidates`, the one whose report the graph called `name` puts highest on its tab, or
 * undefined when it draws a report for none of them.
 *
 * The tab lists one report per identifier, sorted by identifier (`flattenReports`), inside a virtual
 * scroll that renders only the first few. So a report lower down may never reach the DOM, and a
 * spec that needs one visible picks it with this.
 */
export async function findFirstGraphIdentifier(
  client: E2eApiClient,
  name: string,
  candidates: string[],
): Promise<string | undefined> {
  const identifiers = (await findGraph(client, name))?.identifiers ?? [];

  return identifiers
    .filter((identifier) => candidates.includes(identifier))
    .sort((a, b) => a.localeCompare(b))[0];
}
