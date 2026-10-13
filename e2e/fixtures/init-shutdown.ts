/**
 * Init/shutdown script preconditions and cleanup, over the API.
 *
 * A script has no name. The card identifies a row by its command and its When,
 * so these helpers key on the command — and a spec keeps its commands distinct
 * from anything an appliance might already carry.
 *
 * Every script made here is a harmless `echo`: an enabled script really runs
 * at the next boot or shutdown of the appliance, and a run that dies before its
 * teardown leaves one behind.
 */
import type { CallResponse } from '@truenas/api-client';
import { firstValueFrom, timeout } from 'rxjs';
import type { InitShutdownWhen } from '../locators/init-shutdown';
import type { E2eApiClient, E2eApiDirectory } from '../support/api/client';
import { readTimeoutMs, slowCallTimeoutMs } from '../support/timeouts';

/** A script as middleware reports it, with its id narrowed — see `GroupRecord`. */
type InitShutdownScriptEntry = Extract<
  CallResponse<E2eApiDirectory, 'initshutdownscript.query'>, unknown[]
>[number];

export type InitShutdownScriptRecord = InitShutdownScriptEntry & { id: number };

/**
 * The appliance's own record of the script running a command, or undefined.
 *
 * `query`, not `queryOne` — absence is an ordinary answer here.
 */
export async function findInitShutdownScript(
  client: E2eApiClient,
  command: string,
): Promise<InitShutdownScriptRecord | undefined> {
  const [script] = await firstValueFrom(
    client.api.query('initshutdownscript.query', [['command', '=', command]]).pipe(timeout(readTimeoutMs)),
  );

  return script as InitShutdownScriptRecord | undefined;
}

/**
 * Removes every script running a command, if any.
 *
 * Every, because middleware does not hold commands unique: a form saved twice
 * by a retried test leaves two scripts with the same command, and only removing
 * both returns the card to one row per command.
 */
export async function ensureInitShutdownScriptAbsent(client: E2eApiClient, command: string): Promise<void> {
  const scripts = await firstValueFrom(
    client.api.query('initshutdownscript.query', [['command', '=', command]]).pipe(timeout(readTimeoutMs)),
  );

  for (const script of scripts) {
    await firstValueFrom(
      client.api.call('initshutdownscript.delete', [script.id]).pipe(timeout(slowCallTimeoutMs)),
    );
  }
}

/**
 * Creates a command script, if no script runs that command already.
 *
 * For the script an edit or a delete acts on, and for a bystander. Never for
 * the script under test in a create — that one goes through the form.
 */
export async function ensureInitShutdownScriptPresent(
  client: E2eApiClient,
  { command, when, comment = '' }: { command: string; when: InitShutdownWhen; comment?: string },
): Promise<void> {
  if (await findInitShutdownScript(client, command)) {
    return;
  }

  await firstValueFrom(
    client.api.call('initshutdownscript.create', [{
      type: 'COMMAND', command, when, comment, enabled: true, timeout: 10,
    }]).pipe(timeout(slowCallTimeoutMs)),
  );
}
