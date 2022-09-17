import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/services/components/service-webdav';
import { WebdavConfig, WebdavConfigUpdate, WebdavProtocol } from 'app/interfaces/webdav-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService, ValidationService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './service-webdav.component.html',
  styleUrls: ['./service-webdav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceWebdavComponent implements OnInit {
  isFormLoading = false;
  pwdRequired = true;

  form = this.fb.group({
    protocol: [null as WebdavProtocol],
    tcpport: [null as number, [Validators.min(1), Validators.max(65535)]],
    tcpportssl: [null as number, [Validators.min(1), Validators.max(65535)]],
    certssl: [null as number | string],
    htauth: [''],
    password: [''],
    password2: ['', [this.validationService.matchOtherValidator('password')]],
  });

  readonly helptext = helptext;

  protocol = {
    fcName: 'protocol',
    label: helptext.protocol_placeholder,
    tooltip: helptext.protocol_tooltip,
    options: of(helptext.protocol_options),
  };

  tcpport = {
    fcName: 'tcpport',
    label: helptext.tcpport_placeholder,
    tooltip: helptext.tcpport_tooltip,
    hidden: false,
  };

  tcpportssl = {
    fcName: 'tcpportssl',
    label: helptext.tcpportssl_placeholder,
    tooltip: helptext.tcpportssl_tooltip,
    hidden: false,
  };

  certssl = {
    fcName: 'certssl',
    label: helptext.certssl_placeholder,
    tooltip: helptext.certssl_tooltip,
    options: this.ws.call('webdav.cert_choices').pipe(
      map((certificates) => {
        const certKeys = Object.keys(certificates);
        return certKeys.map((key) => ({
          label: certificates[key],
          value: Number(key),
        }));
      }),
    ),
    hidden: false,
  };

  htauth = {
    fcName: 'htauth',
    label: helptext.htauth_placeholder,
    tooltip: helptext.htauth_tooltip,
    options: of(helptext.htauth_options),
  };

  password = {
    fcName: 'password',
    label: helptext.password_placeholder,
    tooltip: helptext.password_tooltip,
  };

  password2 = {
    fcName: 'password2',
    label: helptext.password2_placeholder,
  };

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    protected ws: WebSocketService,
    protected validationService: ValidationService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;

    this.ws.call('webdav.config').pipe(untilDestroyed(this)).subscribe({
      next: (config: WebdavConfig) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error, this.dialogService);
        this.cdr.markForCheck();
      },
    });

    this.form.controls.protocol.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: WebdavProtocol) => {
        switch (value) {
          case WebdavProtocol.Http:
            this.tcpport.hidden = false;
            this.tcpportssl.hidden = true;
            this.certssl.hidden = true;
            break;
          case WebdavProtocol.Https:
            this.tcpport.hidden = true;
            this.tcpportssl.hidden = false;
            this.certssl.hidden = false;
            break;
          case WebdavProtocol.HttpHttps:
            this.tcpport.hidden = false;
            this.tcpportssl.hidden = false;
            this.certssl.hidden = false;
            break;
          default:
            break;
        }
      },
    );

    this.form.controls.htauth.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: string) => {
        if (value === 'NONE') {
          this.form.controls.password.setValue('');
          this.form.controls.password2.setValue('');
          this.pwdRequired = false;
        } else {
          this.pwdRequired = true;
        }
      },
    );
  }

  certificatesLinkClicked(): void {
    this.router.navigate(['/', 'credentials', 'certificates']);
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const values = this.form.value;
    delete values.password2;
    this.ws.call('webdav.update', [values] as [WebdavConfigUpdate]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.router.navigate(['/', 'services']);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/', 'services']);
  }
}
