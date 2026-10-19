/**
 * Docker registry sign-ins on the Apps service, over the API: `app.registry.query` to find one,
 * `app.registry.create` to seed one and `app.registry.delete` to remove it.
 *
 * Create, update and delete all need Docker running, so Apps needs a pool first. Create and update
 * also log in to the registry through the Docker daemon and are refused when that fails, so a
 * registry can only be stored for a URI the appliance can reach and sign in to.
 */
import { expect } from '@playwright/test';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/**
 * Made up. The suite holds no registry credentials, so a registry it signs in to has to be one
 * whose `/v2/` asks for none: the daemon's login then succeeds whatever is sent.
 */
export const madeUpCredentials = { username: 'e2e-registry-user', password: 'e2e-registry-password' };

/**
 * Public registries that may answer `/v2/` without asking for credentials, tried in this order. No
 * scheme-and-host URI here ends in a slash, so the one picked shows whether middleware adds it.
 */
export const registryCandidates = [
  'https://registry.fedoraproject.org',
  'https://registry.access.redhat.com',
  'https://mcr.microsoft.com',
  'https://docker.elastic.co',
];

export interface StoredRegistry {
  id: number;
  name: string;
  uri: string;
}

/** A registry by its name, or undefined when there is none. `username` and `password` come back masked. */
export async function findRegistry(client: E2eApiClient, name: string): Promise<StoredRegistry | undefined> {
  const [registry] = await firstValueFrom(
    client.api.query('app.registry.query', [['name', '=', name]]).pipe(timeout(readTimeoutMs)),
  );
  return registry ? { id: registry.id, name: registry.name, uri: registry.uri } : undefined;
}

/** Stores a registry with {@link madeUpCredentials}, for a test that is not about adding one. */
export async function seedRegistry(client: E2eApiClient, name: string, uri: string): Promise<StoredRegistry> {
  await firstValueFrom(
    client.api.call('app.registry.create', [{ name, uri, ...madeUpCredentials }]).pipe(timeout(slowCallTimeoutMs)),
  );

  const stored = await findRegistry(client, name);
  if (!stored) {
    throw new Error(`app.registry.create returned, and there is no registry named "${name}"`);
  }
  return stored;
}

/**
 * Deletes the registry named `name` if there is one. Matched by the exact name, so a registry the
 * spec did not create, such as a developer's Docker Hub sign-in, is never touched.
 */
export async function ensureRegistryAbsent(client: E2eApiClient, name: string): Promise<void> {
  const registry = await findRegistry(client, name);
  if (!registry) {
    return;
  }

  await firstValueFrom(client.api.call('app.registry.delete', [registry.id]).pipe(timeout(slowCallTimeoutMs)));
  await expect.poll(
    () => findRegistry(client, name),
    { message: `registry "${name}" is still stored, so the next run's add is refused`, timeout: slowCallTimeoutMs },
  ).toBeUndefined();
}

/** What {@link findRegistryAcceptingAnyLogin} found: a URI to sign in to, or why there is none. */
export type RegistryProbe = { uri: string } | { refusals: string[] };

/**
 * The first of {@link registryCandidates} that `app.registry.create` accepts with
 * {@link madeUpCredentials}, stored under `probeName` and deleted again. Each refusal is kept with
 * middleware's own message, so a run where none is accepted says what each one answered.
 */
export async function findRegistryAcceptingAnyLogin(
  client: E2eApiClient,
  probeName: string,
): Promise<RegistryProbe> {
  const refusals: string[] = [];

  for (const uri of registryCandidates) {
    await ensureRegistryAbsent(client, probeName);

    let accepted = false;
    try {
      await seedRegistry(client, probeName, uri);
      accepted = true;
    } catch (error) {
      refusals.push(`${uri}: ${error instanceof Error ? error.message : JSON.stringify(error)}`);
    }

    if (accepted) {
      await ensureRegistryAbsent(client, probeName);
      return { uri };
    }
  }

  return { refusals };
}
