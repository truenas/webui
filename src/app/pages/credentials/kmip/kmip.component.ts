import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './kmip.component.html',
  styleUrls: ['./kmip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KmipComponent implements OnInit {
  isKmipEnabled = false;
  isSyncPending = false;
  isLoading = false;

  form = this.formBuilder.group({
    server: [''],
    port: [null as number],
    certificate: [null as number],
    certificate_authority: [null as number],
    manage_sed_disks: [false],
    manage_zfs_keys: [false],
    enabled: [false],
    change_server: [false],
    validate: [false],
    force_clear: [false],
  });

  readonly helptext = helptextSystemKmip;
  readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  readonly certificateAuthorities$ = this.systemGeneralService.getCertificateAuthorities().pipe(idNameArrayToOptions());

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private snackbar: SnackbarService,
  ) {}

  ngOnInit(): void {
    this.loadKmipConfig();
  }

  onSyncKeysPressed(): void {
    this.isLoading = true;
    this.ws.call('kmip.sync_keys').pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.dialogService.info(
          helptextSystemKmip.syncInfoDialog.title,
          helptextSystemKmip.syncInfoDialog.info,
        );
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(err));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onClearSyncKeysPressed(): void {
    this.isLoading = true;
    this.ws.call('kmip.clear_sync_pending_keys').pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.dialogService.info(
          helptextSystemKmip.clearSyncKeyInfoDialog.title,
          helptextSystemKmip.clearSyncKeyInfoDialog.info,
        );
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (err: WebsocketError) => {
        this.dialogService.error(this.errorHandler.parseWsError(err));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    const dialogRef = this.matDialog.open(EntityJobComponent, {
      data: { title: helptextSystemKmip.jobDialog.title },
      disableClose: true,
    });
    dialogRef.componentInstance.setCall('kmip.update', [this.form.value as KmipConfigUpdate]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.snackbar.success(this.translate.instant('Settings saved.'));
      dialogRef.close(true);
    });
  }

  private loadKmipConfig(): void {
    this.isLoading = true;
    forkJoin([
      this.ws.call('kmip.config'),
      this.ws.call('kmip.kmip_sync_pending'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ([config, isSyncPending]) => {
          this.form.patchValue(config);
          this.isKmipEnabled = config.enabled;
          this.isSyncPending = isSyncPending;
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.isLoading = false;
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.cdr.markForCheck();
        },
      });
  }
}
