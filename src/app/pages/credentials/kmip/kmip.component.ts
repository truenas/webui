import { ChangeDetectionStrategy, Component, computed, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType,
  TnButtonComponent, TnCardComponent, TnCheckboxComponent, TnFormFieldComponent,
  TnFormSectionComponent, TnIconComponent, TnInputComponent, TnProgressBarComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { forkJoin } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { Role } from 'app/enums/role.enum';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemKmip } from 'app/helptext/system/kmip';
import { Option } from 'app/interfaces/option.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { kmipElements } from 'app/pages/credentials/kmip/kmip.elements';
import { EntitlementsService } from 'app/services/entitlements.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-kmip',
  templateUrl: './kmip.component.html',
  styleUrls: ['./kmip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    UiSearchDirective,
    TnProgressBarComponent,
    TnFormSectionComponent,
    TnIconComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    WithManageCertificatesLinkComponent,
    TranslateModule,
  ],
})
export class KmipComponent implements OnInit {
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private systemGeneralService = inject(SystemGeneralService);
  private snackbar = inject(SnackbarService);
  private destroyRef = inject(DestroyRef);

  protected isKmipEnabled = signal(false);
  protected isSyncPending = signal(false);
  protected isLoading = signal(false);
  protected readonly searchableElements = kmipElements;

  protected readonly form = this.formBuilder.group({
    server: [''],
    port: [null as number | null],
    certificate: [null as number | null],
    manage_sed_disks: [false],
    manage_zfs_keys: [false],
    enabled: [false],
    change_server: [false],
    validate: [false],
    force_clear: [false],
  });

  protected readonly requiredRoles = [Role.KmipWrite];
  protected readonly InputType = InputType;

  protected readonly helptext = helptextSystemKmip;
  protected readonly certificates = toSignal(
    this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions()),
    { initialValue: [] as Option<number>[] },
  );

  private readonly hasSedEntitlement = this.entitlements.entitled(EntitlementFeature.Sed);
  protected readonly allowSedManage = computed(() => Boolean(this.hasSedEntitlement()));

  ngOnInit(): void {
    this.loadKmipConfig();
  }

  protected onSyncKeysPressed(): void {
    this.isLoading.set(true);
    this.api.call('kmip.sync_keys').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.dialogService.info(
          helptextSystemKmip.syncInfoDialog.title,
          helptextSystemKmip.syncInfoDialog.info,
        );
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isLoading.set(false);
      },
    });
  }

  protected onClearSyncKeysPressed(): void {
    this.isLoading.set(true);
    this.api.call('kmip.clear_sync_pending_keys').pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.dialogService.info(
          helptextSystemKmip.clearSyncKeyInfoDialog.title,
          helptextSystemKmip.clearSyncKeyInfoDialog.info,
        );
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.isLoading.set(false);
      },
    });
  }

  protected onSubmit(): void {
    this.dialogService.jobDialog(
      this.api.job('kmip.update', [this.form.value]),
      { title: this.translate.instant(helptextSystemKmip.jobDialog.title) },
    )
      .afterClosed()
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Settings saved.'));
      });
  }

  private loadKmipConfig(): void {
    this.isLoading.set(true);
    forkJoin([
      this.api.call('kmip.config'),
      this.api.call('kmip.kmip_sync_pending'),
    ])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ([config, isSyncPending]) => {
          this.form.patchValue(config);
          this.isKmipEnabled.set(config.enabled);
          this.isSyncPending.set(isSyncPending);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
