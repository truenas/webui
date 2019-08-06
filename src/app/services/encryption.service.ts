import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { WebSocketService } from 'app/services/';
import { DialogService } from 'app/services/dialog.service';
import { MatSnackBar, MatDialog } from '@angular/material';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { T } from 'app/translate-marker';
import { DownloadKeyModalDialog } from 'app/components/common/dialog/downloadkey/downloadkey-dialog.component';

@Injectable({
  providedIn: 'root'
})

export class EncryptionService {
    constructor(protected ws: WebSocketService, protected dialogService: DialogService,
        protected snackBar: MatSnackBar, protected loader: AppLoaderService,
        protected mdDialog: MatDialog, protected router: Router) {}


    setPassphrase(row, encryptKeyPassphrase, adminPassphrase, poolName, route_success, 
        addRecoveryKey?: boolean, downloadEncrytpKey?: boolean) {
        this.loader.open();
        this.ws.call('pool.passphrase', [parseInt(row), {'passphrase': encryptKeyPassphrase, 
          'admin_password': adminPassphrase}]).subscribe((res) => {
            this.loader.close();
            this.snackBar.open(T('Encryption reset & passphrase created for ') + poolName, T("Close"), {
              duration: 5000,
            });
            this.loader.close();
            addRecoveryKey ? this.makeRecoveryKey(row, poolName, route_success, downloadEncrytpKey) : this.openEncryptDialog(row, route_success);
          (err) => {
            this.loader.close();
            this.dialogService.errorReport(T("Error creating passphrase for pool ") + poolName, err.error.message, err.error.traceback);
          };
        })
      }
    
      makeRecoveryKey(row, poolName, route_success, downloadEncryptKey?) {
        this.loader.open();
        this.ws.call('core.download', ['pool.recoverykey_add', [parseInt(row)], 'pool_' + poolName + '_recovery.key']).subscribe((res) => {
          this.loader.close();
          this.snackBar.open(T("Encryption reset & recovery key added to ") + poolName, 'close', { duration: 5000 });
          this.dialogService.confirm(T('WARNING!'), 
            T('The recovery key can be used instead of the passphrase to unlock the pool. \
            Store the key in a secrure location! This key invalidates any previously downloaded recovery keys for this pool.'), 
            true, T('Download Recovery Key'), false, '', '', '', '', true).subscribe(() => {
              window.open(res[1]);
              downloadEncryptKey ? this.openEncryptDialog(row, route_success) : this.router.navigate(new Array('/').concat(
                route_success));
            })
        }, (res) => {
          this.loader.close();
          this.dialogService.errorReport(T("Error adding recovery key to pool."), res.reason, res.trace.formatted);
        });
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