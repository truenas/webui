import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { invertUmask } from 'app/helpers/mode.helper';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-ftp';
import { portRangeValidator, rangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  templateUrl: './service-ftp.component.html',
  styleUrls: ['./service-ftp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceFtpComponent implements OnInit {
  isFormLoading = false;
  isAdvancedMode = false;

  form = this.formBuilder.group({
    port: [null as number, [portRangeValidator(), Validators.required]],
    clients: [null as number, [rangeValidator(1, 10000), Validators.required]],
    ipconnections: [null as number, [rangeValidator(0, 1000), Validators.required]],
    loginattempt: [null as number, [rangeValidator(0, 1000), Validators.required]],
    timeout_notransfer: [null as number, [rangeValidator(0, 10000), Validators.required]],
    timeout: [null as number, [rangeValidator(0, 10000), Validators.required]],
    ssltls_certificate: [null as number],
    defaultroot: [false],
    rootlogin: [false],
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
    tls_opt_no_cert_request: [false],
    tls_opt_no_empty_fragments: [false],
    tls_opt_no_session_reuse_required: [false],
    tls_opt_stdenvvars: [false],
    tls_opt_dns_name_required: [false],
    tls_opt_ip_address_required: [false],
    localuserbw: [null as number, Validators.required],
    localuserdlbw: [null as number, Validators.required],
    anonuserbw: [null as number, Validators.required],
    anonuserdlbw: [null as number, Validators.required],
    passiveportsmin: [null as number, [rangeValidator(0, 65535), Validators.required]],
    passiveportsmax: [null as number, [rangeValidator(0, 65535), Validators.required]],
    fxp: [false],
    resume: [false],
    reversedns: [false],
    masqaddress: [''],
    banner: [''],
    options: [''],
  });

  readonly helptext = helptext;

  readonly certificates$ = this.systemGeneralService.getCertificates().pipe(idNameArrayToOptions());
  readonly tlsPolicyOptions$ = of(helptext.tls_policy_options);
  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider();

  readonly isAnonymousLoginAllowed$ = this.form.select((values) => values.onlyanonymous);
  readonly isTlsEnabled$ = this.form.select((values) => values.tls);

  constructor(
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private filesystemService: FilesystemService,
    private translate: TranslateService,
    public iecFormatter: IxFormatterService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  onSubmit(): void {
    const values = {
      ...this.form.value,
      filemask: invertUmask(this.form.value.filemask),
      dirmask: invertUmask(this.form.value.dirmask),
    };

    this.isFormLoading = true;
    this.ws.call('ftp.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.router.navigate(['/services']);
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  onToggleAdvancedOptions(): void {
    this.isAdvancedMode = !this.isAdvancedMode;
  }

  onLinkClicked(): void {
    this.router.navigate(['/', 'credentials', 'certificates']);
  }

  private loadConfig(): void {
    this.isFormLoading = true;
    this.ws.call('ftp.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue({
            ...config,
            filemask: invertUmask(config.filemask),
            dirmask: invertUmask(config.dirmask),
          });
          this.isFormLoading = false;
          this.setRootLoginWarning();
          this.cdr.markForCheck();
        },
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private setRootLoginWarning(): void {
    this.form.controls['rootlogin'].valueChanges.pipe(
      filter(Boolean),
      switchMap(() => {
        return this.dialogService.confirm({
          title: helptext.rootlogin_dialog_title,
          message: helptext.rootlogin_dialog_message,
          buttonMsg: this.translate.instant('Continue'),
          cancelMsg: this.translate.instant('Cancel'),
        });
      }),
      untilDestroyed(this),
    ).subscribe((confirmed) => {
      if (confirmed) {
        return;
      }

      this.form.patchValue({
        rootlogin: false,
      });
    });
  }
}
