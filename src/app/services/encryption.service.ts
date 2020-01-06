import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { StorageService } from 'app/services/storage.service';

import { MatSnackBar, MatDialog } from '@angular/material';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { T } from 'app/translate-marker';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';
import helptext from '../helptext/storage/volumes/volume-key'

@Injectable({
  providedIn: 'root'
})

export class EncryptionService {
    constructor(protected ws: WebSocketService, protected dialogService: DialogService,
        protected snackBar: MatSnackBar, protected loader: AppLoaderService, protected storage: StorageService,
        protected mdDialog: MatDialog, protected router: Router, protected http: Http) {}

    setPassphrase(row, encryptKeyPassphrase, adminPassphrase, poolName, route_success, 
      addRecoveryKey?: boolean, downloadEncrytpKey?: boolean, success_message?) {
      this.loader.open();
      this.ws.call('pool.passphrase', [parseInt(row), {'passphrase': encryptKeyPassphrase, 
        'admin_password': adminPassphrase}]).subscribe(() => {
          this.loader.close();
          this.dialogService.Info(T('Set Passphrase'), T(`Passphrase ${success_message} <i>${poolName}</i>`), '300px', "info", true)
          this.openEncryptDialog(row, route_success, poolName, addRecoveryKey);
      },
      (err) => {
        this.loader.close();
        this.dialogService.errorReport(T(`Error creating passphrase for pool ${poolName}`), err.reason, err.trace.formatted);
      });
    };

    openEncryptDialog(row, route_success, poolName, addRecoveryKey?) {
      let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});
      dialogRef.componentInstance.volumeId = row;
      dialogRef.componentInstance.fileName = 'pool_' + poolName + '_encryption.key';
      dialogRef.afterClosed().subscribe(result => {
        if (addRecoveryKey) {
          this.makeRecoveryKey(row, poolName, route_success);
        } else {
          this.router.navigate(new Array('/').concat(
            route_success));
          };
      });
    };
    
    makeRecoveryKey(row, poolName, route_success) {
      this.loader.open();
      const fileName = 'pool_' + poolName + '_recovery.key'
      this.ws.call('core.download', ['pool.recoverykey_add', [parseInt(row)], fileName]).subscribe((res) => {
        this.loader.close();
        this.dialogService.confirm(helptext.set_recoverykey_dialog_title, helptext.set_recoverykey_dialog_message, 
          true, helptext.set_recoverykey_dialog_button, false, '', '', '', '', true).subscribe(() => {
            const url = res[1];
            const mimetype = 'application/octet-stream';
            this.storage.streamDownloadFile(this.http, url, fileName, mimetype).subscribe(file => {
              this.storage.downloadBlob(file, fileName);
              this.router.navigate(new Array('/').concat(
                route_success));
            }, err => {
              this.dialogService.errorReport(helptext.addkey_download_failed_title, helptext.addkey_download_failed_message, err);
            });
          });
      }, (err) => {
        this.loader.close();
        this.dialogService.errorReport(T(`Error adding recovery key to pool ${poolName}`), err.reason, err.trace.formatted);
      });
    };

    deleteRecoveryKey(row, adminPassphrase, poolName, route_success) {
      this.dialogService.confirm(helptext.delete_recovery_key_title, helptext.delete_recovery_key_message, true, T('Delete Key'))
        .subscribe((res) => {
          if (res) {
            this.loader.open();
            this.ws.call('pool.recoverykey_rm', [parseInt(row), {'admin_password': adminPassphrase}]).subscribe(() => {
              this.loader.close();
              this.dialogService.Info(helptext.delete_recovery_key_title, T(`Recovery key deleted from pool <i>${poolName}</i>`), '300px', "info", true);
              this.router.navigate(new Array('/').concat(route_success));
            },
            (err) => {
              this.loader.close();
              this.dialogService.errorReport(T(`Error deleting recovery key for pool ${poolName}`), err.error.message, err.error.traceback);
            });
          }
        })
    };
}
