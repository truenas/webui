import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component, Inject,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, of } from 'rxjs';
import {
  filter, switchMap, takeUntil, tap,
} from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { SystemGeneralConfig, SystemGeneralConfigUpdate } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipValidator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { ApiService } from 'app/services/websocket/api.service';
import { WebSocketHandlerService } from 'app/services/websocket/websocket-handler.service';
import { AppState } from 'app/store';
import { guiFormSubmitted, themeChangedInGuiForm } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-gui-form',
  templateUrl: './gui-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    WithManageCertificatesLinkComponent,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
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
    private slideInRef: SlideInRef<GuiFormComponent, boolean>,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    private wsManager: WebSocketHandlerService,
    private dialog: DialogService,
    private loader: AppLoaderService,
    private translate: TranslateService,
    private formErrorHandler: FormErrorHandlerService,
    private errorHandler: ErrorHandlerService,
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
        // prevent to revert momentarily to previous value due to `guiFormSubmitted`
        this.formGroup.controls.ui_httpsredirect.setValue(values.ui_httpsredirect);
      }),
      switchMap(() => {
        this.isFormLoading = true;
        return this.api.call('system.general.update', [params as SystemGeneralConfigUpdate]);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.store$.dispatch(guiFormSubmitted({ theme: values.theme }));
        this.themeService.updateThemeInLocalStorage(this.themeService.findTheme(values.theme));
        this.isFormLoading = false;
        this.cdr.markForCheck();
        this.handleServiceRestart(params as SystemGeneralConfigUpdate);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.formErrorHandler.handleValidationErrors(error, this.formGroup);
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
        tap(() => this.slideInRef.close(true)),
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
        this.api.call('system.general.ui_restart').pipe(
          untilDestroyed(this),
        ).subscribe({
          next: () => {
            this.wsManager.setupConnectionUrl(protocol, hostname + ':' + port);
            this.wsManager.reconnect();
            this.replaceHrefWhenWsConnected(href);
          },
          error: (error: unknown) => {
            this.loader.close();
            this.errorHandler.showErrorModal(error);
          },
        });
      });
    } else {
      this.slideInRef.close(true);
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
        ui_certificate: config.ui_certificate?.id?.toString(),
        ui_address: config.ui_address,
        ui_v6address: config.ui_v6address,
        ui_port: config.ui_port,
        ui_httpsport: config.ui_httpsport,
        ui_httpsprotocols: config.ui_httpsprotocols,
        ui_httpsredirect: config.ui_httpsredirect,
        usage_collection: config.usage_collection,
        ui_consolemsg: config.ui_consolemsg,
      });
      this.isFormLoading = false;
      this.cdr.markForCheck();
    });
  }

  private setupThemePreview(): void {
    this.formGroup.controls.theme.valueChanges.pipe(
      takeUntil(this.slideInRef.slideInClosed$),
      untilDestroyed(this),
    ).subscribe((theme) => {
      this.store$.dispatch(themeChangedInGuiForm({ theme }));
    });
  }
}
