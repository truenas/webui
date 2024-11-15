import { Observable, Subject } from 'rxjs';

export interface TerminalConfiguration {
  reconnectShell$?: Subject<void>;
  preInit?(): Observable<void>;
  customReconnectAction?(): void;
  connectionData: TerminalConnectionData;
}

export type TerminalConnectionData =
  // VMs
  | {
    vm_id: number;
  }
  // Virtualization instances
  | {
    virt_instance_id: string;
  }
  // Apps
  | {
    app_name: string;
    container_id: string;
    command: string;
  }
  // No params
  | Record<string, never>;
