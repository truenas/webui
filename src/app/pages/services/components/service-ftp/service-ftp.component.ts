import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit,
  signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { invertUmask } from 'app/helpers/mode.helper';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceFtp } from 'app/helptext/services/components/service-ftp';
import { FtpConfigUpdate } from 'app/interfaces/ftp-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { portRangeValidator, rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-service-ftp',
  templateUrl: './service-ftp.component.html',
  styleUrls: ['./service-ftp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxExplorerComponent,
    IxPermissionsComponent,
    WithManageCertificatesLinkComponent,
    IxSelectComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class ServiceFtpComponent implements OnInit {
  protected readonly requiredRoles = [Role.SharingFtpWrite];

  protected isFormLoading = signal(false);
  isAdvancedMode = false;

  kibParser = (value: string): number | null => this.iecFormatter.memorySizeParsing(value, 'KiB');

  form = this.formBuilder.group({
    port: new FormControl(null as number | null, [portRangeValidator(), Validators.required]),
    clients: new FormControl(null as number | null, [rangeValidator(1, 10000), Validators.required]),
    ipconnections: new FormControl(null as number | null, [rangeValidator(0, 1000), Validators.required]),
    loginattempt: new FormControl(null as number | null, [rangeValidator(0, 1000), Validators.required]),
    timeout_notransfer: new FormControl(null as number | null, [rangeValidator(0, 10000), Validators.required]),
    timeout: new FormControl(null as number | null, [rangeValidator(0, 10000), Validators.required]),
    ssltls_certificate: new FormControl(null as number | null),
    defaultroot: [false],
    onlyanonymous: [false],
    anonpath: [''],
    onlylocal: [false],
    ident: [false],
    filemask: [''],
    dirmask: [''],
    tls: [false],
    tls_policy: [''],
    tls_opt_allow_client_renegotiations: [false],
    tls_opt_allow_dot_login: [false],
    tls_opt_allow_per_user: [false],
    tls_opt_common_name_required: [false],
    tls_opt_enable_diags: [false],
    tls_opt_export_cert_data: [false],
    tls_opt_no_empty_fragments: [false],
    tls_opt_no_session_reuse_required: [false],
    tls_opt_stdenvvars: [false],
    tls_opt_dns_name_required: [false],
    tls_opt_ip_address_required: [false],
    localuserbw: new FormControl(null as number | null, Validators.required),
    localuserdlbw: new FormControl(null as number | null, Validators.required),
    anonuserbw: new FormControl(null as number | null, Validators.required),
    anonuserdlbw: new FormControl(null as number | null, Validators.required),
    passiveportsmin: new FormControl(null as number | null, [rangeValidator(0, 65535), Validators.required]),
    passiveportsmax: new FormControl(null as number | null, [rangeValidator(0, 65535), Validators.required]),
    fxp: [false],
    resume: [false],
    reversedns: [false],
    masqaddress: [''],
    banner: [''],
    options: [''],
  });

  readonly helptext = helptextServiceFtp;

  readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  readonly tlsPolicyOptions$ = of(helptextServiceFtp.tls_policy_options);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly isAnonymousLoginAllowed$ = this.form.select((values) => values.onlyanonymous);
  readonly isTlsEnabled$ = this.form.select((values) => values.tls);

  constructor(
    private formBuilder: FormBuilder,
    private api: ApiService,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
    private systemGeneralService: SystemGeneralService,
    private filesystemService: FilesystemService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    public iecFormatter: IxFormatterService,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.loadConfig();
    this.form.controls.tls.valueChanges.pipe(untilDestroyed(this)).subscribe((tlsEnabled) => {
      if (!tlsEnabled) {
        this.form.controls.ssltls_certificate.patchValue(null);
      }
    });
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
      filemask: invertUmask(this.form.value.filemask),
      dirmask: invertUmask(this.form.value.dirmask),
      localuserbw: this.convertByteToKbyte(Number(this.form.value.localuserbw)),
      localuserdlbw: this.convertByteToKbyte(Number(this.form.value.localuserdlbw)),
      anonuserbw: this.convertByteToKbyte(Number(this.form.value.anonuserbw)),
      anonuserdlbw: this.convertByteToKbyte(Number(this.form.value.anonuserdlbw)),
    } as FtpConfigUpdate;

    this.isFormLoading.set(true);
    this.api.call('ftp.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.snackbar.success(this.translate.instant('Service configuration saved'));
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  onToggleAdvancedOptions(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  private loadConfig(): void {
    this.isFormLoading.set(true);
    this.api.call('ftp.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue({
            ...config,
            filemask: invertUmask(config.filemask),
            dirmask: invertUmask(config.dirmask),
            localuserbw: this.convertKbyteToByte(config.localuserbw),
            localuserdlbw: this.convertKbyteToByte(config.localuserdlbw),
            anonuserbw: this.convertKbyteToByte(config.anonuserbw),
            anonuserdlbw: this.convertKbyteToByte(config.anonuserdlbw),
          });
          this.isFormLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.isFormLoading.set(false);
        },
      });
  }

  private convertByteToKbyte(bytes: number): number {
    return bytes && bytes < 1024 ? 1 : bytes / 1024;
  }

  private convertKbyteToByte(value: number): number {
    return value * 1024;
  }
}
