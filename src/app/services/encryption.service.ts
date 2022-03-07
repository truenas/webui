import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { DownloadKeyDialogComponent } from 'app/modules/common/dialog/download-key/download-key-dialog.component';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';
import helptext from '../helptext/storage/volumes/volume-key';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  constructor(
    protected ws: WebSocketService,
    protected dialogService: DialogService,
    protected loader: AppLoaderService,
    protected storage: StorageService,
    protected mdDialog: MatDialog,
    protected router: Router,
    protected http: HttpClient,
    protected translate: TranslateService,
  ) {}

  setPassphrase(
    row: string,
    encryptKeyPassphrase: string,
    adminPassphrase: string,
    poolName: string,
    routeSuccess: string[],
    addRecoveryKey?: boolean,
    downloadEncryptKey?: boolean,
    successMessage?: string,
  ): void {
    this.loader.open();
    this.ws.call('pool.passphrase', [parseInt(row), {
      passphrase: encryptKeyPassphrase,
      admin_password: adminPassphrase,
    }]).subscribe(() => {
      this.loader.close();
      this.dialogService.info(
        T('Set Passphrase'),
        this.translate.instant('Passphrase {successMessage} <i>{poolName}</i>', { successMessage, poolName }),
        '300px',
        'info',
        true,
      );
      this.openEncryptDialog(row, routeSuccess, poolName, addRecoveryKey);
    },
    (err) => {
      this.loader.close();
      this.dialogService.errorReport(
        this.translate.instant('Error creating passphrase for pool {poolName}', { poolName }),
        err.reason,
        err.trace.formatted,
      );
    });
  }

  openEncryptDialog(row: string, routeSuccess: string[], poolName: string, addRecoveryKey?: boolean): void {
    const dialogRef = this.mdDialog.open(DownloadKeyDialogComponent, { disableClose: true });
    dialogRef.componentInstance.volumeId = parseInt(row);
    dialogRef.componentInstance.fileName = 'pool_' + poolName + '_encryption.key';
    dialogRef.afterClosed().subscribe(() => {
      if (addRecoveryKey) {
        this.makeRecoveryKey(row, poolName, routeSuccess);
      } else {
        this.router.navigate(new Array('/').concat(
          routeSuccess,
        ));
      }
    });
  }

  makeRecoveryKey(row: string, poolName: string, routeSuccess: string[]): void {
    this.loader.open();
    const fileName = 'pool_' + poolName + '_recovery.key';
    this.ws.call('core.download', ['pool.recoverykey_add', [parseInt(row)], fileName]).subscribe((res) => {
      this.loader.close();
      this.dialogService.confirm({
        title: helptext.set_recoverykey_dialog_title,
        message: helptext.set_recoverykey_dialog_message,
        hideCheckBox: true,
        buttonMsg: helptext.set_recoverykey_dialog_button,
        hideCancel: true,
      }).subscribe(() => {
        const url = res[1];
        const mimetype = 'application/octet-stream';
        this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe((file) => {
          this.storage.downloadBlob(file, fileName);
          this.router.navigate(new Array('/').concat(
            routeSuccess,
          ));
        }, (err) => {
          this.dialogService.errorReport(
            helptext.addkey_download_failed_title,
            helptext.addkey_download_failed_message,
            err,
          );
        });
      });
    }, (err) => {
      this.loader.close();
      this.dialogService.errorReport(
        this.translate.instant('Error adding recovery key to pool {poolName}', { poolName }),
        err.reason,
        err.trace.formatted,
      );
    });
  }

  deleteRecoveryKey(row: string, adminPassphrase: string, poolName: string, routeSuccess: string[]): void {
    this.dialogService.confirm({
      title: helptext.delete_recovery_key_title,
      message: helptext.delete_recovery_key_message,
      hideCheckBox: true,
      buttonMsg: T('Delete Key'),
    })
      .pipe(filter(Boolean))
      .subscribe(() => {
        this.loader.open();
        this.ws.call('pool.recoverykey_rm', [parseInt(row), { admin_password: adminPassphrase }]).subscribe(() => {
          this.loader.close();
          this.dialogService.info(
            helptext.delete_recovery_key_title,
            this.translate.instant('Recovery key deleted from pool <i>{poolName}</i>', { poolName }),
            '300px',
            'info',
            true,
          );
          this.router.navigate(new Array('/').concat(routeSuccess));
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(
            this.translate.instant('Error deleting recovery key for pool {poolName}', { poolName }),
            err.error.message,
            err.error.traceback,
          );
        });
      });
  }
}
