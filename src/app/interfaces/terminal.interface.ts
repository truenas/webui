import { Observable, Subject } from 'rxjs';
import { ShellService } from 'app/services';

export interface TerminalConfiguration {
  reconnectShell$?: Subject<void>;
  preInit?(): Observable<void>;
  setShellConnectionData?(shellService: ShellService): void;
  customReconnectAction?(): void;
}
