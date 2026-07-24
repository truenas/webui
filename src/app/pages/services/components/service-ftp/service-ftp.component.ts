import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { invertUmask } from 'app/helpers/mode.helper';
import { idNameArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextServiceFtp } from 'app/helptext/services/components/service-ftp';
import { FtpConfigUpdate } from 'app/interfaces/ftp-config.interface';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { portRangeValidator, rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { SidePanelFooterAction } from 'app/modules/slide-ins/form-side-panel/form-side-panel-container.component';
import { ignoreTranslation, translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-service-ftp',
  templateUrl: './service-ftp.component.html',
  styleUrls: ['./service-ftp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    IxExplorerComponent,
    IxPermissionsComponent,
    WithManageCertificatesLinkComponent,
    TnSelectComponent,
    TranslateModule,
    AsyncPipe,
    ExplorerCreateDatasetComponent,
  ],
})
export class ServiceFtpComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private systemGeneralService = inject(SystemGeneralService);
  private filesystemService = inject(FilesystemService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SharingFtpWrite];
  protected readonly InputType = InputType;

  protected readonly dataLoading = signal(false);
  protected readonly initialFormSnapshot = signal<Partial<FtpConfigUpdate> | null>(null);
  protected readonly isAdvancedMode = signal<boolean>(false);

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
  // tn-select does not translate option labels, so translate up-front.
  readonly tlsPolicyOptions = translateOptions(this.translate, helptextServiceFtp.tlsPolicyOptions);

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly isAnonymousLoginAllowed$ = this.form.select((values) => values.onlyanonymous);
  readonly isTlsEnabled$ = this.form.select((values) => values.tls);

  /**
   * The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). Re-read each
   * change detection, so the label flips with {@link isAdvancedMode}.
   */
  get footerActions(): SidePanelFooterAction[] {
    // Labels are extraction markers — the panel container pipes them through `translate`.
    return [{
      label: this.isAdvancedMode() ? T('Basic Options') : T('Advanced Options'),
      testId: 'toggle-advanced-options',
      onClick: () => this.onToggleAdvancedOptions(),
    }];
  }

  ngOnInit(): void {
    this.loadConfig();
    this.form.controls.tls.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tlsEnabled) => {
      if (!tlsEnabled) {
        this.form.controls.ssltls_certificate.patchValue(null);
      }
    });
  }

  protected handleSubmit = (): SubmitResult => {
    const values = {
      ...this.form.value,
      filemask: invertUmask(this.form.value.filemask),
      dirmask: invertUmask(this.form.value.dirmask),
      localuserbw: this.convertByteToKbyte(Number(this.form.value.localuserbw)),
      localuserdlbw: this.convertByteToKbyte(Number(this.form.value.localuserdlbw)),
      anonuserbw: this.convertByteToKbyte(Number(this.form.value.anonuserbw)),
      anonuserdlbw: this.convertByteToKbyte(Number(this.form.value.anonuserdlbw)),
    };

    return {
      request$: this.api.call('ftp.update', [values]),
      successMessage: this.translate.instant('Service configuration saved'),
      closeWith: () => true,
    };
  };

  onToggleAdvancedOptions(): void {
    this.isAdvancedMode.update((isAdvanced) => !isAdvanced);
  }

  private loadConfig(): void {
    this.dataLoading.set(true);
    this.api.call('ftp.config')
      .pipe(takeUntilDestroyed(this.destroyRef))
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
          this.initialFormSnapshot.set(this.form.getRawValue());
          this.dataLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.dataLoading.set(false);
        },
      });
  }

  private convertByteToKbyte(bytes: number): number {
    return bytes && bytes < 1024 ? 1 : bytes / 1024;
  }

  private convertKbyteToByte(value: number): number {
    return value * 1024;
  }

  protected readonly ignoreTranslation = ignoreTranslation;
}
