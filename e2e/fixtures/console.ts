/**
 * Console settings (part of `system.advanced`, one config record): preconditions, cleanup, readback, over the API.
 *
 * As in `fixtures/syslog.ts`, tests start from middleware's default (no console password, serial off on
 * `ttyS0` at 9600, stock banner) and teardown writes it back. The serial port is never changed: ports vary by
 * machine and middleware refuses one it does not list; `ttyS0` is where CI reads its console.
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
