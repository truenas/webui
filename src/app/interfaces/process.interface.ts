export interface Process {
  cmdline: string;
  name: string;
  pid: number;
  service?: string;
}
