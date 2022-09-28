import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import {
  AbstractControl, ValidationErrors, ValidatorFn, Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-s3';
import { numberValidator } from 'app/modules/entity/entity-form/validators/number-validation';
import { regexValidator } from 'app/modules/entity/entity-form/validators/regex-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, SystemGeneralService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';

@UntilDestroy()
@Component({
  templateUrl: './service-s3.component.html',
  styleUrls: ['./service-s3.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceS3Component implements OnInit {
  isFormLoading = false;

  readonly tlsServerUriRequiredIfCertificateNotNull: { forProperty: 'required'; validatorFn: () => ValidatorFn } = {
    forProperty: 'required',
    validatorFn: (): ValidatorFn => {
      return (control: AbstractControl): ValidationErrors => {
        if (!control.parent) {
          return null;
        }

        if (control.parent.get('certificate').value !== null && (control.value === '' || control.value === null)) {
          return { required: true };
        }

        return null;
      };
    },
  };

  form = this.fb.group({
    bindip: [''],
    bindport: [
      null as number,
      [numberValidator(), Validators.min(1), Validators.max(65535), Validators.required],
    ],
    access_key: [
      '',
      [Validators.minLength(5), Validators.maxLength(20), Validators.required, regexValidator(/^\w+$/)],
    ],
    secret_key: [
      '',
      [Validators.minLength(8), Validators.maxLength(40), regexValidator(/^\w+$/)],
    ],
    storage_path: ['', Validators.required],
    browser: [false],
    certificate: [null as number],
    console_bindport: [
      9001 as number,
      [numberValidator(), Validators.min(1), Validators.max(65535), Validators.required]],
    tls_server_uri: [''],
  });

  readonly tooltips = {
    bindip: helptext.bindip_tooltip,
    bindport: helptext.bindport_tooltip,
    access_key: helptext.access_key_tooltip,
    secret_key: helptext.secret_key_tooltip,
    storage_path: helptext.storage_path_tooltip,
    browser: helptext.browser_tooltip,
    certificate: helptext.certificate_tooltip,
  };

  readonly treeNodeProvider = this.filesystemService.getFilesystemNodeProvider({ directoriesOnly: true });
  readonly bindIpOptions$ = this.ws.call('s3.bindip_choices').pipe(choicesToOptions());
  readonly certificateOptions$ = this.systemGeneralService.getCertificates().pipe(
    map((certificates) => {
      return certificates.map((certificate) => ({
        label: certificate.name,
        value: certificate.id,
      }));
    }),
  );

  private initialPath: string;
  private warned = false;

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private systemGeneralService: SystemGeneralService,
    private dialog: DialogService,
    private router: Router,
    private filesystemService: FilesystemService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.ws.call('s3.config').pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        this.form.patchValue(config, { emitEvent: false });
        this.initialPath = config.storage_path;
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error, this.dialog);
        this.cdr.markForCheck();
      },
    });

    this.form.controls['storage_path'].valueChanges.pipe(untilDestroyed(this)).subscribe((newPath) => {
      if (!newPath || newPath === this.initialPath || this.warned) {
        return;
      }

      this.dialog
        .confirm({
          title: helptext.path_warning_title,
          message: helptext.path_warning_msg,
        })
        .pipe(untilDestroyed(this))
        .subscribe((confirmed) => {
          if (!confirmed) {
            this.form.patchValue({ storage_path: this.initialPath });
          }

          this.warned = true;
        });
    });

    this.form.get('certificate').value$.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value !== null) {
        this.form.get('tls_server_uri').addValidators([this.tlsServerUriRequiredIfCertificateNotNull.validatorFn()]);
      } else {
        this.form.get('tls_server_uri').removeValidators(this.tlsServerUriRequiredIfCertificateNotNull.validatorFn());
      }
    });
  }

  certificatesLinkClicked(): void {
    this.router.navigate(['/', 'credentials', 'certificates']);
  }

  onSubmit(): void {
    const values = this.form.value;

    if (values.certificate === null) {
      delete values.tls_server_uri;
    }

    this.isFormLoading = true;
    this.ws.call('s3.update', [values])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.router.navigate(['/services']);
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }

  onCancel(): void {
    this.router.navigate(['/services']);
  }
}
