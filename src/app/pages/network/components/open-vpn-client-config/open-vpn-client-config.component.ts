import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-openvpn';
import { OpenvpnClientConfigUpdate } from 'app/interfaces/openvpn-client-config.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, ServicesService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './open-vpn-client-config.component.html',
  styleUrls: ['./open-vpn-client-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenVpnClientConfigComponent implements OnInit {
  isLoading = false;

  form = this.formBuilder.group({
    client_certificate: [null as number],
    root_ca: [null as number],
    remote: ['', Validators.required],
    port: [null as number],
    authentication_algorithm: [''],
    cipher: [''],
    compression: [''],
    protocol: [''],
    device_type: [null as string],
    nobind: [true],
    tls_crypt_auth_enabled: [false],
    additional_parameters: [''],
    tls_crypt_auth: [''],
  });

  readonly title = helptext.client.formTitle;

  readonly tooltips = {
    client_certificate: helptext.certificate.tooltip,
    root_ca: helptext.root_ca.tooltip,
    remote: helptext.client.remote.tooltip,
    port: helptext.port.tooltip,
    authentication_algorithm: helptext.authentication_algorithm.tooltip,
    cipher: helptext.cipher.tooltip,
    compression: helptext.compression.tooltip,
    protocol: helptext.protocol.tooltip,
    device_type: helptext.device_type.tooltip,
    nobind: helptext.client.nobind.tooltip,
    tls_crypt_auth_enabled: helptext.tls_crypt_auth_enabled.tooltip,
    additional_parameters: helptext.additional_parameters.tooltip,
    tls_crypt_auth: helptext.client.tls_crypt_auth.tooltip,
  };

  readonly placeholders = {
    remote: helptext.client.remote.placeholder,
    port: helptext.port.placeholder,
    additional_parameters: helptext.additional_parameters.placeholder,
    tls_crypt_auth: helptext.client.tls_crypt_auth.placeholder,
  };

  readonly clientCertificates$ = this.services.getCerts().pipe(idNameArrayToOptions());
  readonly rootAuthorities$ = this.services.getCertificateAuthorities().pipe(idNameArrayToOptions());
  readonly authenticationAlgorithms$ = this.services.getOpenVpnClientAuthAlgorithmChoices().pipe(map((choices) => {
    const options = Object.entries(choices).map(([algo, description]) => {
      return { label: `${algo} (${description})`, value: algo };
    });
    return [
      { label: '---', value: null },
      ...options,
    ];
  }));
  readonly ciphers$ = this.services.getOpenVpnClientCipherChoices().pipe(map((choices) => {
    const options = Object.entries(choices).map(([algo, description]) => {
      return { label: `${algo} ${description}`, value: algo };
    });
    return [
      { label: '---', value: null },
      ...options,
    ];
  }));
  readonly compressionOptions$ = of(helptext.compression.enum);
  readonly protocols$ = of(helptext.protocol.enum);
  readonly deviceTypes$ = of(helptext.device_type.enum);

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private services: ServicesService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  onSubmit(): void {
    this.isLoading = true;

    this.ws.call('openvpn.client.update', [this.form.value as OpenvpnClientConfigUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInService.close();
        },
        error: (error) => {
          this.errorHandler.handleWsFormError(error, this.form);
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  private loadConfig(): void {
    this.isLoading = true;
    this.ws.call('openvpn.client.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue({
            ...config,
          });
          this.isLoading = false;
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.isLoading = false;
          this.cdr.markForCheck();
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }

  certificatesLinkClicked(): void {
    this.slideInService.close(null, false);
    this.router.navigate(['/', 'credentials', 'certificates']);
  }
}
