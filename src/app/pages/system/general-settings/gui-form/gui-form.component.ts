import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import {
  FormBuilder, FormGroup, Validators,
} from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { helptext_system_general as helptext } from 'app/helptext/system/general';
import { SystemGeneralConfig, SystemGeneralConfigUpdate } from 'app/interfaces/system-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ipValidator } from 'app/pages/common/entity/entity-form/validators/ip-validation';
import { EntityUtils } from 'app/pages/common/entity/utils';
import {
  DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';
import { AppLoaderService } from 'app/services/app-loader/app-loader.service';
import { IxModalService } from 'app/services/ix-modal.service';

@UntilDestroy()
@Component({
  selector: 'app-gui-form',
  templateUrl: './gui-form.component.html',
  styleUrls: ['./gui-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuiFormComponent {
  title = helptext.guiPageTitle;
  isFormLoading = true;
  configData: SystemGeneralConfig;

  formGroup: FormGroup = this.fb.group({
    ui_certificate: ['', [Validators.required]],
    ui_address: [[], [ipValidator('ipv4')]],
    ui_v6address: [[], [ipValidator('ipv6')]],
    ui_port: ['', [Validators.required, Validators.min(1), Validators.max(65535)]],
    ui_httpsport: ['', [Validators.required, Validators.min(1), Validators.max(65535)]],
    ui_httpsprotocols: [[], [Validators.required]],
    ui_httpsredirect: [false],
    crash_reporting: [false, [Validators.required]],
    usage_collection: [false, [Validators.required]],
    ui_consolemsg: [false, [Validators.required]],
  });

  options = {
    ui_certificate: this.sysGeneralService.uiCertificateOptions(),
    ui_address: this.sysGeneralService.ipChoicesv4(),
    ui_v6address: this.sysGeneralService.ipChoicesv6(),
    ui_httpsprotocols: this.sysGeneralService.uiHttpsProtocolsOptions(),
  };

  readonly helptext = helptext;

  constructor(
    private fb: FormBuilder,
    private sysGeneralService: SystemGeneralService,
    private modalService: IxModalService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
  ) {
    this.sysGeneralService.getGeneralConfig$.pipe(
      untilDestroyed(this),
    ).subscribe((config) => {
      this.configData = config;
      this.formGroup.patchValue({
        ui_certificate: config.ui_certificate?.id.toString(),
        ui_address: config.ui_address,
        ui_v6address: config.ui_v6address,
        ui_port: config.ui_port,
        ui_httpsport: config.ui_httpsport,
        ui_httpsprotocols: config.ui_httpsprotocols,
        ui_httpsredirect: config.ui_httpsredirect,
        crash_reporting: config.crash_reporting,
        usage_collection: config.usage_collection,
        ui_consolemsg: config.ui_consolemsg,
      });
      this.isFormLoading = false;
      this.cdr.markForCheck();
    });
  }

  reconnect(href: string): void {
    if (this.ws.connected) {
      this.loader.close();
      // ws is connected
      window.location.replace(href);
    } else {
      setTimeout(() => {
        this.reconnect(href);
      }, 5000);
    }
  }

  onSubmit(): void {
    const values = this.formGroup.value;
    const body: SystemGeneralConfigUpdate = {
      ui_certificate: parseInt(values.ui_certificate),
      ui_address: values.ui_address,
      ui_v6address: values.ui_v6address,
      ui_port: values.ui_port,
      ui_httpsport: values.ui_httpsport,
      ui_httpsprotocols: values.ui_httpsprotocols,
      ui_httpsredirect: values.ui_httpsredirect,
      crash_reporting: values.crash_reporting,
      usage_collection: values.usage_collection,
      ui_consolemsg: values.ui_consolemsg,
    };

    this.isFormLoading = true;
    this.ws.call('system.general.update', [body]).pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.isFormLoading = false;
      this.modalService.close();
      this.handleServiceRestart(body);
    }, (error) => {
      this.isFormLoading = false;
      this.modalService.close();
      new EntityUtils().handleWSError(this, error);
    });
  }

  handleServiceRestart(changed: SystemGeneralConfigUpdate): void {
    const {
      ui_port, ui_httpsport, ui_httpsredirect, ui_certificate, ui_address, ui_v6address,
    } = this.configData;
    const uiCertificateChanged = ui_certificate?.id !== changed.ui_certificate;
    const httpPortChanged = ui_port !== changed.ui_port;
    const httpsPortChanged = ui_httpsport !== changed.ui_httpsport;
    const redirectChanged = ui_httpsredirect !== changed.ui_httpsredirect;
    const v4AddressesChanged = !(ui_address.length === changed.ui_address.length
      && ui_address.every((val, index) => val === changed.ui_address[index]));
    const v6AddressesChanged = !(ui_v6address.length === changed.ui_v6address.length
      && ui_v6address.every((val, index) => val === changed.ui_v6address[index]));

    this.sysGeneralService.refreshSysGeneral();

    if ([
      uiCertificateChanged,
      httpPortChanged,
      httpsPortChanged,
      redirectChanged,
      v4AddressesChanged,
      v6AddressesChanged,
    ].includes(true)) {
      this.dialog.confirm({
        title: this.translate.instant(helptext.dialog_confirm_title),
        message: this.translate.instant(helptext.dialog_confirm_message),
      }).pipe(
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol;
        let port = window.location.port;
        let href = window.location.href;

        if (httpPortChanged && protocol === 'http:') {
          port = changed.ui_port.toString();
        } else if (httpsPortChanged && protocol === 'https:') {
          port = changed.ui_httpsport.toString();
        }

        href = protocol + '//' + hostname + ':' + port + window.location.pathname;

        this.loader.open();
        this.ws.shuttingdown = true; // not really shutting down, just stop websocket detection temporarily
        this.ws.call('service.restart', [ServiceName.Http]).pipe(
          untilDestroyed(this),
        ).subscribe(
          () => {
            this.ws.reconnect(protocol, hostname + ':' + port);
            this.reconnect(href);
          },
          (error: WebsocketError) => {
            this.loader.close();
            this.dialog.errorReport(
              helptext.dialog_error_title,
              error.reason,
              error.trace.formatted,
            );
          },
        );
      });
    }
  }
}
