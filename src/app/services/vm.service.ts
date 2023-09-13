import { Injectable, Inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, take } from 'rxjs';
import { VmNicType } from 'app/enums/vm.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { VirtualizationDetails, VmDisplayWebUriParams, VmDisplayWebUriParamsOptions } from 'app/interfaces/virtual-machine.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@Injectable({ providedIn: 'root' })
export class VmService {
  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    @Inject(WINDOW) private window: Window,
  ) {}

  getNicTypes(): string[][] {
    return [
      [VmNicType.E1000, 'Intel e82585 (e1000)'],
      [VmNicType.Virtio, 'VirtIO'],
    ];
  }

  getVirtualizationDetails(): Observable<VirtualizationDetails> {
    return this.ws.call('vm.virtualization_details');
  }

  openDisplayWebUri(vmId: number): void {
    this.loader.open();

    const displayOptions = {
      protocol: this.window.location.protocol.replace(':', '').toUpperCase(),
    } as VmDisplayWebUriParamsOptions;

    const requestParams: VmDisplayWebUriParams = [
      vmId,
      this.window.location.host,
      displayOptions,
    ];

    this.ws.call('vm.get_display_web_uri', requestParams)
      .pipe(take(1))
      .subscribe({
        next: (webUri) => {
          this.loader.close();
          if (webUri.error) {
            this.dialogService.warn(this.translate.instant('Error'), webUri.error);
            return;
          }
          this.window.open(webUri.uri, '_blank');
          this.loader.close();
        },
        error: (error: WebsocketError) => {
          this.loader.close();
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }
}
