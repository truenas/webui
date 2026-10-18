/**
 * Container images on the Apps service, over the API: `app.image.query` to find one and
 * `app.image.delete` to remove it. Docker has to be running, so Apps needs a pool first.
 */
import { expect } from '@playwright/test';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A pull downloads the image. A ceiling, not a wait: a small image arrives in seconds. */
export const imagePullTimeoutMs = 5 * 60_000;

/** The id (`sha256:…`) of the image tagged `repoTag`, or undefined when there is none. */
export async function findImageId(client: E2eApiClient, repoTag: string): Promise<string | undefined> {
  const images = await firstValueFrom(client.api.query('app.image.query', []).pipe(timeout(readTimeoutMs)));
  return images.find((image) => image.repo_tags.includes(repoTag))?.id;
}

/**
 * Deletes the image tagged `repoTag` if there is one. `force`, so a stopped container still using
 * it does not keep it.
 *
 * Has to run before the Apps pool is unset: the image lives in Docker's storage on that pool.
 */
export async function ensureImageAbsent(client: E2eApiClient, repoTag: string): Promise<void> {
  const id = await findImageId(client, repoTag);
  if (id === undefined) {
    return;
  }

  await firstValueFrom(
    client.api.call('app.image.delete', [id, { force: true }]).pipe(timeout(slowCallTimeoutMs)),
  );
  await expect.poll(
    () => findImageId(client, repoTag),
    {
      message: `image ${repoTag} is still on the appliance, so the next run's pull proves nothing`,
      timeout: slowCallTimeoutMs,
    },
  ).toBeUndefined();
}
