/**
 * ACME DNS authenticator preconditions, cleanup and readback, over the API.
 *
 * Keyed on the name, which the card builds every id on a row from. Creating,
 * updating and deleting one are plain calls, not jobs.
 *
 * A Cloudflare authenticator saves with a token that has never been near
 * Cloudflare: middleware's `validate_credentials` for it only checks which of
 * token, key and email were given together, and makes no request. So a dummy
 * token is enough, and nothing here needs an outside account.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type AuthenticatorEntry = Extract<CallResponse<E2eApiDirectory, 'acme.dns.authenticator.query'>, unknown[]>[number];

export type AcmeDnsAuthenticatorRecord = AuthenticatorEntry & { id: number };

/**
 * What a Cloudflare authenticator stores, as middleware reports it. Each
 * credential is null when it was not given.
 */
export interface CloudflareAttributes {
  authenticator: string;
  cloudflare_email: string | null;
  api_key: string | null;
  api_token: string | null;
}

/** The appliance's own record of the authenticator with this name, or undefined. */
export async function findAcmeDnsAuthenticator(
  client: E2eApiClient,
  name: string,
): Promise<AcmeDnsAuthenticatorRecord | undefined> {
  const [authenticator] = await firstValueFrom(
    client.api.query('acme.dns.authenticator.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );

  return authenticator as AcmeDnsAuthenticatorRecord | undefined;
}

/** How many authenticators the appliance holds, whoever made them. */
export async function countAcmeDnsAuthenticators(client: E2eApiClient): Promise<number> {
  const authenticators = await firstValueFrom(
    client.api.query('acme.dns.authenticator.query', []).pipe(timeout(readTimeoutMs)),
  );

  return authenticators.length;
}

/**
 * An authenticator's attributes read as Cloudflare's; undefined for no
 * authenticator.
 *
 * The cast is because `attributes` is typed as a union of every provider's
 * schema, discriminated on `authenticator` — the same reading
 * `toDnsAuthenticator` in the app does. Through `unknown` because this names
 * every Cloudflare field as present, which the union does not promise.
 */
export function cloudflareAttributes(
  authenticator: AcmeDnsAuthenticatorRecord | undefined,
): CloudflareAttributes | undefined {
  return authenticator?.attributes as unknown as CloudflareAttributes | undefined;
}

/**
 * Creates a Cloudflare authenticator with this name and token, if none has this
 * name already.
 *
 * For the authenticator an edit or delete acts on, and for a bystander. Never
 * for the one under test in a create — that one goes through the form.
 */
export async function ensureCloudflareAuthenticatorPresent(
  client: E2eApiClient,
  name: string,
  apiToken: string,
): Promise<void> {
  if (await findAcmeDnsAuthenticator(client, name)) {
    return;
  }

  await firstValueFrom(
    client.api.call('acme.dns.authenticator.create', [{
      name,
      attributes: {
        authenticator: 'cloudflare',
        api_token: apiToken,
      },
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}

/** Removes the authenticator with this name, if there is one. */
export async function ensureAcmeDnsAuthenticatorAbsent(client: E2eApiClient, name: string): Promise<void> {
  const authenticator = await findAcmeDnsAuthenticator(client, name);
  if (!authenticator) {
    return;
  }

  await firstValueFrom(
    client.api.call('acme.dns.authenticator.delete', [authenticator.id]).pipe(timeout(slowCallTimeoutMs)),
  );
}
