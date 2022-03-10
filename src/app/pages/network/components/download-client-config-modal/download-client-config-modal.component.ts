import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Option } from 'app/interfaces/option.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  AppLoaderService, DialogService, ServicesService, StorageService, WebSocketService,
} from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './download-client-config-modal.component.html',
  styleUrls: ['./download-client-config-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadClientConfigModalComponent {
  selectControl = new FormControl(null as number, Validators.required);
  serverCertificates$: Observable<Option[]>;

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<DownloadClientConfigModalComponent>,
    private services: ServicesService,
    private storageService: StorageService,
    @Inject(MAT_DIALOG_DATA) serverCertificates: Option[],
  ) {
    this.serverCertificates$ = of(serverCertificates);
  }

  onSave(): void {
    const clientCertificateId = this.selectControl.value;

    this.loader.open();
    this.ws.call('interface.websocket_local_ip')
      .pipe(
        switchMap((localIp) => {
          return this.services.generateOpenServerClientConfig(clientCertificateId, localIp);
        }),
        untilDestroyed(this),
      )
      .subscribe(
        (key) => {
          this.loader.close();
          this.dialogRef.close();
          this.storageService.downloadText(key, 'openVPNClientConfig.ovpn');
        },
        (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      );
  }
}
