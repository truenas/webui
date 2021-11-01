import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import {
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import helptext from 'app/helptext/services/components/service-webdav';
import { Option } from 'app/interfaces/option.interface';
import { WebdavConfig, WebdavConfigUpdate } from 'app/interfaces/webdav-config.interface';
import { EntityUtils } from 'app/pages/common/entity/utils';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import {
  SystemGeneralService, WebSocketService, ValidationService, DialogService, AppLoaderService,
} from 'app/services';

@UntilDestroy()
@Component({
  selector: 'webdav-edit',
  templateUrl: './service-webdav.component.html',
  styleUrls: ['./service-webdav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceWebdavComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    protocol: [''],
    tcpport: [null as number, [Validators.min(1), Validators.max(65535)]],
    tcpportssl: [null as number, [Validators.min(1), Validators.max(65535)]],
    certssl: [null as any],
    htauth: [''],
    password: [''],
    password2: ['', [this.validationService.matchOtherValidator('password')]],
  });

  readonly helptext = helptext;

  protocol: {
    readonly fcName: 'protocol';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
    fcName: 'protocol',
    label: helptext.protocol_placeholder,
    tooltip: helptext.protocol_tooltip,
    options: of(helptext.protocol_options),
  };

  tcpport: {
    readonly fcName: 'tcpport';
    label: string;
    tooltip: string;
    hidden: boolean;
  } = {
    fcName: 'tcpport',
    label: helptext.tcpport_placeholder,
    tooltip: helptext.tcpport_tooltip,
    hidden: false,
  };

  tcpportssl: {
    readonly fcName: 'tcpportssl';
    label: string;
    tooltip: string;
    hidden: boolean;
  } = {
    fcName: 'tcpportssl',
    label: helptext.tcpportssl_placeholder,
    tooltip: helptext.tcpportssl_tooltip,
    hidden: false,
  };

  certssl: {
    readonly fcName: 'certssl';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
    hidden: boolean;
  } = {
    fcName: 'certssl',
    label: helptext.certssl_placeholder,
    tooltip: helptext.certssl_tooltip,
    options: this.systemGeneralService.getCertificates().pipe(
      map((certificates) => {
        const options = certificates.map((certificate) => ({
          label: certificate.name,
          value: certificate.id,
        }));

        return [
          { label: '---', value: null },
          ...options,
        ];
      }),
    ),
    hidden: false,
  };

  htauth: {
    readonly fcName: 'htauth';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
    fcName: 'htauth',
    label: helptext.htauth_placeholder,
    tooltip: helptext.htauth_tooltip,
    options: of(helptext.htauth_options),
  };

  password: {
    readonly fcName: 'password';
    label: string;
    tooltip: string;
  } = {
    fcName: 'password',
    label: helptext.password_placeholder,
    tooltip: helptext.password_tooltip,
  };

  password2: {
    readonly fcName: 'password2';
    label: string;
  } = {
    fcName: 'password2',
    label: helptext.password2_placeholder,
  };

  pwdRequired = true;

  constructor(
    private fb: FormBuilder,
    protected router: Router,
    protected route: ActivatedRoute,
    protected ws: WebSocketService,
    protected systemGeneralService: SystemGeneralService,
    protected validationService: ValidationService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private loader: AppLoaderService,
    private errorHandler: FormErrorHandlerService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.loader.open();

    this.ws.call('webdav.config').pipe(untilDestroyed(this)).subscribe(
      (config: WebdavConfig) => {
        this.form.patchValue(config);
        this.isFormLoading = false;
        this.loader.close();
        this.cdr.markForCheck();
      },
      (error) => {
        this.isFormLoading = false;
        this.loader.close();
        new EntityUtils().handleWSError(null, error, this.dialogService);
      },
    );
  }

  onChangeProtocal(value: string): void {
    switch (value) {
      case 'HTTP':
        this.tcpport.hidden = false;
        this.tcpportssl.hidden = true;
        this.certssl.hidden = true;
        break;
      case 'HTTPS':
        this.tcpport.hidden = true;
        this.tcpportssl.hidden = false;
        this.certssl.hidden = false;
        break;
      case 'HTTPHTTPS':
        this.tcpport.hidden = false;
        this.tcpportssl.hidden = false;
        this.certssl.hidden = false;
        break;
      default:
        break;
    }
  }

  onChangeHtAuth(value: string): void {
    if (value === 'NONE') {
      this.form.controls.password.setValue('');
      this.form.controls.password2.setValue('');
      this.pwdRequired = false;
    } else {
      this.pwdRequired = true;
    }
  }

  onSubmit(): void {
    this.isFormLoading = true;
    this.loader.open();

    const values = this.form.value;
    delete values.password2;
    this.ws.call('webdav.update', [values] as [WebdavConfigUpdate]).pipe(untilDestroyed(this)).subscribe(() => {
      this.isFormLoading = false;
      this.loader.close();
      this.router.navigate(['/', 'services']);
    }, (error) => {
      this.isFormLoading = false;
      this.loader.close();
      this.errorHandler.handleWsFormError(error, this.form);
      this.cdr.markForCheck();
    });
  }

  cancel(): void {
    this.router.navigate(['/', 'services']);
  }
}
