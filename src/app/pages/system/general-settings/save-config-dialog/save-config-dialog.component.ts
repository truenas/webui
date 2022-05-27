import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { switchMap } from 'rxjs/operators';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { EntityUtils } from 'app/modules/entity/utils';
import {
  AppLoaderService, DialogService, StorageService, WebSocketService,
} from 'app/services';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  templateUrl: './save-config-dialog.component.html',
  styleUrls: ['./save-config-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaveConfigDialogComponent {
  exportSeedCheckbox = new FormControl(false);

  readonly helptext = helptext;

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private storage: StorageService,
    private loader: AppLoaderService,
    private datePipe: DatePipe,
    private dialogRef: MatDialogRef<SaveConfigDialogComponent>,
    private dialog: DialogService,
  ) {}

  onSubmit(): void {
    this.loader.open();

    this.store$.pipe(
      waitForSystemInfo,
      switchMap((systemInfo) => {
        const hostname = systemInfo.hostname.split('.')[0];
        const date = this.datePipe.transform(new Date(), 'yyyyMMddHHmmss');
        let fileName = hostname + '-' + systemInfo.version + '-' + date;
        let mimeType: string;

        if (this.exportSeedCheckbox.value) {
          mimeType = 'application/x-tar';
          fileName += '.tar';
        } else {
          mimeType = 'application/x-sqlite3';
          fileName += '.db';
        }

        return this.ws.call('core.download', ['config.save', [{ secretseed: this.exportSeedCheckbox.value }], fileName]).pipe(
          switchMap(([, url]) => this.storage.downloadUrl(url, fileName, mimeType)),
        );
      }),
      untilDestroyed(this),
    ).subscribe(
      () => {
        this.loader.close();
        this.dialogRef.close();
      },
      (error) => {
        new EntityUtils().handleWsError(this, error, this.dialog);
        this.loader.close();
        this.dialogRef.close();
      },
    );
  }
}
