import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  AppLoaderService, DialogService, ServicesService, StorageService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './download-client-config-modal.component.html',
  styleUrls: ['./download-client-config-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DownloadClientConfigModalComponent {
  selectControl = new FormControl(null as number, Validators.required);
  serverCertificates$ = this.services.getCerts().pipe(idNameArrayToOptions());

  constructor(
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private dialogRef: MatDialogRef<DownloadClientConfigModalComponent>,
    private services: ServicesService,
    private router: Router,
    private slideInService: IxSlideInService,
    private storageService: StorageService,
  ) {}

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
      .subscribe({
        next: (key) => {
          this.loader.close();
          this.dialogRef.close();
          this.storageService.downloadText(key, 'openVPNClientConfig.ovpn');
        },
        error: (error) => {
          this.loader.close();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }

  certificatesLinkClicked(): void {
    this.dialogRef.close();
    this.slideInService.close();
    this.router.navigate(['/', 'credentials', 'certificates']);
  }
}
