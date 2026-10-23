/**
 * Joining and leaving a real Active Directory domain, over the API, for the
 * specs that test the UI around a join — and the cleanup after the one that
 * joins through the form.
 *
 * The domain is the internal test domain (`TN_AD_*`), shared with other
 * automation and outliving the run. Three things keep a run from leaving a mark
 * on it:
 *
 * - Every computer account is named by {@link adComputerName}: a prefix nobody
 *   else uses, then something random, so concurrent runs and shards never
 *   collide, and anything a dead runner left behind can be told apart.
 * - DNS updates stay off, so a join registers nothing in the domain's DNS. It
 *   would register the appliance's NAT address, `10.0.2.15`, which every CI
 *   appliance has.
 * - Teardown leaves the domain whenever a join got as far as the domain
 *   knowing about it, which deletes the computer account.
 *
 * None of the `TN_AD_*` values may reach a failure message: JUnit is published,
 * and GitHub masks a secret in the log only where it appears verbatim, not
 * upper-cased into a realm or escaped into a regex. A job's error names the
 * domain and often a controller, so everything here runs inside
 * {@link withActiveDirectoryRedacted}, and so must a spec's tests and hooks.
 */
import { expect } from '@playwright/test';
import type { JobParams } from '@truenas/api-client';
import { escapeRegExp } from 'lodash-es';
import { firstValueFrom, timeout } from 'rxjs';
import { ensureDirectoryServicesCleared, readDirectoryServices } from './directory-services';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import type { ActiveDirectoryTarget } from '../support/config';
import { runJob } from '../support/jobs';
import { readTimeoutMs } from '../support/timeouts';

type KerberosUserCredential = JobParams<E2eApiDirectory, 'directoryservices.leave'>[0]['credential'];

/**
 * A ceiling on a join or a leave. Either one runs `net ads`, Kerberos and a
 * restart of the directory services stack, and a join with the account cache on
 * also waits for the cache's first fill from the domain. On CI a join has
 * taken from under two minutes to over three, so three was too tight. Five,
 * three times over (leave before, join, leave after), is still inside the
 * twenty-minute test timeout.
 */
export const adJoinTimeoutMs = 5 * 60_000;

/**
 * The prefix of every computer account this suite creates. Anything in the
 * domain under it is ours, and can be removed by whoever cleans the OU.
 */
export const adComputerNamePrefix = 'e2eui-';

/**
 * A computer name for one join: {@link adComputerNamePrefix} and eight random
 * characters, fourteen in all — inside NetBIOS's fifteen.
 */
export function adComputerName(): string {
  const random = Math.random().toString(36).slice(2, 10).padEnd(8, '0');
  return `${adComputerNamePrefix}${random}`;
}

/**
 * Each `TN_AD_*` value and the placeholder it becomes, longest first so that
 * the domain goes before its own first label — the NetBIOS name, which
 * middleware prints as `NAME\user`.
 */
function adValuePlaceholders(ad: ActiveDirectoryTarget): [string, string][] {
  const values: [string | undefined, string][] = [
    [ad.password, '<TN_AD_PASSWORD>'],
    [ad.domain, '<TN_AD_DOMAIN>'],
    [ad.domain.split('.')[0], '<TN_AD_DOMAIN short name>'],
    [ad.username, '<TN_AD_USERNAME>'],
    [ad.computerOu, '<TN_AD_COMPUTER_OU>'],
    ...ad.nameservers.map((nameserver, i): [string, string] => [nameserver, `<TN_AD_DC${i + 1}>`]),
  ];
  return values
    .filter((entry): entry is [string, string] => Boolean(entry[0]))
    // A failed regex assertion prints the regex's source, which has the value escaped.
    .flatMap(([value, placeholder]): [string, string][] => [[value, placeholder], [escapeRegExp(value), placeholder]])
    .sort(([a], [b]) => b.length - a.length);
}

/** `text` with every `TN_AD_*` value in it, in any case, replaced by its placeholder. */
function redactActiveDirectory(text: string, ad: ActiveDirectoryTarget): string {
  return adValuePlaceholders(ad).reduce(
    (redacted, [value, placeholder]) => redacted.replace(new RegExp(escapeRegExp(value), 'gi'), placeholder),
    text,
  );
}

/**
 * Runs `run`, and if it throws, rethrows the same error with the `TN_AD_*`
 * values taken out of its message and stack. The error itself is kept, so a
 * Playwright assertion still reports as one.
 */
export async function withActiveDirectoryRedacted<T>(ad: ActiveDirectoryTarget, run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (error) {
    if (error instanceof Error) {
      error.message = redactActiveDirectory(error.message, ad);
      if (error.stack) {
        error.stack = redactActiveDirectory(error.stack, ad);
      }
      throw error;
    }
    throw new Error(redactActiveDirectory(String(error), ad));
  }
}

function kerberosUser(ad: ActiveDirectoryTarget): KerberosUserCredential {
  return { credential_type: 'KERBEROS_USER', username: ad.username, password: ad.password };
}

/**
 * Joins the domain as `hostname`, with the account cache on and DNS updates
 * off — what the form saves when it is filled as `directory-services-ad`
 * fills it. The nameservers must point at the domain already.
 */
export async function joinActiveDirectory(
  client: E2eApiClient,
  ad: ActiveDirectoryTarget,
  hostname: string,
): Promise<void> {
  await withActiveDirectoryRedacted(ad, () => runJob(
    client,
    () => client.api.callAndGetJobId('directoryservices.update', [{
      service_type: 'ACTIVEDIRECTORY',
      enable: true,
      enable_account_cache: true,
      enable_dns_updates: false,
      credential: kerberosUser(ad),
      configuration: {
        service_type: 'ACTIVEDIRECTORY',
        hostname,
        domain: ad.domain,
        computer_account_ou: ad.computerOu ?? null,
      },
    }]),
    {
      timeoutMs: adJoinTimeoutMs,
      whatItCosts: 'the appliance did not join the domain, so there is nothing for the test to leave',
    },
  ));
}

/** The directory services jobs still running or queued, by method. */
async function directoryServicesJobsInFlight(client: E2eApiClient): Promise<string[]> {
  const jobs = await firstValueFrom(
    client.api.query('core.get_jobs', [['state', 'in', ['RUNNING', 'WAITING']]]).pipe(timeout(readTimeoutMs)),
  );
  return jobs.map((job) => job.method).filter((method) => method.startsWith('directoryservices.'));
}

/**
 * Waits until no directory services job is running or queued.
 *
 * A join can report the domain healthy before the work it starts is done, such as filling the
 * account cache from the domain. A status read meanwhile can be neither joined nor left, which
 * `ensureActiveDirectoryLeft` would take for left. What it waited for is logged, by method only.
 */
export async function waitForDirectoryServicesJobs(client: E2eApiClient): Promise<void> {
  const inFlight = await directoryServicesJobsInFlight(client);
  if (inFlight.length === 0) {
    return;
  }

  const start = Date.now();
  await expect.poll(() => directoryServicesJobsInFlight(client), {
    message: `directory services jobs still running: ${inFlight.join(', ')}`,
    timeout: adJoinTimeoutMs,
    intervals: [500, 1_000, 2_000],
  }).toEqual([]);
  console.warn(`Waited ${Math.round((Date.now() - start) / 1000)}s for ${inFlight.join(', ')} to finish.`);
}

/**
 * Leaves the domain if the appliance is in it, then clears the configuration.
 * A no-op on the baseline, so it is safe in `beforeEach` as well.
 *
 * `FAULTED` is left too: a join that got that far created the computer
 * account, and leaving is what deletes it.
 */
export async function ensureActiveDirectoryLeft(client: E2eApiClient, ad: ActiveDirectoryTarget): Promise<void> {
  await withActiveDirectoryRedacted(ad, async () => {
    await waitForDirectoryServicesJobs(client);
    const { status } = await readDirectoryServices(client);
    const joined = status.type === 'ACTIVEDIRECTORY' && (status.status === 'HEALTHY' || status.status === 'FAULTED');

    if (joined) {
      await runJob(
        client,
        () => client.api.callAndGetJobId('directoryservices.leave', [{ credential: kerberosUser(ad) }]),
        {
          timeoutMs: adJoinTimeoutMs,
          whatItCosts: 'the appliance is still joined, and its computer account is left in the shared domain',
        },
      );
    }

    await ensureDirectoryServicesCleared(client);
  });
}

/**
 * Joins the domain as `hostname` unless the appliance is already in it and
 * healthy, for a test that only needs to start joined. `directory-services-ad`
 * leaves its join test's domain joined for the leave test, and a join costs
 * minutes; this joins only when that test did not run first or did not get
 * there. The nameservers must point at the domain already.
 */
export async function ensureActiveDirectoryJoined(
  client: E2eApiClient,
  ad: ActiveDirectoryTarget,
  hostname: string,
): Promise<void> {
  // Settled first, whoever joined: the leave this sets up queues behind whatever the join started.
  await waitForDirectoryServicesJobs(client);
  const { status } = await readDirectoryServices(client);
  if (status.type === 'ACTIVEDIRECTORY' && status.status === 'HEALTHY') {
    return;
  }
  // A `FAULTED` join still holds a computer account, and a stored configuration blocks a fresh one.
  await ensureActiveDirectoryLeft(client, ad);
  await joinActiveDirectory(client, ad, hostname);
}
