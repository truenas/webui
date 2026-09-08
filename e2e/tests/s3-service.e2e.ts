/**
 * Story: the S3 service is put on a TLS listener.
 *
 * An administrator opens the service configuration from the dashboard card,
 * adds a listener on a real bind address with TLS, sets the server count,
 * region and log level, and saves. Everything the form sends is something
 * middleware validates — a bind address it does not offer, a port it refuses,
 * a listener shape it does not accept — and none of that is visible to the
 * unit suite, which is why this is an appliance test.
 *
 * The configuration is snapshotted before and restored after, over the API.
 */
import { firstValueFrom, timeout } from 'rxjs';
import {
  clearS3Listeners, ensureS3ServiceStopped, queryS3Service, readS3Config, restoreS3Config, type S3ConfigEntry,
} from '../fixtures/s3';
import { configureS3Service } from '../flows/s3';
import { leavingTestData, runCleanupSteps } from '../support/cleanup';
import { expect, test } from '../support/fixtures';
import { readTimeoutMs } from '../support/timeouts';

const settings = {
  port: 9443,
  tls: true,
  servers: 2,
  region: 'us-east-1',
  logLevel: 'INFO',
} as const;

/**
 * What the service looked like before the test touched it. Read in
 * `beforeEach`, so a run interrupted after a save leaves its own configuration
 * for the next run to read as "original" — accepted, since the settings below
 * are all ones a fresh appliance also ships with and nothing depends on them.
 */
let original: S3ConfigEntry | undefined;

/**
 * The `pool` fixture is asked for, though nothing here is stored under it: the
 * Shares dashboard renders an empty state instead of its cards on an appliance
 * with no pool, and the S3 card is where the configuration is opened from.
 * Asking is the whole precondition; the name goes into the report so a failure
 * says which pool the dashboard was showing.
 */
test.beforeEach(async ({ api, pool }) => {
  test.info().annotations.push({ type: 'pool', description: pool });
  await ensureS3ServiceStopped(api);
  original = await readS3Config(api);
  // The form appends to the stored listeners; starting from none is what makes
  // "exactly one listener" below a statement about this journey.
  await clearS3Listeners(api);
});

test.afterEach(async ({ api }) => {
  if (leavingTestData('the S3 service configuration as the test set it')) {
    return;
  }
  await runCleanupSteps([
    ['restore the S3 service configuration', async () => {
      if (original) {
        await restoreS3Config(api, original);
      }
    }],
    ['stop the S3 service', () => ensureS3ServiceStopped(api)],
  ]);
});

test('an admin puts the S3 service on a TLS listener', async ({ page, api }) => {
  // The card's header menu is keyed on the service's numeric id, and the bind
  // address has to be one the appliance offers: both come from middleware.
  const service = await queryS3Service(api);
  if (!service) {
    throw new Error('The S3 service row is missing, so this appliance has no S3 to configure.');
  }

  const choices = await firstValueFrom(
    api.api.call('s3.bindip_choices').pipe(timeout(readTimeoutMs)),
  );
  // The any-address is preferred over an interface address, which differs per
  // appliance and could be the one the suite itself is talking to.
  const address = '0.0.0.0' in choices ? '0.0.0.0' : Object.keys(choices)[0];
  if (!address) {
    throw new Error('s3.bindip_choices offered no address to listen on.');
  }

  await test.step('configure the service from the dashboard card', async () => {
    await configureS3Service(page, service.id, { ...settings, address });
  });

  // Over the API: the form closing says middleware accepted the payload, and
  // this asks whether it stored what the form claimed to send.
  await test.step('confirm middleware holds the new configuration', async () => {
    const config = await readS3Config(api);

    expect(config.listeners).toHaveLength(1);
    expect(config.listeners?.[0]).toMatchObject({ address, port: settings.port, tls: true });
    expect(config).toMatchObject({
      servers: settings.servers,
      region: settings.region,
      log_level: settings.logLevel,
      certificate: null,
    });
  });
});
