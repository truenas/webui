/**
 * Using the shared shell terminal: waiting for it to connect and typing a command into it.
 */
import { expect, type Page } from '@playwright/test';
import { terminalLocators } from '../locators/terminal';

/**
 * The terminal fetches a one-time token and then opens its own websocket to `/websocket/shell/`. A
 * ceiling, not a wait: on a reachable appliance it connects in a second or two.
 */
export const shellConnectTimeoutMs = 60_000;

/**
 * Waits for the shell to connect, which is when the font-size buttons render, and then to be fitted
 * to the page. The fit is a `core.resize_shell` sent 300 ms after connecting, and a shell that is
 * resized while a line is being typed can drop that line and print a fresh prompt.
 */
export async function waitForShell(page: Page): Promise<void> {
  await expect(page.locator(terminalLocators.increaseFontSize)).toBeVisible({ timeout: shellConnectTimeoutMs });
  await expect(page.locator(terminalLocators.input)).toBeFocused({ timeout: shellConnectTimeoutMs });
}

/**
 * Clicks the terminal to focus xterm's input, types `command` and presses Enter once the shell has
 * echoed all of it, so Enter cannot run a line the shell has only partly read.
 */
export async function runInTerminal(page: Page, command: string): Promise<void> {
  const terminal = page.locator(terminalLocators.terminal);
  await terminal.click();
  await page.keyboard.type(command);
  await expect(terminal).toContainText(command);
  await page.keyboard.press('Enter');
}
