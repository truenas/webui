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

/** Waits for the shell to connect, which is when the font-size buttons render. */
export async function waitForShell(page: Page): Promise<void> {
  await expect(page.locator(terminalLocators.increaseFontSize)).toBeVisible({ timeout: shellConnectTimeoutMs });
}

/** Clicks the terminal to focus xterm's input, types `command` and presses Enter. */
export async function runInTerminal(page: Page, command: string): Promise<void> {
  await page.locator(terminalLocators.terminal).click();
  await page.keyboard.type(command);
  await page.keyboard.press('Enter');
}
