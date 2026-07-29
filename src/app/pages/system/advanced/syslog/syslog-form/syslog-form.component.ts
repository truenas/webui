import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { FormBuilder, FormControl, FormArray } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  EMPTY, Subscription, take,
} from 'rxjs';
import {
  catchError, map, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { SyslogLevel, SyslogTransport } from 'app/enums/syslog.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { helptextSystemAdvanced, helptextSystemAdvanced as helptext } from 'app/helptext/system/advanced';
import { AdvancedConfigUpdate, SyslogServer } from 'app/interfaces/advanced-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppState } from 'app/store';
import { advancedConfigUpdated } from 'app/store/system-config/system-config.actions';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-syslog-form',
  templateUrl: 'syslog-form.component.html',
  styleUrls: ['./syslog-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnCheckboxComponent,
    TnSelectComponent,
    TnInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SyslogFormComponent extends SidePanelForm implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected isFormLoading = signal(false);
  private subscriptions: Subscription[] = [];

  readonly form = this.fb.group({
    fqdn_syslog: [false],
    sysloglevel: new FormControl(null as SyslogLevel | null),
    syslog_audit: [false],
    syslogservers: this.fb.array<SyslogServer>([]),
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  get syslogServersArray(): FormArray<SyslogServer> {
    return this.form.controls.syslogservers;
  }

  get canAddServer(): boolean {
    return this.syslogServersArray.length < 2;
  }

  get canRemoveServer(): boolean {
    return this.syslogServersArray.length > 0;
  }

  readonly tooltips = {
    fqdn_syslog: helptext.fqdnTooltip,
    sysloglevel: helptext.sysloglevel.tooltip,
    syslogserver: helptext.syslogserver.tooltip,
    syslog_transport: helptext.syslogTransport.tooltip,
    syslog_tls_certificate: helptext.syslogTlsCertificate.tooltip,
    syslog: helptext.systemDatasetTooltip,
    syslog_audit: helptext.syslogAuditTooltip,
  };

  readonly levelOptions = translateOptions(this.translate, helptextSystemAdvanced.sysloglevel.options);
  readonly transportOptions = helptextSystemAdvanced.syslogTransport.options;
  readonly certificateOptions$ = this.api.call('system.advanced.syslog_certificate_choices').pipe(
    choicesToOptions(),
    map((options) => options.map((option) => ({
      ...option,
      value: option.value ? parseInt(option.value as string, 10) : null,
    }))),
  );

  readonly certificateAuthorityOptions$ = this.api.call('system.advanced.syslog_certificate_authority_choices')
    .pipe(choicesToOptions());

  constructor() {
    super();
    this.destroyRef.onDestroy(() => {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
    });
  }

  ngOnInit(): void {
    this.store$.pipe(
      waitForAdvancedConfig,
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => {
      this.loadForm({
        fqdn_syslog: config.fqdn_syslog,
        sysloglevel: config.sysloglevel,
        syslog_audit: config.syslog_audit,
        syslogservers: config.syslogservers || [],
      });
    });
  }

  addServer(): void {
    if (this.canAddServer) {
      const serverGroup = this.fb.group({
        host: [''],
        transport: [SyslogTransport.Udp],
        tls_certificate: [null as number | null],
      });

      // Add conditional validation for TLS certificate
      const subscription = serverGroup.controls.transport.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
      ).subscribe((transport) => {
        const tlsCertControl = serverGroup.controls.tls_certificate;
        if (transport === SyslogTransport.Tls) {
          tlsCertControl.setValidators([Validators.required]);
        } else {
          tlsCertControl.clearValidators();
        }
        tlsCertControl.updateValueAndValidity();
      });

      this.subscriptions.push(subscription);
      this.syslogServersArray.push(serverGroup);
    }
  }

  removeServer(index: number): void {
    this.syslogServersArray.removeAt(index);
  }

  protected onSubmit(): void {
    const { ...values } = this.form.value;
    const configUpdate: Partial<AdvancedConfigUpdate> = {
      fqdn_syslog: values.fqdn_syslog,
      sysloglevel: values.sysloglevel || undefined,
      syslog_audit: values.syslog_audit,
      syslogservers: values.syslogservers.filter((server: SyslogServer) => server.host),
    };

    this.isFormLoading.set(true);
    this.api.call('system.advanced.update', [configUpdate]).pipe(
      tap(() => {
        this.snackbar.success(this.translate.instant('Settings saved'));
        this.store$.dispatch(advancedConfigUpdated());
        this.isFormLoading.set(false);
        this.close(true);
      }),
      catchError((error: unknown) => {
        this.isFormLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
        return EMPTY;
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private loadForm(syslogConfig: {
    fqdn_syslog: boolean;
    sysloglevel: SyslogLevel;
    syslog_audit: boolean;
    syslogservers: SyslogServer[];
  }): void {
    this.form.patchValue({
      fqdn_syslog: syslogConfig.fqdn_syslog,
      sysloglevel: syslogConfig.sysloglevel,
      syslog_audit: syslogConfig.syslog_audit,
    });

    // Clear existing servers and add from config
    this.syslogServersArray.clear();

    if (syslogConfig.syslogservers && syslogConfig.syslogservers.length > 0) {
      syslogConfig.syslogservers.forEach((server) => {
        const serverGroup = this.fb.group({
          host: [server.host],
          transport: [server.transport || SyslogTransport.Udp],
          tls_certificate: [server.tls_certificate],
        });

        // Add conditional validation for TLS certificate
        if (server.transport === SyslogTransport.Tls && !server.tls_certificate) {
          serverGroup.controls.tls_certificate.setValidators([Validators.required]);
        }

        // Watch for transport changes
        this.subscriptions.push(
          serverGroup.controls.transport.valueChanges.pipe(
            takeUntilDestroyed(this.destroyRef),
          ).subscribe((transport) => {
            const tlsCertControl = serverGroup.controls.tls_certificate;
            if (transport === SyslogTransport.Tls) {
              tlsCertControl.setValidators([Validators.required]);
            } else {
              tlsCertControl.clearValidators();
            }
            tlsCertControl.updateValueAndValidity();
          }),
        );

        this.syslogServersArray.push(serverGroup);
      });
    }
  }
}
