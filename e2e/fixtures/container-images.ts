/**
 * Container images on the Apps service, over the API: `app.image.query` to find one,
 * `app.image.pull` to fetch it and `app.image.delete` to remove it. Docker has to be running, so
 * Apps needs a pool first.
 */
import { expect } from '@playwright/test';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient } from '../support/api/client';
import { runJob } from '../support/jobs';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A pull downloads the image. A ceiling, not a wait: a small image arrives in seconds. */
export const imagePullTimeoutMs = 5 * 60_000;

/** The id (`sha256:…`) of the image tagged `repoTag`, or undefined when there is none. */
export async function findImageId(client: E2eApiClient, repoTag: string): Promise<string | undefined> {
  const images = await firstValueFrom(client.api.query('app.image.query', []).pipe(timeout(readTimeoutMs)));
  return images.find((image) => image.repo_tags.includes(repoTag))?.id;
}

/**
 * Pulls the image tagged `repoTag` unless it is already there, for a test that installs an app and
 * is not about pulling.
 *
 * A registry's anonymous rate limit answers a pull with `toomanyrequests` within seconds, and on CI
 * it failed an install on both attempts while a pull minutes later went through. So a failed pull
 * is tried again, whole, until the ceiling.
 *
 * The image is read back after the job, because a job that ended `SUCCESS` does not mean it
 * arrived. Middleware fails `app.image.pull` only when Docker refuses the request outright; a
 * `toomanyrequests` that arrives inside the pull's stream ends the job `SUCCESS` with no image. That
 * returned here as a pulled image, and the install's own `up` then went to the registry and was
 * throttled.
 */
export async function ensureImagePresent(client: E2eApiClient, repoTag: string): Promise<void> {
  await expect(async () => {
    if ((await findImageId(client, repoTag)) !== undefined) {
      return;
    }

    await runJob(
      client,
      () => client.api.callAndGetJobId('app.image.pull', [{ image: repoTag }]),
      {
        timeoutMs: imagePullTimeoutMs,
        whatItCosts: `image ${repoTag} was not pulled, so the app that runs it cannot be installed`,
        confirm: async () => (await findImageId(client, repoTag)) !== undefined,
      },
    );

    if ((await findImageId(client, repoTag)) === undefined) {
      throw new Error(`the pull of image ${repoTag} succeeded and left no image, as a throttled pull does`);
    }
  }).toPass({ intervals: [10_000, 30_000], timeout: imagePullTimeoutMs });
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
