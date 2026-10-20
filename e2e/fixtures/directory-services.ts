/**
 * Directory Services' own state, read and reset over the API.
 *
 * The CI appliance has no LDAP or IPA server to join, so nothing here saves an
 * enabled configuration — only a disabled LDAP one, which middleware stores
 * without binding. Joining Active Directory, when a run has a domain, is in
 * `active-directory.ts`. "Not configured" is
 * the baseline each spec starts from and leaves behind, and
 * {@link ensureDirectoryServicesCleared} is how a run that saved something gets
 * back to it — the same call the form's own Clear Config makes.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type DirectoryServicesConfig = CallResponse<E2eApiDirectory, 'directoryservices.config'>;
type DirectoryServicesStatus = CallResponse<E2eApiDirectory, 'directoryservices.status'>;

/** What the page and the form are built from: the stored configuration and the live status. */
export interface DirectoryServicesState {
  config: DirectoryServicesConfig;
  status: DirectoryServicesStatus;
}

/** `directoryservices.config` and `directoryservices.status`, read together. */
export async function readDirectoryServices(client: E2eApiClient): Promise<DirectoryServicesState> {
  const [config, status] = await Promise.all([
    firstValueFrom(client.api.call('directoryservices.config').pipe(timeout(readTimeoutMs))),
    firstValueFrom(client.api.call('directoryservices.status').pipe(timeout(readTimeoutMs))),
  ]);

  return { config, status };
}

/** What a disabled LDAP Plain configuration is saved with — through the form, or by {@link seedDisabledLdapConfig}. */
export interface DisabledLdapConfig {
  serverUrl: string;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  timeout: number;
}

/**
 * Stores an LDAP Plain configuration with Enable Service and Enable Account
 * Cache off and the RFC2307 schema — the values the form is filled with in the
 * spec that saves one, though not byte for byte the request its Save sends.
 *
 * Middleware validates a credential only for an enabled service, so this binds
 * to nothing and needs no LDAP server. Enabling it would bind, and be refused.
 */
export async function seedDisabledLdapConfig(client: E2eApiClient, ldap: DisabledLdapConfig): Promise<void> {
  await runJob(
    client,
    () => client.api.callAndGetJobId('directoryservices.update', [{
      service_type: 'LDAP',
      enable: false,
      enable_account_cache: false,
      timeout: ldap.timeout,
      credential: {
        credential_type: 'LDAP_PLAIN',
        binddn: ldap.bindDn,
        bindpw: ldap.bindPassword,
      },
      // The generated input asks for the discriminant here as well as at the top
      // level (gap 18 in docs/devs/typed-api-client.md), from middleware's own model.
      configuration: {
        service_type: 'LDAP',
        server_urls: [ldap.serverUrl],
        basedn: ldap.baseDn,
        starttls: false,
        validate_certificates: false,
        schema: 'RFC2307',
      },
    }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: 'the disabled LDAP configuration was not stored, so the form has nothing to load',
    },
  );
}

/**
 * Puts the appliance back to "not configured", if a run left a service type
 * behind. A no-op on the baseline, so it is safe in `beforeEach` as well.
 */
export async function ensureDirectoryServicesCleared(client: E2eApiClient): Promise<void> {
  const { config } = await readDirectoryServices(client);
  if (config.service_type === null) {
    return;
  }

  await runJob(
    client,
    () => client.api.callAndGetJobId('directoryservices.update', [{ enable: false, service_type: null }]),
    {
      timeoutMs: slowCallTimeoutMs,
      whatItCosts: `directory services are still configured as ${config.service_type}, `
        + 'so the next run does not start from a new configuration',
    },
  );
}
