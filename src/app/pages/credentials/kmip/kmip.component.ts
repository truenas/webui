import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
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

  protected readonly requiredRoles = [Role.KmipWrite];

  readonly helptext = helptextSystemKmip;
  readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  readonly certificateAuthorities$ = this.systemGeneralService.getCertificateAuthorities().pipe(idNameArrayToOptions());

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
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
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
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
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  onSubmit(): void {
    this.dialogService.jobDialog(
      this.ws.job('kmip.update', [this.form.value as KmipConfigUpdate]),
      { title: this.translate.instant(helptextSystemKmip.jobDialog.title) },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Settings saved.'));
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
        error: (error: unknown) => {
          this.isLoading = false;
          this.dialogService.error(this.errorHandler.parseError(error));
          this.cdr.markForCheck();
        },
      });
  }
}
