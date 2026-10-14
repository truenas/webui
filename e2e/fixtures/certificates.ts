/**
 * Certificate signing request preconditions, cleanup and readback, over the API.
 *
 * Keyed on the name, which middleware holds unique among certificates and CSRs
 * alike, and which the CSR card builds every id on a row from. Creating and
 * deleting one are jobs.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A certificate or CSR as middleware reports it, with its id narrowed — see `GroupRecord`. */
type CertificateEntry = Extract<CallResponse<E2eApiDirectory, 'certificate.query'>, unknown[]>[number];

export type CertificateRecord = CertificateEntry & { id: number };

/**
 * The appliance's own record of the certificate or CSR with this name, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findCertificate(client: E2eApiClient, name: string): Promise<CertificateRecord | undefined> {
  const [certificate] = await firstValueFrom(
    client.api.query('certificate.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return certificate as CertificateRecord | undefined;
}

/**
 * How many CSRs the appliance holds, by the rule the Certificates page itself uses
 * to put a row on the CSR card: a `CSR` that is not null.
 */
export async function countCsrs(client: E2eApiClient): Promise<number> {
  const certificates = await firstValueFrom(
    client.api.query('certificate.query', []).pipe(timeout(readTimeoutMs)),
  );

  return certificates.filter((certificate) => certificate.CSR !== null).length;
}

/** Removes the certificate or CSR with this name, if there is one. */
export async function ensureCertificateAbsent(client: E2eApiClient, name: string): Promise<void> {
  const certificate = await findCertificate(client, name);
  if (!certificate) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('certificate.delete', [certificate.id, false]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `the certificate ${name} is still on the appliance, so the next run's create is refused`,
      confirm: async () => (await findCertificate(client, name)) === undefined,
    },
  );
}

export interface CsrSeed {
  name: string;
  common: string;
  /** Host names, as typed into the form — not middleware's `DNS:` form. */
  san: string[];
}

/**
 * Creates an RSA 2048 / SHA256 CSR with a fixed subject, if none has this name
 * already — the same key settings the wizard defaults to.
 *
 * For the CSR a delete acts on, and for a bystander. Never for the CSR under test
 * in a create — that one goes through the wizard.
 */
export async function ensureCsrPresent(client: E2eApiClient, seed: CsrSeed): Promise<void> {
  if (await findCertificate(client, seed.name)) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('certificate.create', [{
      name: seed.name,
      create_type: 'CERTIFICATE_CREATE_CSR',
      key_type: 'RSA',
      key_length: 2048,
      digest_algorithm: 'SHA256',
      country: 'US',
      state: 'Tennessee',
      city: 'Maryville',
      organization: 'iXsystems',
      email: 'e2e@example.com',
      common: seed.common,
      san: seed.san,
    }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `the CSR ${seed.name} could not be created, so there is nothing to act on`,
      confirm: async () => (await findCertificate(client, seed.name)) !== undefined,
    },
  );
}
