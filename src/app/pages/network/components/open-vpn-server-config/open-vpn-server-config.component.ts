import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { OpenVpnDeviceType } from 'app/enums/open-vpn-device-type.enum';
import { idNameArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/services/components/service-openvpn';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import {
  DownloadClientConfigModalComponent,
} from 'app/pages/network/components/download-client-config-modal/download-client-config-modal.component';
import {
  AppLoaderService, DialogService, ServicesService, StorageService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy({ arrayName: 'subscriptions' })
@Component({
  templateUrl: './open-vpn-server-config.component.html',
  styleUrls: ['./open-vpn-server-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenVpnServerConfigComponent implements OnInit {
  isLoading = false;

  form = this.formBuilder.group({
    server_certificate: [null as number, Validators.required],
    root_ca: [null as number, Validators.required],
    server: ['', Validators.required],
    port: [null as number],
    authentication_algorithm: [''],
    cipher: [''],
    compression: [''],
    protocol: [''],
    device_type: [null as OpenVpnDeviceType],
    topology: [''],
    tls_crypt_auth_enabled: [false],
    additional_parameters: [''],
    tls_crypt_auth: [''],
  });

  readonly tooltips = {
    server_certificate: helptext.certificate.tooltip,
    root_ca: helptext.root_ca.tooltip,
    server: helptext.server.server.tooltip,
    port: helptext.port.tooltip,
    authentication_algorithm: helptext.authentication_algorithm.tooltip,
    cipher: helptext.cipher.tooltip,
    compression: helptext.compression.tooltip,
    protocol: helptext.protocol.tooltip,
    device_type: helptext.device_type.tooltip,
    topology: helptext.server.topology.tooltip,
    tls_crypt_auth_enabled: helptext.tls_crypt_auth_enabled.tooltip,
    additional_parameters: helptext.additional_parameters.tooltip,
    tls_crypt_auth: helptext.server.tls_crypt_auth.tooltip,
  };

  readonly serverCertificates$ = this.services.getCerts().pipe(idNameArrayToOptions());
  readonly rootAuthorities$ = this.services.getCertificateAuthorities().pipe(idNameArrayToOptions());
  readonly authenticationAlgorithms$ = this.services.getOpenVpnServerAuthAlgorithmChoices().pipe(map((choices) => {
    return Object.entries(choices).map(([algo, description]) => {
      return { label: `${algo} (${description})`, value: algo };
    });
  }));
  readonly ciphers$ = this.services.getOpenServerCipherChoices().pipe(map((choices) => {
    return Object.entries(choices).map(([algo, description]) => {
      return { label: `${algo} ${description}`, value: algo };
    });
  }));
  readonly compressionOptions$ = of(helptext.compression.enum);
  readonly protocols$ = of(helptext.protocol.enum);
  readonly deviceTypes$ = of(helptext.device_type.enum);
  readonly topologies$ = of(helptext.server.topology.enum);

  subscriptions: Subscription[] = [];

  constructor(
    private ws: WebSocketService,
    private errorHandler: FormErrorHandlerService,
    private formBuilder: FormBuilder,
    private services: ServicesService,
    private loader: AppLoaderService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private storageService: StorageService,
    private matDialog: MatDialog,
  ) {}

  ngOnInit(): void {
    this.setFormRelations();
    this.loadConfig();
  }

  onSubmit(): void {
    this.isLoading = true;

    const [server, netmask] = this.form.value.server.split('/');
    const values = {
      ...this.form.value,
      server,
      netmask: Number(netmask),
    };
    this.ws.call('openvpn.server.update', [values])
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

  certificatesLinkClicked(): void {
    this.router.navigate(['/', 'credentials', 'certificates']);
    this.slideInService.close(null, false);
  }

  onRenewStaticKey(): void {
    this.loader.open();

    this.services.renewStaticKey().pipe(untilDestroyed(this)).subscribe({
      next: (config) => {
        const download = Object.entries(config)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
        this.loader.close();
        this.form.patchValue({
          tls_crypt_auth: config.tls_crypt_auth,
        });
        this.storageService.downloadText(download, 'openVPNStatic.key');
      },
      error: (error) => {
        this.loader.close();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    });
  }

  onDownloadClientConfig(): void {
    this.matDialog.open(DownloadClientConfigModalComponent);
  }

  private loadConfig(): void {
    this.isLoading = true;
    this.ws.call('openvpn.server.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config) => {
          this.form.patchValue({
            ...config,
            server: `${config.server}/${config.netmask}`,
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

  private setFormRelations(): void {
    const topologySubscription = this.form.controls['topology'].disabledWhile(
      this.form.select((values) => values.device_type === OpenVpnDeviceType.Tap),
    );

    this.subscriptions.push(topologySubscription);
  }
}
