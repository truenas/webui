import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, computed, signal, inject, DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnButtonComponent, TnCheckboxComponent, TnDialog, TnFormFieldComponent, TnFormSectionComponent,
  TnInputComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  catchError, forkJoin, Observable, of, tap,
} from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { NfsProtocol, nfsProtocolLabels } from 'app/enums/nfs-protocol.enum';
import { Role } from 'app/enums/role.enum';
import { RdmaProtocolName } from 'app/enums/service-name.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { mapToOptions } from 'app/helpers/options.helper';
import { helptextServiceNfs } from 'app/helptext/services/components/service-nfs';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { NfsConfig } from 'app/interfaces/nfs-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { rangeValidator, portRangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  serviceConfigSavedMessage,
} from 'app/pages/services/components/service-config-forms.constants';
import { AddSpnDialog } from 'app/pages/services/components/service-nfs/add-spn-dialog/add-spn-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { AppState } from 'app/store';

// Built here rather than inline in the component, and left with an inferred return type — see
// the `V` type parameter on IxFormHostForm for why.
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
function createNfsForm(fb: NonNullableFormBuilder, validatorsService: IxValidatorsService) {
  return fb.group({
    allow_nonroot: [false],
    bindip: [[] as string[]],
    servers_auto: [true],
    servers: [null as number | null, [rangeValidator(1, 256), validatorsService.validateOnCondition(
      (control) => !control.parent?.get('servers_auto')?.value,
      Validators.required,
    )]],
    protocols: [[NfsProtocol.V3], Validators.required],
    v4_domain: [''],
    v4_krb: [false],
    mountd_port: [null as number | null, portRangeValidator()],
    rpcstatd_port: [null as number | null, portRangeValidator()],
    rpclockd_port: [null as number | null, portRangeValidator()],
    userd_manage_gids: [false],
    rdma: [false],
  });
}

/**
 * The form's own value shape, which is NOT `NfsConfig`: `servers_auto` is a UI-only control
 * (mapped from `managed_nfsd` and dropped in {@link ServiceNfsComponent.handleSubmit}).
 */
type NfsFormValue = ReturnType<ReturnType<typeof createNfsForm>['getRawValue']>;

@Component({
  selector: 'ix-service-nfs',
  templateUrl: './service-nfs.component.html',
  styleUrls: ['./service-nfs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TnInputComponent,
    IxFormComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TooltipComponent,
    TranslateModule,
  ],
})
export class ServiceNfsComponent extends IxFormHostForm<boolean, NfsFormValue> implements OnInit {
  private api = inject(ApiService);
  private fb = inject(NonNullableFormBuilder);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private dialogService = inject(DialogService);
  private tnDialog = inject(TnDialog);
  private validatorsService = inject(IxValidatorsService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly InputType = InputType;
  protected readonly isAddSpnDisabled = signal(true);
  protected readonly hasNfsStatus = signal(false);
  protected activeDirectoryState = signal<DirectoryServiceStatus | null>(null);

  protected readonly form = createNfsForm(this.fb, this.validatorsService);

  private readonly isKerberosRequired = toSignal(this.form.controls.v4_krb.valueChanges, {
    initialValue: this.form.controls.v4_krb.value,
  });

  /**
   * Add SPN only applies to a Kerberos-secured NFSv4 server that doesn't already have an SPN, and
   * only once Active Directory is healthy. Declarative rather than a getter reading
   * `form.getRawValue()`, so it recomputes when its inputs change instead of on every CD pass.
   */
  protected readonly isAddSpnVisible = computed(() => {
    return !this.hasNfsStatus()
      && this.isKerberosRequired()
      && this.activeDirectoryState() === DirectoryServiceStatus.Healthy;
  });

  readonly tooltips = {
    allow_nonroot: helptextServiceNfs.allowNonrootTooltip,
    bindip: helptextServiceNfs.bindipTooltip,
    servers: helptextServiceNfs.serversTooltip,
    servers_auto: helptextServiceNfs.serversAutoTooltip,
    v4_domain: helptextServiceNfs.v4DomainTooltip,
    protocols: helptextServiceNfs.protocolsTooltip,
    v4_krb: helptextServiceNfs.v4KrbTooltip,
    mountd_port: helptextServiceNfs.mountdPortTooltip,
    rpcstatd_port: helptextServiceNfs.rpcstatdPortTooltip,
    rpclockd_port: helptextServiceNfs.rpclockdPortTooltip,
    userd_manage_gids: helptextServiceNfs.userdManageGids,
  };

  /**
   * The addresses the saved config binds to, captured by the gated `nfs.config` load. Folded into
   * the choice list below because `nfs.bindip_choices` only offers addresses the system currently
   * has: one the config still binds to but that has since gone away would otherwise be missing from
   * the options and silently dropped from the select.
   */
  private readonly configuredBindIps = signal<string[]>([]);

  private readonly availableBindIps = toSignal(
    this.api.call('nfs.bindip_choices').pipe(
      choicesToOptions(),
      map((options) => options.map((option) => String(option.value))),
      // Fails soft, like the other enrichments: `toSignal` latches an error and re-throws it on
      // every read, and this one is read from `ipChoices()` during template evaluation — so an
      // uncaught failure would take down the whole form render instead of emptying one select.
      // The configured addresses still reach the options through `configuredBindIps`.
      catchError(() => of([] as string[])),
    ),
    { initialValue: [] as string[] },
  );

  protected readonly ipChoices = computed(() => {
    return [...new Set([...this.configuredBindIps(), ...this.availableBindIps()])]
      .map((value) => ({ label: value, value }));
  });

  readonly protocolOptions$ = of(mapToOptions(nfsProtocolLabels, this.translate));
  readonly requiredRoles = [Role.SharingNfsWrite, Role.SharingWrite];

  private readonly v4SpecificFields = ['v4_domain', 'v4_krb'] as const;

  ngOnInit(): void {
    // Wired up front, once — not from the load patch, which `loadFormConfig` replays on retry and
    // would therefore re-subscribe. `applyConfig` writes `protocols` silently so this still only
    // ever sees a user-driven change.
    this.setFieldDependencies();

    // Only `nfs.config` gates the form: it is what populates the controls, so its failure is what
    // leaves them on defaults the user must not save. The other two calls merely enrich the UI
    // (RDMA availability, Add SPN visibility) and fail soft below — folding them into the same
    // load would let a `directoryservices.status` hiccup disable Save over a form that actually
    // holds the real configuration.
    this.loadFormConfig(this.api.call('nfs.config'), (config) => this.applyConfig(config));

    forkJoin([this.checkForRdmaSupport(), this.loadActiveDirectoryState()]).pipe(
      // Both enrichments already default to the conservative option (RDMA disabled, Add SPN
      // hidden), so a failure just leaves them there.
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected handleSubmit = ({ allValues }: FormSubmitEvent<NfsFormValue>): SubmitResult => {
    const { servers_auto: serversAuto, ...params } = allValues;

    return {
      request$: this.api.call('nfs.update', [{
        ...params,
        servers: serversAuto ? null : params.servers,
      }]),
      successMessage: this.translate.instant(serviceConfigSavedMessage),
    };
  };

  /**
   * Idempotent, as {@link loadFormConfig} requires: every write is a plain (re-runnable) patch.
   */
  private applyConfig(config: NfsConfig): void {
    this.isAddSpnDisabled.set(!config.v4_krb);
    this.hasNfsStatus.set(config.keytab_has_nfs_spn);
    this.configuredBindIps.set(config.bindip);

    // Silently, so loading a config is not mistaken for the user changing the protocols: the
    // dependency below blanks `v4_domain` whenever NFSv4 is off, and a stored value must survive
    // its own load rather than be cleared out from under a config the user never touched.
    const { protocols, ...rest } = config;
    this.form.controls.protocols.setValue(protocols, { emitEvent: false });
    this.form.patchValue({
      ...rest,
      servers_auto: config.managed_nfsd,
    });
  }

  private checkForRdmaSupport(): Observable<void> {
    // `rdma.capable_protocols` already accounts for the RDMA entitlement, so it decides this
    // alone. It used to be qualified by product type, which is not a licensing signal.
    return this.api.call('rdma.capable_protocols').pipe(
      map((capableProtocols): void => {
        const hasRdmaSupport = capableProtocols.includes(RdmaProtocolName.Nfs);
        if (hasRdmaSupport) {
          this.form.controls.rdma.enable();
        } else {
          this.form.controls.rdma.disable();
        }

        return undefined;
      }),
    );
  }

  private loadActiveDirectoryState(): Observable<DirectoryServicesStatus> {
    return this.api.call('directoryservices.status').pipe(
      tap((dsStatus) => {
        if (dsStatus.type === DirectoryServiceType.ActiveDirectory) {
          this.activeDirectoryState.set(dsStatus.status);
        } else {
          this.activeDirectoryState.set(DirectoryServiceStatus.Disabled);
        }
      }),
    );
  }

  private setFieldDependencies(): void {
    this.form.controls.protocols.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((protocols) => {
      const nfs4Enabled = protocols.includes(NfsProtocol.V4);
      if (!nfs4Enabled) {
        this.form.patchValue({
          v4_domain: '',
        });
      }

      this.v4SpecificFields.forEach((field) => {
        if (nfs4Enabled) {
          this.form.controls[field].enable();
        } else {
          this.form.controls[field].disable();
        }
      });
    });
  }

  protected addSpn(): void {
    this.dialogService.confirm({
      title: this.translate.instant('Add Kerberos SPN Entry'),
      message: this.translate.instant('Would you like to add a Service Principal Name (SPN) now?'),
      hideCheckbox: true,
      buttonText: this.translate.instant('Yes'),
      cancelText: this.translate.instant('No'),
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.tnDialog.open(AddSpnDialog);
    });
  }
}
