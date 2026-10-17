/**
 * What the appliance says about itself, over the API.
 *
 * Read-only: the Dashboard specs check the System Information and CPU Model widgets against this,
 * and nothing here changes the appliance.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

/** The part of `system.info` the System Information widget shows. */
export type SystemIdentity = Pick<CallResponse<E2eApiDirectory, 'system.info'>, 'hostname' | 'version'>;

export async function readSystemIdentity(client: E2eApiClient): Promise<SystemIdentity> {
  const info = await firstValueFrom(client.api.call('system.info').pipe(timeout(readTimeoutMs)));

  return { hostname: info.hostname, version: info.version };
}

/** The license types webui brands as Commercial or Enterprise: `getProductTypeForLicense`. */
const commercialOrEnterpriseLicenseTypes = new Set(['ENTERPRISE', 'ENTERPRISE_HA', 'ENTERPRISE_SINGLE', 'COMMERCIAL']);

/**
 * Whether webui brands this appliance as Commercial or Enterprise, which is what moves the
 * copyright line's link from the testdrive page to the production one.
 *
 * Read from the license type in `truenas.entitlements.facts`, as `selectProductType` does.
 * `system.product_type` no longer decides the edition. No license, or a type webui does not know,
 * is Community.
 */
export async function readIsCommercialOrEnterprise(client: E2eApiClient): Promise<boolean> {
  const facts = await firstValueFrom(client.api.call('truenas.entitlements.facts').pipe(timeout(readTimeoutMs)));

  return commercialOrEnterpriseLicenseTypes.has(String(facts.license_type));
}

/** The CPU model, which the Dashboard's CPU Model widget shows as its value. */
export async function readCpuModel(client: E2eApiClient): Promise<string> {
  const info = await firstValueFrom(client.api.call('system.info').pipe(timeout(readTimeoutMs)));
  if (!info.model) {
    throw new Error('system.info reports no CPU model for the CPU Model widget to show.');
  }

  return info.model;
}
