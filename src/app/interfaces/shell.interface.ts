export interface ShellConnectedEvent {
  id?: string;
  connected: boolean;
}

export type ResizeShellRequest = [
  connectionId: string,
  cols: number,
  rows: number,
];
