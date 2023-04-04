import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import {
  FormBuilder,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import {
  filter, switchMap, takeUntil, tap,
} from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { SystemGeneralConfig, SystemGeneralConfigUpdate } from 'app/interfaces/system-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ipValidator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  DialogService, SystemGeneralService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebsocketConnectionService } from 'app/services/websocket-connection.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { guiFormSubmitted, themeChangedInGuiForm } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  templateUrl: './gui-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuiFormComponent {
  isFormLoading = true;
  configData: SystemGeneralConfig;

  formGroup = this.fb.group({
    theme: ['', [Validators.required]],
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
    themes: of(this.themeService.allThemes.map((theme) => ({ label: theme.label, value: theme.name }))),
    ui_certificate: this.sysGeneralService.uiCertificateOptions().pipe(choicesToOptions()),
    ui_address: this.sysGeneralService.ipChoicesv4().pipe(choicesToOptions()),
    ui_v6address: this.sysGeneralService.ipChoicesv6().pipe(choicesToOptions()),
    ui_httpsprotocols: this.sysGeneralService.uiHttpsProtocolsOptions().pipe(choicesToOptions()),
  };

  readonly helptext = helptext;

  constructor(
    private fb: FormBuilder,
    private sysGeneralService: SystemGeneralService,
    private slideInService: IxSlideInService,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private wsManager: WebsocketConnectionService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private router: Router,
    private translate: TranslateService,
    private errorHandler: FormErrorHandlerService,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    this.loadCurrentValues();
    this.setupThemePreview();
  }

  replaceHrefWhenWsConnected(href: string): void {
    this.wsManager.isConnected$.pipe(untilDestroyed(this)).subscribe((isConnected) => {
      if (isConnected) {
        this.loader.close();
        // ws is connected
        this.window.location.replace(href);
      }
    });
  }

  onSubmit(): void {
    const values = this.formGroup.value;
    const params = {
      ...values,
      ui_certificate: parseInt(values.ui_certificate),
    };
    delete params.theme;

    (
      !this.configData.ui_httpsredirect && values.ui_httpsredirect
        ? this.dialog.confirm({
          title: this.translate.instant(helptext.redirect_confirm_title),
          message: this.translate.instant(helptext.redirect_confirm_message),
          hideCheckbox: true,
        })
        : of(true)
    ).pipe(
      filter(Boolean),
      tap(() => {
        this.store$.dispatch(guiFormSubmitted({ theme: values.theme }));
        // prevent to revert momentarily to previous value due to `guiFormSubmitted`
        this.formGroup.controls.ui_httpsredirect.setValue(values.ui_httpsredirect);
      }),
      switchMap(() => {
        this.isFormLoading = true;
        return this.ws.call('system.general.update', [params as SystemGeneralConfigUpdate]);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.handleServiceRestart(params as SystemGeneralConfigUpdate);
      },
      error: (error) => {
        this.isFormLoading = false;
        this.errorHandler.handleWsFormError(error, this.formGroup);
        this.cdr.markForCheck();
      },
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

    this.store$.dispatch(generalConfigUpdated());

    if (isServiceRestartRequired) {
      this.dialog.confirm({
        title: this.translate.instant(helptext.dialog_confirm_title),
        message: this.translate.instant(helptext.dialog_confirm_message),
      }).pipe(
        tap(() => this.slideInService.close(null, true)),
        filter(Boolean),
        untilDestroyed(this),
      ).subscribe(() => {
        const hostname = this.window.location.hostname;
        const protocol = this.window.location.protocol;
        let port = this.window.location.port;
        let href = this.window.location.href;

        if (httpPortChanged && protocol === 'http:') {
          port = changed.ui_port.toString();
        } else if (httpsPortChanged && protocol === 'https:') {
          port = changed.ui_httpsport.toString();
        }

        href = protocol + '//' + hostname + ':' + port + this.window.location.pathname;

        this.loader.open();
        this.wsManager.prepareShutdown(); // not really shutting down, just stop websocket detection temporarily
        this.ws.call('system.general.ui_restart').pipe(
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.wsManager.setupConnectionUrl(protocol, hostname + ':' + port);
            this.wsManager.closeWebsocketConnection();
            this.replaceHrefWhenWsConnected(href);
          },
          error: (error: WebsocketError) => {
            this.loader.close();
            this.dialog.error({
              title: helptext.dialog_error_title,
              message: error.reason,
              backtrace: error.trace.formatted,
            });
          },
        });
      });
    } else {
      this.slideInService.close(null, true);
    }
  }

  private loadCurrentValues(): void {
    combineLatest([
      this.store$.pipe(waitForGeneralConfig),
      this.store$.pipe(waitForPreferences),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([config, preferences]) => {
      this.configData = config;
      this.formGroup.patchValue({
        theme: preferences.userTheme,
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

  private setupThemePreview(): void {
    this.formGroup.controls.theme.valueChanges.pipe(
      takeUntil(this.slideInService.onClose$),
      untilDestroyed(this),
    ).subscribe((theme) => {
      this.store$.dispatch(themeChangedInGuiForm({ theme }));
    });
  }
}
