/**
 * The shared shell terminal, `ix-terminal` (`terminal.component.html`), as an app container's Shell
 * and System > Shell open it. The container and VM consoles render the same component.
 *
 * xterm draws with its DOM renderer, so what the shell prints is real text inside the tagged div.
 * That div also holds xterm's measuring spans (runs of `W`), so read it with `toContainText`, never
 * `toHaveText`.
 */
export const terminalLocators = {
  /** `<div #terminal tnTestId="terminal">`, xterm's host. Clicking it focuses xterm's input. */
  terminal: '[data-test="terminal"]',
  /**
   * `ix-terminal-font-size`, which the page header renders only once the shell has connected. The
   * readiness signal: the "Connecting..." overlay before it has no id.
   */
  increaseFontSize: '[data-test="button-increase-font-size"]',
} as const;
