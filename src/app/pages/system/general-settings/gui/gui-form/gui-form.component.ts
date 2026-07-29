import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, OnInit, signal, inject, output, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnSelectComponent, InputType,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { filter, switchMap, take } from 'rxjs/operators';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { SystemGeneralConfig, SystemGeneralConfigUpdate } from 'app/interfaces/system-config.interface';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  FormSubmitEvent,
  IxFormComponent,
  SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { WithManageCertificatesLinkComponent } from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { WebSocketHandlerService } from 'app/modules/websocket/websocket-handler.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketStatusService } from 'app/services/websocket-status.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-gui-form',
  templateUrl: './gui-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    WithManageCertificatesLinkComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class GuiFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private sysGeneralService = inject(SystemGeneralService);
  private api = inject(ApiService);
  private wsManager = inject(WebSocketHandlerService);
  private wsStatus = inject(WebSocketStatusService);
  private dialog = inject(DialogService);
  private loader = inject(LoaderService);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private store$ = inject<Store<AppState>>(Store);
  private window = inject<Window>(WINDOW);
  private destroyRef = inject(DestroyRef);

  readonly closed = output<boolean>();

  private readonly ixForm = viewChild(IxFormComponent);

  protected InputType = InputType;

  protected isFormLoading = signal(true);
  configData!: SystemGeneralConfig;
  protected isStigMode = signal(false);

  formGroup = this.fb.nonNullable.group({
    // Stored as string because the select works with string values; converted to number on submit via parseInt.
    ui_certificate: ['', [Validators.required]],
    ui_address: [[] as string[]],
    ui_v6address: [[] as string[]],
    ui_port: [null as number | null, [Validators.min(1), Validators.max(65535)]],
    ui_httpsport: [null as number | null, [Validators.min(1), Validators.max(65535)]],
    ui_httpsprotocols: [[] as string[], [Validators.required]],
    ui_httpsredirect: [false],
    usage_collection: [false],
    ui_consolemsg: [false],
  });

  options = {
    ui_certificate: this.sysGeneralService.uiCertificateOptions().pipe(choicesToOptions()),
    ui_address: this.sysGeneralService.ipChoicesv4().pipe(choicesToOptions()),
    ui_v6address: this.sysGeneralService.ipChoicesv6().pipe(choicesToOptions()),
    ui_httpsprotocols: this.sysGeneralService.uiHttpsProtocolsOptions().pipe(choicesToOptions()),
  };

  readonly helptext = helptext;

  protected usageCollectionTooltip = computed(() => {
    if (this.isStigMode()) {
      return this.translate.instant(helptext.usageCollection.stigModeTooltip);
    }

    return this.translate.instant(helptext.usageCollection.tooltip);
  });

  constructor() {
    this.loadCurrentValues();
  }

  ngOnInit(): void {
    this.api.call('system.security.config').pipe(
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config: SystemSecurityConfig) => {
      const isStigMode = config.enable_gpos_stig;
      this.isStigMode.set(isStigMode);

      if (isStigMode) {
        this.formGroup.controls.usage_collection.disable();
      }
    });
  }

  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  submit(): void {
    this.ixForm()?.submit();
  }

  hasUnsavedChanges(): boolean {
    return this.ixForm()?.hasUnsavedChanges() ?? false;
  }

  protected handleSubmit = (event: FormSubmitEvent): SubmitResult => {
    const values = event.allValues as ReturnType<typeof this.formGroup.getRawValue>;
    const params: SystemGeneralConfigUpdate = {
      ...values,
      ui_certificate: parseInt(values.ui_certificate),
    };

    if (this.isStigMode()) {
      delete params.usage_collection;
    }

    const redirectConfirm$ = !this.configData.ui_httpsredirect && values.ui_httpsredirect
      ? this.dialog.confirm({
          title: this.translate.instant(helptext.redirectConfirmTitle),
          message: this.translate.instant(helptext.redirectConfirmMessage),
          hideCheckbox: true,
        })
      : of(true);

    return {
      request$: redirectConfirm$.pipe(
        filter(Boolean),
        switchMap(() => this.api.call('system.general.update', [params])),
      ),
      successMessage: this.translate.instant('Settings saved.'),
      onSuccess: () => this.handleServiceRestart(params),
      closeWith: () => true,
    };
  };

  private getServiceRestartChanges(
    current: SystemGeneralConfig,
    next: SystemGeneralConfigUpdate,
  ): { isRequired: boolean; httpPortChanged: boolean; httpsPortChanged: boolean } {
    const uiCertificateChanged = next.ui_certificate !== undefined
      && current.ui_certificate !== next.ui_certificate;
    const httpPortChanged = next.ui_port !== undefined
      && current.ui_port !== next.ui_port;
    const httpsPortChanged = next.ui_httpsport !== undefined
      && current.ui_httpsport !== next.ui_httpsport;
    const redirectChanged = next.ui_httpsredirect !== undefined
      && current.ui_httpsredirect !== next.ui_httpsredirect;
    const nextV4 = next.ui_address;
    const v4AddressesChanged = nextV4 !== undefined
      && !(current.ui_address.length === nextV4.length
        && current.ui_address.every((val, index) => val === nextV4[index]));
    const nextV6 = next.ui_v6address;
    const v6AddressesChanged = nextV6 !== undefined
      && !(current.ui_v6address.length === nextV6.length
        && current.ui_v6address.every((val, index) => val === nextV6[index]));

    const isRequired = uiCertificateChanged || httpPortChanged || httpsPortChanged
      || redirectChanged || v4AddressesChanged || v6AddressesChanged;

    return { isRequired, httpPortChanged, httpsPortChanged };
  }

  private handleServiceRestart(changed: SystemGeneralConfigUpdate): void {
    const current: SystemGeneralConfig = { ...this.configData };
    const { isRequired: isServiceRestartRequired, httpPortChanged, httpsPortChanged }
      = this.getServiceRestartChanges(current, changed);

    this.store$.dispatch(generalConfigUpdated());

    if (!isServiceRestartRequired) {
      return;
    }

    this.dialog.confirm({
      title: this.translate.instant(helptext.restartTitle),
      message: this.translate.instant(helptext.restartMessage),
    }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }

      const hostname = this.window.location.hostname;
      const protocol = this.window.location.protocol;
      let port = this.window.location.port;
      let href = this.window.location.href;

      if (httpPortChanged && protocol === 'http:') {
        port = String(changed.ui_port);
      } else if (httpsPortChanged && protocol === 'https:') {
        port = String(changed.ui_httpsport);
      }

      href = protocol + '//' + hostname + ':' + port + this.window.location.pathname;

      this.loader.open();
      this.wsManager.prepareShutdown();
      this.api.call('system.general.ui_restart').subscribe({
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
  }

  private replaceHrefWhenWsConnected(href: string): void {
    this.wsStatus.isConnected$.subscribe((isConnected) => {
      if (isConnected) {
        this.loader.close();
        this.window.location.replace(href);
      }
    });
  }

  private loadCurrentValues(): void {
    this.store$.pipe(
      waitForGeneralConfig,
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.configData = config;
      this.formGroup.patchValue({
        ui_certificate: config.ui_certificate.toString(),
        ui_address: config.ui_address,
        ui_v6address: config.ui_v6address,
        ui_port: config.ui_port,
        ui_httpsport: config.ui_httpsport,
        ui_httpsprotocols: config.ui_httpsprotocols,
        ui_httpsredirect: config.ui_httpsredirect,
        usage_collection: config.usage_collection,
        ui_consolemsg: config.ui_consolemsg,
      });
      this.isFormLoading.set(false);
    });
  }
}
