/**
 * Audit settings: preconditions, cleanup and readback, over the API.
 *
 * These five settings are `audit.config`, a single config record, so — as in
 * `fixtures/syslog.ts` — there is nothing to create or delete. Each test starts
 * from a known baseline and teardown writes that baseline back, rather than
 * snapshotting what it found and restoring that.
 *
 * The baseline is middleware's own default: keep audit records for 7 days, no
 * reservation and no quota on the audit dataset, warn at 75% and alert at 95%.
 * That is what a fresh appliance holds.
 *
 * Reservation and quota are set on the audit dataset in the boot pool, in GiB.
 * The specs keep both to a few GiB, which a fresh appliance's audit dataset is
 * far below and its boot pool can spare.
 *
 * It also reads the audit log itself, for the Audit page under System. That is
 * a read only: middleware writes the log as the appliance is used.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { AuditRowKey } from '../locators/audit';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type AuditConfig = CallResponse<E2eApiDirectory, 'audit.config'>;

type AuditField = 'retention' | 'reservation' | 'quota' | 'quota_fill_warning' | 'quota_fill_critical';

/** The part of `audit.config` the Audit card shows and its form edits. */
export type AuditSettings = Pick<AuditConfig, AuditField>;

/** Middleware's defaults for the five settings. */
export const auditBaseline: AuditSettings = {
  retention: 7,
  reservation: 0,
  quota: 0,
  quota_fill_warning: 75,
  quota_fill_critical: 95,
};

/** The five settings as the appliance holds them. */
export async function readAuditSettings(client: E2eApiClient): Promise<AuditSettings> {
  const config = await firstValueFrom(client.api.call('audit.config').pipe(timeout(readTimeoutMs)));

  return {
    retention: config.retention,
    reservation: config.reservation,
    quota: config.quota,
    quota_fill_warning: config.quota_fill_warning,
    quota_fill_critical: config.quota_fill_critical,
  };
}

/**
 * The newest middleware audit record that carries a user and an event.
 *
 * Newest first, as the Audit page sorts it, so whatever the page lists on load is this record and
 * the few that arrive after it. Without a user or an event the page shows `-` in that cell, so a
 * record missing either cannot be checked by its cells.
 *
 * Cast because the client types `audit.query`'s response as every shape the call can return, a
 * count included. The webui narrows it to `AuditEntry` the same way.
 */
export async function findNewestAuditRecord(client: E2eApiClient): Promise<AuditRowKey | undefined> {
  const records = await firstValueFrom(
    client.api.call('audit.query', [{
      services: ['MIDDLEWARE'],
      'query-options': { order_by: ['-message_timestamp'], limit: 20 },
    }]).pipe(timeout(readTimeoutMs)),
  ) as unknown as AuditRowKey[];

  return records.find((record) => record.username && record.event);
}

/**
 * Writes all five settings. Used for the baseline, and for the state a test
 * starts from. Never for the change under test, which goes through the form.
 *
 * A slow call, because a reservation or quota is written to the audit dataset.
 */
export async function setAuditSettings(client: E2eApiClient, settings: AuditSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('audit.update', [{
      retention: settings.retention,
      reservation: settings.reservation,
      quota: settings.quota,
      quota_fill_warning: settings.quota_fill_warning,
      quota_fill_critical: settings.quota_fill_critical,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
