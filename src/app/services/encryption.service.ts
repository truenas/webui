import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/download-key/download-key-dialog.component';
import { WebSocketService } from 'app/services/';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';
import { T } from 'app/translate-marker';
import helptext from '../helptext/storage/volumes/volume-key';

@Injectable({
  providedIn: 'root',
})

export class EncryptionService {
  constructor(protected ws: WebSocketService, protected dialogService: DialogService,
    protected loader: AppLoaderService, protected storage: StorageService,
    protected mdDialog: MatDialog, protected router: Router, protected http: HttpClient) {}

  setPassphrase(
    row: string,
    encryptKeyPassphrase: string,
    adminPassphrase: string,
    poolName: string,
    route_success: string[],
    addRecoveryKey?: boolean,
    downloadEncrytpKey?: boolean,
    success_message?: string,
  ): void {
    this.loader.open();
    this.ws.call('pool.passphrase', [parseInt(row), {
      passphrase: encryptKeyPassphrase,
      admin_password: adminPassphrase,
    }]).subscribe(() => {
      this.loader.close();
      this.dialogService.info(T('Set Passphrase'), T(`Passphrase ${success_message} <i>${poolName}</i>`), '300px', 'info', true);
      this.openEncryptDialog(row, route_success, poolName, addRecoveryKey);
    },
    (err) => {
      this.loader.close();
      this.dialogService.errorReport(T(`Error creating passphrase for pool ${poolName}`), err.reason, err.trace.formatted);
    });
  }

  openEncryptDialog(row: string, route_success: string[], poolName: string, addRecoveryKey?: boolean): void {
    const dialogRef = this.mdDialog.open(DownloadKeyModalDialog, { disableClose: true });
    dialogRef.componentInstance.volumeId = parseInt(row);
    dialogRef.componentInstance.fileName = 'pool_' + poolName + '_encryption.key';
    dialogRef.afterClosed().subscribe(() => {
      if (addRecoveryKey) {
        this.makeRecoveryKey(row, poolName, route_success);
      } else {
        this.router.navigate(new Array('/').concat(
          route_success,
        ));
      }
    });
  }

  makeRecoveryKey(row: string, poolName: string, route_success: string[]): void {
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
            route_success,
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
      this.dialogService.errorReport(T(`Error adding recovery key to pool ${poolName}`), err.reason, err.trace.formatted);
    });
  }

  deleteRecoveryKey(row: string, adminPassphrase: string, poolName: string, route_success: string[]): void {
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
          this.dialogService.info(helptext.delete_recovery_key_title, T(`Recovery key deleted from pool <i>${poolName}</i>`), '300px', 'info', true);
          this.router.navigate(new Array('/').concat(route_success));
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T(`Error deleting recovery key for pool ${poolName}`), err.error.message, err.error.traceback);
        });
      });
  }
}
