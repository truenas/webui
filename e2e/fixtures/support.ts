/**
 * What the Support card, the System Thumbprint dialog and the EULA page show, read over the API.
 *
 * Read-only. Nothing here changes the appliance: no license upload, no EULA acceptance and no
 * production flag.
 *
 * The two label maps below are copies of webui's, on purpose. The card shows a label, the API
 * answers with a key, and nothing on the appliance holds the label. If webui renames one, the
 * Support card spec fails on that readout and this copy is what to update.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs } from '../support/timeouts';

export type LicenseInfo = NonNullable<CallResponse<E2eApiDirectory, 'truenas.license.info'>>;

/** `getLabelForContractType` in `src/app/interfaces/system-info.interface.ts`. */
const contractTypeLabels: Record<string, string> = {
  GOLD: 'Gold',
  LEGACY: 'Legacy',
  STANDARD: 'Standard',
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  FREENASCERTIFIED: 'Free NAS Certified',
  FREENASMINI: 'Free NAS Mini',
  SILVERINTERNATIONAL: 'Silver International',
};

/** `getLabelForLicenseFeature` in `src/app/enums/license-feature.enum.ts`. */
const licenseFeatureLabels: Record<string, string> = {
  APPS: 'Apps',
  CONTAINERS: 'Containers',
  DEDUP: 'Deduplication',
  FIBRECHANNEL: 'Fibre Channel',
  LTS: 'LTS',
  SED: 'Self-Encrypting Drives',
  SUPPORT: 'Support',
  VMS: 'VMs',
  ZFSTIER: 'ZFS Tiering',
};

/** The license types for which `sys-info.component` hides the System Thumbprint row. */
const enterpriseLicenseTypes = new Set(['ENTERPRISE', 'ENTERPRISE_HA', 'ENTERPRISE_SINGLE']);

/** What the dialog shows for a null or empty value. */
const emptyPlaceholder = '—';

/** The appliance's license, or null when it has none. */
export async function readLicense(client: E2eApiClient): Promise<LicenseInfo | null> {
  return firstValueFrom(client.api.call('truenas.license.info').pipe(timeout(readTimeoutMs)));
}

/** The two `system.info` fields the licensed card reads: the fallback Model, and System Serial. */
export async function readSupportSystemInfo(client: E2eApiClient): Promise<{ model: string; serial: string | null }> {
  const info = await firstValueFrom(client.api.call('system.info').pipe(timeout(readTimeoutMs)));

  return { model: info.model, serial: info.system_serial };
}

/** Whether Proactive Support can be set up here, and whether it is. */
export async function readProactiveSupport(client: E2eApiClient): Promise<{ available: boolean; enabled: boolean }> {
  const available = await firstValueFrom(client.api.call('support.is_available').pipe(timeout(readTimeoutMs)));
  if (!available) {
    return { available, enabled: false };
  }
  const enabled = await firstValueFrom(
    client.api.call('support.is_available_and_enabled').pipe(timeout(readTimeoutMs)),
  );

  return { available, enabled };
}

/** The base64 thumbprint, as the dialog receives it. */
export async function readFingerprint(client: E2eApiClient): Promise<string> {
  return firstValueFrom(client.api.call('truenas.license.fingerprint').pipe(timeout(readTimeoutMs)));
}

/** The EULA's HTML, or null where the appliance has none. */
export async function readEula(client: E2eApiClient): Promise<string | null> {
  return firstValueFrom(client.api.call('truenas.get_eula').pipe(timeout(readTimeoutMs)));
}

/** The Contract Type readout. `normalizeLicense` upper-cases it, and an unknown value is shown as it is. */
export function contractTypeLabel(contractType: string): string {
  const upper = contractType.toUpperCase();

  return contractTypeLabels[upper] ?? upper;
}

/** The Features readout: every feature but SUPPORT, by label, or `NONE`. */
export function featuresLabel(license: LicenseInfo): string {
  const labels = license.features
    .filter((feature) => feature.name !== 'SUPPORT')
    .map((feature) => licenseFeatureLabels[feature.name] ?? feature.name);

  return labels.length ? labels.join(', ') : 'NONE';
}

/** The Additional Hardware readout, or null when the license lists no enclosures. */
export function additionalHardwareLabel(license: LicenseInfo): string | null {
  const entries = Object.entries(license.enclosures);

  return entries.length ? entries.map(([model, count]) => `${count}× ${model}`).join(', ') : null;
}

/**
 * The SUPPORT feature's expiry as `yyyy-MM-dd` in UTC, which is the baseline date format, or null.
 *
 * Typed as a string, but it arrives as an `ApiDate` envelope (`{ $type: 'date', $value }`), which
 * is what `formatLicenseExpiration` reads. Either is accepted here.
 */
export function supportExpiryDate(license: LicenseInfo): string | null {
  const expiresAt: unknown = license.features.find((feature) => feature.name === 'SUPPORT')?.expires_at;
  const value = typeof expiresAt === 'object' && expiresAt !== null
    ? (expiresAt as { $value?: unknown }).$value
    : expiresAt;
  if (typeof value !== 'string' || !value) {
    return null;
  }

  return new Date(value).toISOString().slice(0, 10);
}

/** Whether `sys-info.component` hides the System Thumbprint row for this license. */
export function hidesFingerprint(license: LicenseInfo | null): boolean {
  return enterpriseLicenseTypes.has(String(license?.type));
}

/**
 * One key of the thumbprint as the dialog lays it out. A single value, or a list of one, is shown
 * in the field itself (`value`). A list of two or more is shown one item each (`items`).
 */
export type FingerprintField = { key: string; value: string } | { key: string; items: string[] };

type FingerprintPrimitive = string | number | boolean | null;

function isFingerprintPrimitive(value: unknown): value is FingerprintPrimitive {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function formatFingerprintPrimitive(value: FingerprintPrimitive): string {
  if (value === null || value === '') {
    return emptyPlaceholder;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }

  return String(value);
}

/**
 * The thumbprint decoded as `LicenseFingerprintDialog` decodes it: base64, then JSON, then one
 * field per key. Null when it is not an object of plain values or lists of them, which is when the
 * dialog shows the raw answer instead.
 */
export function decodeFingerprint(raw: string): FingerprintField[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
  } catch {
    return null;
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return null;
  }
  const entries = Object.entries(parsed as Record<string, unknown>);
  const isValid = entries.every(([, value]) => (
    isFingerprintPrimitive(value) || (Array.isArray(value) && value.every(isFingerprintPrimitive))
  ));
  if (!entries.length || !isValid) {
    return null;
  }

  return entries.map(([key, value]): FingerprintField => {
    if (!Array.isArray(value)) {
      return { key, value: formatFingerprintPrimitive(value as FingerprintPrimitive) };
    }
    const [first, ...rest] = (value as FingerprintPrimitive[]).map(formatFingerprintPrimitive);
    if (first === undefined) {
      return { key, value: emptyPlaceholder };
    }

    return rest.length ? { key, items: [first, ...rest] } : { key, value: first };
  });
}

/**
 * The first line of text in the EULA, to look for on the page.
 *
 * The tags are removed, which leaves what the page's `textContent` holds, and the few entities a
 * legal text uses are decoded. One distinctive line rather than the whole document, so a
 * difference in how the browser lays out whitespace cannot fail it.
 */
export function firstEulaLine(html: string): string | undefined {
  const text = html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');

  return text.split('\n').map((line) => line.trim()).find((line) => line.length > 0);
}
