import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { SnackbarService } from 'app/services/snackbar.service';

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
        protected snackBar: MatSnackBar, protected loader: AppLoaderService,
        protected mdDialog: MatDialog, protected router: Router, protected snackbarService: SnackbarService) {}

    setPassphrase(row, encryptKeyPassphrase, adminPassphrase, poolName, route_success, 
        addRecoveryKey?: boolean, downloadEncrytpKey?: boolean, success_message?) {
        this.loader.open();
        this.ws.call('pool.passphrase', [parseInt(row), {'passphrase': encryptKeyPassphrase, 
          'admin_password': adminPassphrase}]).subscribe(() => {
            this.loader.close();
            this.snackbarService.open(T(`Passphrase ${success_message} <i>${poolName}</i>`), T("Close"), {
              duration: 5000,
            });
            this.loader.close();
            addRecoveryKey ? this.makeRecoveryKey(row, poolName, route_success, downloadEncrytpKey) : this.openEncryptDialog(row, route_success);
        },
        (err) => {
          this.loader.close();
          this.dialogService.errorReport(T(`Error creating passphrase for pool ${poolName}`), err.reason, err.trace.formatted);
        });
      }
    
      makeRecoveryKey(row, poolName, route_success, downloadEncryptKey?) {
        this.loader.open();
        this.ws.call('core.download', ['pool.recoverykey_add', [parseInt(row)], 'pool_' + poolName + '_recovery.key']).subscribe((res) => {
          this.loader.close();
          this.snackbarService.open(T(`Recovery key added to pool <i>${poolName}</i>`), 'close', { duration: 5000 });
          this.dialogService.confirm(helptext.set_recoverykey_dialog_title, helptext.set_recoverykey_dialog_message, 
            true, helptext.set_recoverykey_dialog_button, false, '', '', '', '', true).subscribe(() => {
              window.open(res[1]);
              downloadEncryptKey ? this.openEncryptDialog(row, route_success) : this.router.navigate(new Array('/').concat(
                route_success));
            })
        }, (res) => {
          this.loader.close();
          this.dialogService.errorReport(T(`Error adding recovery key to pool ${poolName}`), res.reason, res.trace.formatted);
        });
      }

      deleteRecoveryKey(row, adminPassphrase, poolName, route_success) {
        this.dialogService.confirm(helptext.delete_recovery_key_title, helptext.delete_recovery_key_message, true, T('Delete Key'))
          .subscribe((res) => {
            if (res) {
              this.loader.open();
              this.ws.call('pool.recoverykey_rm', [parseInt(row), {'admin_password': adminPassphrase}]).subscribe(() => {
                this.loader.close();
                this.snackbarService.open(T(`Recovery key deleted from pool <i>${poolName}</i>`), 'close', { duration: 5000 });
                this.router.navigate(new Array('/').concat(route_success));
              },
              (err) => {
                this.loader.close();
                this.dialogService.errorReport(T(`Error deleting recovery key for pool ${poolName}`), err.error.message, err.error.traceback);
              });
            }
          })
      }

      openEncryptDialog(row, route_success) {
        let dialogRef = this.mdDialog.open(DownloadKeyModalDialog, {disableClose:true});
        dialogRef.componentInstance.volumeId = row;
        dialogRef.afterClosed().subscribe(result => {
          this.router.navigate(new Array('/').concat(
          route_success));
        })
      }
}