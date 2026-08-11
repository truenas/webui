import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule } from '@angular/forms';
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
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { portRangeValidator, rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import {
  advancedModeFooterAction, SidePanelFooterAction,
} from 'app/modules/slide-ins/form-side-panel/side-panel-footer-actions';
import { ignoreTranslation, translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createFtpForm(formBuilder: FormBuilder) {
  return formBuilder.group({
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
}

/**
 * The form's own value shape, which is NOT `FtpConfigUpdate`: `filemask`/`dirmask` hold
 * pre-{@link invertUmask} values and the bandwidth controls are in bytes where the API takes KB
 * (all reshaped in {@link ServiceFtpComponent.handleSubmit}).
 */
type FtpFormValue = ReturnType<ReturnType<typeof createFtpForm>['getRawValue']>;

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
export class ServiceFtpComponent extends IxFormHostForm<boolean, FtpFormValue> implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private systemGeneralService = inject(SystemGeneralService);
  private filesystemService = inject(FilesystemService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly requiredRoles = [Role.SharingFtpWrite];
  protected readonly InputType = InputType;

  protected readonly isAdvancedMode = signal(false);

  protected readonly form = createFtpForm(this.formBuilder);

  readonly helptext = helptextServiceFtp;

  readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  // tn-select does not translate option labels, so translate up-front.
  readonly tlsPolicyOptions = translateOptions(this.translate, helptextServiceFtp.tlsPolicyOptions);

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly isAnonymousLoginAllowed$ = this.form.select((values) => values.onlyanonymous);
  readonly isTlsEnabled$ = this.form.select((values) => values.tls);

  /** The Advanced/Basic toggle rendered in the `<tn-side-panel>` footer (before Save). */
  private readonly advancedToggle = advancedModeFooterAction(this.isAdvancedMode);

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  get footerActions(): SidePanelFooterAction[] {
    return this.advancedToggle();
  }

  ngOnInit(): void {
    this.loadConfig();
    this.form.controls.tls.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((tlsEnabled) => {
      if (!tlsEnabled) {
        this.form.controls.ssltls_certificate.patchValue(null);
      }
    });
  }

  protected handleSubmit = ({ allValues }: FormSubmitEvent<FtpFormValue>): SubmitResult => {
    const values = {
      ...allValues,
      filemask: invertUmask(allValues.filemask),
      dirmask: invertUmask(allValues.dirmask),
      localuserbw: this.convertByteToKbyte(Number(allValues.localuserbw)),
      localuserdlbw: this.convertByteToKbyte(Number(allValues.localuserdlbw)),
      anonuserbw: this.convertByteToKbyte(Number(allValues.anonuserbw)),
      anonuserdlbw: this.convertByteToKbyte(Number(allValues.anonuserdlbw)),
    };

    return {
      request$: this.api.call('ftp.update', [values]),
      successMessage: this.translate.instant(serviceConfigSavedMessage),
    };
  };

  private loadConfig(): void {
    this.loadFormConfig(this.api.call('ftp.config'), (config) => {
      this.form.patchValue({
        ...config,
        filemask: invertUmask(config.filemask),
        dirmask: invertUmask(config.dirmask),
        localuserbw: this.convertKbyteToByte(config.localuserbw),
        localuserdlbw: this.convertKbyteToByte(config.localuserdlbw),
        anonuserbw: this.convertKbyteToByte(config.anonuserbw),
        anonuserdlbw: this.convertKbyteToByte(config.anonuserdlbw),
      });
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
