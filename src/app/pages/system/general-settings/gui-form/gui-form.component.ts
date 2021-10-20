import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import {
  Validators,
} from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { ServiceName } from 'app/enums/service-name.enum';
import { choicesToOptions } from 'app/helpers/options.helper';
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

  formGroup = this.fb.group({
    ui_certificate: ['', [Validators.required]],
    ui_address: [[] as string[], [ipValidator('ipv4')]],
    ui_v6address: [[] as string[], [ipValidator('ipv6')]],
    ui_port: [null as number, [Validators.required, Validators.min(1), Validators.max(65535)]],
    ui_httpsport: [null as number, [Validators.required, Validators.min(1), Validators.max(65535)]],
    ui_httpsprotocols: [[] as string[], [Validators.required]],
    ui_httpsredirect: [false],
    crash_reporting: [false, [Validators.required]],
    usage_collection: [false, [Validators.required]],
    ui_consolemsg: [false, [Validators.required]],
  });

  options = {
    ui_certificate: this.sysGeneralService.uiCertificateOptions().pipe(choicesToOptions()),
    ui_address: this.sysGeneralService.ipChoicesv4().pipe(choicesToOptions()),
    ui_v6address: this.sysGeneralService.ipChoicesv6().pipe(choicesToOptions()),
    ui_httpsprotocols: this.sysGeneralService.uiHttpsProtocolsOptions().pipe(choicesToOptions()),
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

  getIsServiceRestartRequired(current: SystemGeneralConfig, next: SystemGeneralConfigUpdate): boolean {
    const uiCertificateChanged = current.ui_certificate?.id !== next.ui_certificate;
    const httpPortChanged = current.ui_port !== next.ui_port;
    const httpsPortChanged = current.ui_httpsport !== next.ui_httpsport;
    const redirectChanged = current.ui_httpsredirect !== next.ui_httpsredirect;
    const v4AddressesChanged = !(current.ui_address.length === next.ui_address.length
      && current.ui_address.every((val, index) => val === next.ui_address[index]));
    const v6AddressesChanged = !(current.ui_v6address.length === next.ui_v6address.length
      && current.ui_v6address.every((val, index) => val === next.ui_v6address[index]));

    return [
      uiCertificateChanged,
      httpPortChanged,
      httpsPortChanged,
      redirectChanged,
      v4AddressesChanged,
      v6AddressesChanged,
    ].includes(true);
  }

  handleServiceRestart(changed: SystemGeneralConfigUpdate): void {
    const current: SystemGeneralConfig = { ...this.configData };
    const httpPortChanged = current.ui_port !== changed.ui_port;
    const httpsPortChanged = current.ui_httpsport !== changed.ui_httpsport;
    const isServiceRestartRequired = this.getIsServiceRestartRequired(current, changed);

    this.sysGeneralService.refreshSysGeneral();

    if (isServiceRestartRequired) {
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
