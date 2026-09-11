/**
 * Service state, over the API — shared by every feature that has one.
 *
 * One stop protocol rather than a copy per service: SMB and S3 both need
 * "stopped and not auto-starting" before a journey, for the same reason (the
 * app's post-save dialog branches on service state, so a service left running
 * makes the next run exercise a different path while reporting green), and a
 * second transcription of it was the first thing to drift.
 */
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

const serviceControlTimeoutMs = 60_000;

export interface ServiceState {
  id: number;
  state: string;
  enable: boolean;
}

/** The service row by middleware name (`cifs`, `s3`), or undefined when the query returns nothing. */
export async function queryService(client: E2eApiClient, service: string): Promise<ServiceState | undefined> {
  // `query`, not `queryOne` — an empty result has to be representable, because
  // callers distinguish it from "stopped".
  const [row] = await firstValueFrom(
    client.api
      .query('service.query', [['service', '=', service]])
      .pipe(timeout(readTimeoutMs)),
  );

  return row;
}

/**
 * Returns a service to stopped and not-auto-starting.
 *
 * An empty query is an error rather than "nothing to stop": every appliance has
 * a row for the services this suite touches, so no row means the query did not
 * answer — or the appliance lacks the feature, which the journeys cannot run
 * against either way. Returning quietly would skip the teardown that keeps the
 * next run honest.
 *
 * The auto-start flag matters too: the start dialog's toggle defaults to on, so
 * a run that starts the service also enables it at boot.
 */
export async function ensureServiceStopped(
  client: E2eApiClient,
  service: string,
  whatItCosts: string,
): Promise<void> {
  const row = await queryService(client, service);

  if (!row) {
    throw new Error(
      `service.query returned no \`${service}\` row. This is a failed query rather than an absent `
      + 'service — or an appliance without the feature, which this journey cannot run against. '
      + `Treating it as "nothing to stop" would leave the service running: ${whatItCosts}`,
    );
  }

  if (row.enable) {
    await firstValueFrom(
      client.api
        .call('service.update', [row.id, { enable: false }])
        .pipe(timeout(slowCallTimeoutMs)),
    );
  }

  if (row.state !== 'RUNNING') {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('service.control', ['STOP', service, { silent: false }]),
    {
      timeoutMs: serviceControlTimeoutMs,
      whatItCosts,
      confirm: async () => {
        const current = await queryService(client, service);
        return current !== undefined && current.state !== 'RUNNING';
      },
    },
  );
}

/**
 * Brings a service to running, for journeys that start from one.
 *
 * The counterpart of {@link ensureServiceStopped} and just as deliberate: the
 * app's post-save dialog is raised only while the service is stopped, so a
 * journey about the running state has to put it there first rather than
 * inherit whatever the previous test left. Auto-start is left alone; the
 * teardown's stop clears it.
 */
export async function ensureServiceRunning(
  client: E2eApiClient,
  service: string,
  whatItCosts: string,
): Promise<void> {
  const row = await queryService(client, service);

  if (!row) {
    throw new Error(
      `service.query returned no \`${service}\` row, so it cannot be started: ${whatItCosts}`,
    );
  }

  if (row.state === 'RUNNING') {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('service.control', ['START', service, { silent: false }]),
    {
      timeoutMs: serviceControlTimeoutMs,
      whatItCosts,
      confirm: async () => (await queryService(client, service))?.state === 'RUNNING',
    },
  );
}
