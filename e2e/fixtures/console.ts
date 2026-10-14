/**
 * Console settings: preconditions, cleanup and readback, over the API.
 *
 * These five settings are part of `system.advanced`, a single config record, so
 * — as in `fixtures/syslog.ts` — there is nothing to create or delete. Each test
 * starts from a known baseline and teardown writes that baseline back, rather
 * than snapshotting what it found and restoring that.
 *
 * The baseline is middleware's own default: the text console shown without a
 * password prompt, the serial console off on `ttyS0` at 9600 bps, and the stock
 * banner. That is what a fresh appliance holds.
 *
 * The serial port is never changed, only the console turned on and off over it.
 * Which ports exist depends on the machine, and middleware refuses to turn the
 * serial console on over one it does not list. `ttyS0` is the one the CI
 * appliance's own console is read from.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

type AdvancedConfig = CallResponse<E2eApiDirectory, 'system.advanced.config'>;

type ConsoleField = 'consolemenu' | 'serialconsole' | 'serialport' | 'serialspeed' | 'motd';

/** The part of `system.advanced` the Console card shows and its form edits. */
export type ConsoleSettings = Pick<AdvancedConfig, ConsoleField>;

/** Middleware's defaults for the five settings. */
export const consoleBaseline: ConsoleSettings = {
  consolemenu: true,
  serialconsole: false,
  serialport: 'ttyS0',
  serialspeed: '9600',
  motd: 'Welcome to TrueNAS',
};

/** The five settings as the appliance holds them. */
export async function readConsoleSettings(client: E2eApiClient): Promise<ConsoleSettings> {
  const config = await firstValueFrom(client.api.call('system.advanced.config').pipe(timeout(readTimeoutMs)));

  return {
    consolemenu: config.consolemenu,
    serialconsole: config.serialconsole,
    serialport: config.serialport,
    serialspeed: config.serialspeed,
    motd: config.motd,
  };
}

/**
 * Writes all five settings. Used for the baseline, and for the state a test
 * starts from. Never for the change under test, which goes through the form.
 *
 * A slow call, because saving regenerates the boot loader's and the consoles'
 * configuration.
 */
export async function setConsoleSettings(client: E2eApiClient, settings: ConsoleSettings): Promise<void> {
  await firstValueFrom(
    client.api.call('system.advanced.update', [{
      consolemenu: settings.consolemenu,
      serialconsole: settings.serialconsole,
      serialport: settings.serialport,
      serialspeed: settings.serialspeed,
      motd: settings.motd,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
