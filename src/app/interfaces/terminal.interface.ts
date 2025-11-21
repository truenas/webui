import { Observable, Subject } from 'rxjs';

export interface TerminalConfiguration {
  reconnectShell$?: Subject<void>;
  preInit?(): Observable<void>;
  connectionData: TerminalConnectionData;
}

export type TerminalConnectionData =
  // VMs
  | {
    vm_id: number;
  }
  // Containers
  | {
    container_id: number;
    use_console: boolean;
  }
  // Apps
  | {
    app_name: string;
    container_id: string;
    command: string;
  }
  // No params
  | Record<string, never>;
