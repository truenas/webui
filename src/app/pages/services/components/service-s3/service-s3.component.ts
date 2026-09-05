import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, map, of,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import {
  S3AuditMode,
  S3AuditOverflow,
  S3LogLevel,
  s3AuditAll,
  s3AuditModeLabels,
  s3AuditOverflowLabels,
  s3LogLevelLabels,
} from 'app/enums/s3.enum';
import { choicesToOptions, idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextSharingS3 } from 'app/helptext/sharing';
import { S3AuditMask, S3Config, S3Listener } from 'app/interfaces/s3.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { portRangeValidator, rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { createS3GrantFormGroup, S3GrantFormGroup, toS3Grants } from 'app/pages/sharing/s3/s3-grants-list/s3-grant-form-group';
import { S3GrantsListComponent } from 'app/pages/sharing/s3/s3-grants-list/s3-grants-list.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

type ListenerFormGroup = FormGroup<{
  address: FormControl<string>;
  port: FormControl<number>;
  tls: FormControl<boolean>;
}>;

const defaultPort = 9000;

@Component({
  selector: 'ix-service-s3',
  templateUrl: './service-s3.component.html',
  styleUrls: ['./service-s3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxListComponent,
    IxListItemComponent,
    WithManageCertificatesLinkComponent,
    S3GrantsListComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServiceS3Component implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private systemGeneralService = inject(SystemGeneralService);
  private store$ = inject(Store<AppState>);
  private destroyRef = inject(DestroyRef);
  slideInRef = inject<SlideInRef<undefined, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly helptext = helptextSharingS3;
  protected readonly isFormLoading = signal(false);
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly S3AuditMode = S3AuditMode;

  form = this.fb.group({
    listeners: this.fb.array<ListenerFormGroup>([]),
    certificate: [null as number | null],
    servers: [1, [Validators.required, rangeValidator(1, 8)]],
    region: [''],
    log_level: [S3LogLevel.Notice, Validators.required],
    global_grants: this.fb.array<S3GrantFormGroup>([]),
    default_audit_mode: [S3AuditMode.None],
    default_audit_actions: [[] as string[]],
    default_audit_overflow: [S3AuditOverflow.Drop],
  });

  protected readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  protected readonly logLevelOptions$ = of(mapToOptions(s3LogLevelLabels, this.translate));
  protected readonly auditOverflowOptions$ = of(mapToOptions(s3AuditOverflowLabels, this.translate));
  protected readonly auditActionOptions$ = this.api.call('sharing.s3.audit_choices').pipe(choicesToOptions());

  /**
   * The service default has no "inherit" to fall back on: an empty mask audits nothing.
   */
  protected readonly auditModeOptions$ = of(
    mapToOptions(s3AuditModeLabels, this.translate).filter((option) => option.value !== S3AuditMode.Inherit),
  );

  /**
   * Addresses currently configured stay selectable even if they are no longer offered, so an
   * existing listener is not silently dropped from the form.
   */
  protected readonly addressOptions$ = combineLatest([
    this.api.call('s3.bindip_choices').pipe(choicesToOptions()),
    this.api.call('s3.config'),
  ]).pipe(
    map(([options, config]) => {
      return [
        ...new Set<string>([
          ...config.listeners.map((listener) => listener.address),
          ...options.map((option) => String(option.value)),
        ]),
      ].map((value) => ({ label: value, value }));
    }),
  );

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => of(this.form.dirty));
  }

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.api.call('s3.config').pipe(
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (config) => {
        this.setConfigForEdit(config);
        this.isFormLoading.set(false);
      },
      error: () => this.isFormLoading.set(false),
    });
  }

  protected addListener(listener?: S3Listener): void {
    this.form.controls.listeners.push(this.fb.group({
      address: [listener?.address ?? '', Validators.required],
      port: [listener?.port ?? defaultPort, [Validators.required, portRangeValidator()]],
      tls: [listener?.tls ?? false],
    }));
  }

  protected removeListener(index: number): void {
    this.form.controls.listeners.removeAt(index);
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();
    const update = {
      listeners: values.listeners,
      certificate: values.certificate,
      servers: values.servers,
      region: values.region,
      log_level: values.log_level,
      global_grants: toS3Grants(this.form.controls.global_grants.controls),
      ...(this.isEnterprise()
        ? {
            default_audit: this.formToAuditMask(values.default_audit_mode, values.default_audit_actions),
            default_audit_overflow: values.default_audit_overflow,
          }
        : {}),
    };

    this.isFormLoading.set(true);
    this.api.call('s3.update', [update]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.isFormLoading.set(false);
        this.snackbar.success(this.translate.instant('Service configuration saved'));
        this.slideInRef.close({ response: true });
      },
      error: (error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private setConfigForEdit(config: S3Config): void {
    config.listeners.forEach((listener) => this.addListener(listener));
    config.global_grants.forEach((grant) => this.form.controls.global_grants.push(createS3GrantFormGroup(grant)));
    const [auditMode, auditActions] = this.auditMaskToForm(config.default_audit);
    this.form.patchValue({
      certificate: config.certificate,
      servers: config.servers,
      region: config.region,
      log_level: config.log_level,
      default_audit_mode: auditMode,
      default_audit_actions: auditActions,
      default_audit_overflow: config.default_audit_overflow,
    });
  }

  private auditMaskToForm(mask: S3AuditMask): [S3AuditMode, string[]] {
    if (mask === s3AuditAll) {
      return [S3AuditMode.All, []];
    }
    if (!mask.length) {
      return [S3AuditMode.None, []];
    }
    return [S3AuditMode.Selected, mask];
  }

  private formToAuditMask(mode: S3AuditMode, actions: string[]): S3AuditMask {
    switch (mode) {
      case S3AuditMode.All:
        return s3AuditAll;
      case S3AuditMode.Selected:
        return actions;
      default:
        return [];
    }
  }
}
