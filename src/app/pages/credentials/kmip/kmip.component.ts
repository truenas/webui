import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatProgressBar } from '@angular/material/progress-bar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { KmipConfigUpdate } from 'app/interfaces/kmip-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { kmipElements } from 'app/pages/credentials/kmip/kmip.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-kmip',
  templateUrl: './kmip.component.html',
  styleUrls: ['./kmip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatProgressBar,
    MatCardContent,
    IxFieldsetComponent,
    IxIconComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    ReactiveFormsModule,
    IxInputComponent,
    WithManageCertificatesLinkComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    TranslateModule,
  ],
})
export class KmipComponent implements OnInit {
  isKmipEnabled = false;
  isSyncPending = false;
  isLoading = false;
  protected readonly searchableElements = kmipElements;

  form = this.formBuilder.group({
    server: [''],
    port: [null as number | null],
    certificate: [null as number | null],
    certificate_authority: [null as number | null],
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

  protected readonly hasGlobalEncryption = toSignal(this.api.call('system.advanced.sed_global_password_is_set'));
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly allowSedManage = computed(() => this.isEnterprise() || this.hasGlobalEncryption());

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private snackbar: SnackbarService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.loadKmipConfig();
  }

  onSyncKeysPressed(): void {
    this.isLoading = true;
    this.api.call('kmip.sync_keys').pipe(untilDestroyed(this)).subscribe({
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
    this.api.call('kmip.clear_sync_pending_keys').pipe(untilDestroyed(this)).subscribe({
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
      this.api.job('kmip.update', [this.form.value as KmipConfigUpdate]),
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
      this.api.call('kmip.config'),
      this.api.call('kmip.kmip_sync_pending'),
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
