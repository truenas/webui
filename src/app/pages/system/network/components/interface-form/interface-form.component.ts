import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  applyEach, disabled, form, hidden, readonly, required, validate,
} from '@angular/forms/signals';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnDialog, TnFormErrorsComponent, TnFormFieldComponent, TnFormListComponent,
  TnFormListItemComponent, TnFormSectionComponent, TnInputComponent, TnRadioComponent, TnRadioGroupComponent,
  TnSelectComponent, TnSelectOption,
} from '@truenas/ui-components';
import { isEqual, range } from 'lodash-es';
import { Observable, of } from 'rxjs';
import {
  filter, map, switchMap, take,
} from 'rxjs/operators';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import {
  CreateNetworkInterfaceType,
  LacpduRate,
  LinkAggregationProtocol,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { Role } from 'app/enums/role.enum';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextInterfacesForm } from 'app/helptext/network/interfaces/interfaces-form';
import { Choices } from 'app/interfaces/choices.interface';
import {
  NetworkConfigToBeRemoved,
  NetworkInterface,
  NetworkInterfaceCreate,
  NetworkInterfaceUpdate,
  toNetworkConfigToBeRemoved,
  toNetworkInterfaceCreateArgs,
} from 'app/interfaces/network-interface.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/controls/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import {
  FormSubmitEvent, IxFormComponent, SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { signalFormImports } from 'app/modules/forms/signal-forms/ix-signal-error-dismiss.directive';
import { SignalFormErrors } from 'app/modules/forms/signal-forms/signal-form-errors.service';
import { patchModelValue, toFormModel } from 'app/modules/forms/signal-forms/signal-forms.utils';
import { requiredList, validateIpAddress, validateRange } from 'app/modules/forms/signal-forms/signal-validators';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';
import { ignoreTranslation, TranslatedString } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DefaultGatewayDialog,
} from 'app/pages/system/network/components/default-gateway-dialog/default-gateway-dialog.component';
import {
  InterfaceNameValidatorService,
} from 'app/pages/system/network/components/interface-form/interface-name-validator.service';
import {
  formAliasesToInterfaceAliases,
  interfaceAliasesToFormAliases,
  NetworkInterfaceFormAlias,
} from 'app/pages/system/network/components/interface-form/network-interface-alias-control.interface';
import { EntitlementsService } from 'app/services/entitlements.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { AppState } from 'app/store';
import { selectHaInfoState } from 'app/store/ha-info/ha-info.selectors';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

interface InterfaceFormModel {
  type: NetworkInterfaceType | null;
  name: string;
  description: string;
  ipv4_dhcp: boolean;
  ipv6_auto: boolean;
  bridge_members: string[];
  enable_learning: boolean;
  lag_protocol: LinkAggregationProtocol | null;
  xmit_hash_policy: XmitHashPolicy;
  lacpdu_rate: LacpduRate;
  lag_ports: string[];
  vlan_parent_interface: string;
  vlan_tag: number | null;
  vlan_pcp: number | null;
  failover_critical: boolean;
  failover_group: number | null;
  mtu: number | null;
  fec_mode: string | null;
  aliases: NetworkInterfaceFormAlias[];
}

const defaultMtu = 1500;

const defaultModel: InterfaceFormModel = {
  type: null,
  name: '',
  description: '',
  ipv4_dhcp: false,
  ipv6_auto: false,
  bridge_members: [],
  enable_learning: true,
  // The backend's `lag_supported_protocols` never returns NONE, so start unselected (placeholder)
  // and force an explicit choice rather than showing a phantom NONE that isn't in the options.
  lag_protocol: null,
  xmit_hash_policy: XmitHashPolicy.Layer2Plus3,
  lacpdu_rate: LacpduRate.Slow,
  lag_ports: [],
  vlan_parent_interface: '',
  vlan_tag: null,
  vlan_pcp: null,
  failover_critical: false,
  failover_group: null,
  mtu: defaultMtu,
  fec_mode: null,
  aliases: [],
};

@Component({
  selector: 'ix-interface-form',
  templateUrl: './interface-form.component.html',
  styleUrls: ['./interface-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InterfaceNameValidatorService, SignalFormErrors],
  imports: [
    signalFormImports,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TnInputComponent,
    TnCheckboxComponent,
    TnRadioComponent,
    TnRadioGroupComponent,
    TnFormListComponent,
    TnFormListItemComponent,
    OrderedListboxComponent,
    IxIpInputWithNetmaskComponent,
    TnFormErrorsComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class InterfaceFormComponent extends IxFormHostForm<boolean, InterfaceFormModel> implements OnInit {
  private api = inject(ApiService);
  private entitlements = inject(EntitlementsService);
  private translate = inject(TranslateService);
  private networkService = inject(NetworkService);
  private errorHandler = inject(ErrorHandlerService);
  private interfaceNameValidator = inject(InterfaceNameValidatorService);
  private serverErrors = inject(SignalFormErrors);
  private tnDialog = inject(TnDialog);
  private dialog = inject(DialogService);
  private destroyRef = inject(DestroyRef);
  private store$ = inject<Store<AppState>>(Store);

  /** Interface to edit, supplied by the `<tn-side-panel>` host (`FormSidePanelService.open`). */
  readonly editInterface = input<NetworkInterface | undefined>(undefined);
  /** Existing interfaces (for auto-naming), supplied by the `<tn-side-panel>` host. */
  readonly interfacesList = input<NetworkInterface[]>([]);

  readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected readonly InputType = InputType;
  readonly helptext = helptextInterfacesForm;

  /** Physical bridge members as loaded for edit, so Save only warns when that set actually changes. */
  private initialPhysicalBridgeMembers: string[] = [];

  private readonly model = signal<InterfaceFormModel>({ ...defaultModel });

  protected readonly isNew = computed(() => !this.editInterface());
  protected readonly isBridge = computed(() => this.model().type === NetworkInterfaceType.Bridge);
  protected readonly isLag = computed(() => this.model().type === NetworkInterfaceType.LinkAggregation);
  protected readonly isVlan = computed(() => this.model().type === NetworkInterfaceType.Vlan);
  protected readonly isLacpLag = computed(() => this.model().lag_protocol === LinkAggregationProtocol.Lacp);
  protected readonly isFailoverLag = computed(() => this.model().lag_protocol === LinkAggregationProtocol.Failover);
  protected readonly hasXmitHashPolicy = computed(() => {
    return this.isLacpLag() || this.model().lag_protocol === LinkAggregationProtocol.LoadBalance;
  });

  protected readonly canHaveStaticIpAddresses = computed(() => !this.model().ipv4_dhcp);

  protected readonly isHaLicensed = signal(false);
  protected readonly ipLabelSuffix = signal('');
  protected readonly failoverLabelSuffix = signal('');

  protected readonly fecModeOptions = signal<TnSelectOption<string>[]>([]);
  protected readonly showFecMode = computed(() => this.fecModeOptions().length > 0);

  // Editing interfaces is disallowed while HA is enabled, so the host's Save must be gated on it
  // too — bound as the `<ix-form>`'s `extraDisabled`.
  protected readonly isHaEnabled = signal(false);

  /**
   * Each type's fields are hidden for the other types rather than removed, so their `required` stops counting
   * the moment the type changes: nothing the user cannot see can block Save.
   */
  protected readonly form = form(this.model, (path) => {
    hidden(path.type, { when: () => !this.isNew() });
    required(path.type);

    required(path.name);
    readonly(path.name, { when: () => !this.isNew() });
    validate(path.name, ({ value, valueOf }) => this.interfaceNameValidator.validate(valueOf(path.type), value()));

    disabled(path.ipv6_auto, { when: () => this.isHaLicensed() });

    hidden(path.aliases, { when: () => !this.canHaveStaticIpAddresses() });
    applyEach(path.aliases, (alias) => {
      required(alias.address);
      validateIpAddress(alias.address, { cidr: true });

      hidden(alias.failover_address, { when: () => !this.isHaLicensed() });
      required(alias.failover_address);
      validateIpAddress(alias.failover_address);

      hidden(alias.failover_virtual_address, { when: () => !this.isHaLicensed() });
      required(alias.failover_virtual_address);
      validateIpAddress(alias.failover_virtual_address);
    });

    hidden(path.bridge_members, { when: () => !this.isBridge() });
    hidden(path.enable_learning, { when: () => !this.isBridge() });

    hidden(path.lag_protocol, { when: () => !this.isLag() });
    required(path.lag_protocol);
    hidden(path.xmit_hash_policy, { when: () => !this.isLag() || !this.hasXmitHashPolicy() });
    required(path.xmit_hash_policy);
    hidden(path.lacpdu_rate, { when: () => !this.isLag() || !this.isLacpLag() });
    required(path.lacpdu_rate);
    hidden(path.lag_ports, { when: () => !this.isLag() });
    requiredList(path.lag_ports);

    hidden(path.vlan_parent_interface, { when: () => !this.isVlan() });
    required(path.vlan_parent_interface);
    // The parent of an existing VLAN cannot change.
    disabled(path.vlan_parent_interface, { when: () => !this.isNew() });
    hidden(path.vlan_tag, { when: () => !this.isVlan() });
    required(path.vlan_tag);
    validateRange(path.vlan_tag, 1, 4094);
    hidden(path.vlan_pcp, { when: () => !this.isVlan() });

    hidden(path.failover_critical, { when: () => !this.isHaLicensed() });
    hidden(path.failover_group, { when: () => !this.isHaLicensed() });

    validateRange(path.mtu, 68, 9216);
    hidden(path.fec_mode, { when: () => !this.showFecMode() });

    this.serverErrors.apply(path);
  });

  protected readonly interfaceTypes: TnSelectOption<NetworkInterfaceType>[] = [
    { label: this.translate.instant('Bridge'), value: NetworkInterfaceType.Bridge },
    { label: this.translate.instant('Link Aggregation'), value: NetworkInterfaceType.LinkAggregation },
    { label: 'VLAN', value: NetworkInterfaceType.Vlan },
  ];

  protected readonly dhcpOptions = [
    { label: this.translate.instant('Get IP Address Automatically from DHCP'), value: true },
    { label: this.translate.instant('Define Static IP Addresses'), value: false },
  ];

  protected readonly vlanPcpOptions: TnSelectOption<number>[] = [
    { value: 0, label: this.translate.instant('Best effort (default)') },
    { value: 1, label: this.translate.instant('Background (lowest)') },
    { value: 2, label: this.translate.instant('Excellent effort') },
    { value: 3, label: this.translate.instant('Critical applications') },
    { value: 4, label: this.translate.instant('Video, < 100ms latency') },
    { value: 5, label: this.translate.instant('Video, < 10ms latency') },
    { value: 6, label: this.translate.instant('Internetwork control') },
    { value: 7, label: this.translate.instant('Network control (highest)') },
  ];

  protected readonly failoverGroups = range(1, 32).map((group) => ({
    label: ignoreTranslation(String(group)),
    value: group,
  }));

  // An edited bridge or LAG also offers its own current members, so its choices are fetched again on edit.
  protected bridgeMembers$ = this.networkService.getBridgeMembersChoices().pipe(choicesToOptions());

  protected readonly lagProtocols = toSignal(
    this.networkService.getLaggProtocolChoices().pipe(singleArrayToOptions()),
    { initialValue: [] },
  );

  protected lagPorts$ = this.networkService.getLaggPortsChoices().pipe(choicesToOptions());

  // Middleware declares both choices as a fixed set of keys, which an interface without an index signature
  // cannot be read as.
  protected readonly xmitHashPolicies = toSignal(
    this.api.call('interface.xmit_hash_policy_choices').pipe(
      map((choices): Choices => ({ ...choices })),
      choicesToOptions(),
    ),
    { initialValue: [] },
  );

  protected readonly lacpduRates = toSignal(
    this.api.call('interface.lacpdu_rate_choices').pipe(
      map((choices): Choices => ({ ...choices })),
      choicesToOptions(),
    ),
    { initialValue: [] },
  );

  protected readonly vlanParentInterfaces = toSignal(
    this.networkService.getVlanParentInterfaceChoices().pipe(choicesToOptions()),
    { initialValue: [] },
  );

  ngOnInit(): void {
    this.loadFailoverStatus();
    this.loadFecModes();
    this.networkService.getIsHaEnabled().pipe(takeUntilDestroyed(this.destroyRef)).subscribe((isHaEnabled) => {
      this.isHaEnabled.set(isHaEnabled);
    });

    const nic = this.editInterface();
    if (nic) {
      this.setInterfaceForEdit(nic);
    }
  }

  private setInterfaceForEdit(nic: NetworkInterface): void {
    this.model.set(patchModelValue({ ...defaultModel }, toFormModel({
      ...nic,
      mtu: nic.mtu || defaultMtu,
      fec_mode: nic.fec_mode ?? null,
      aliases: interfaceAliasesToFormAliases(nic),
    })));

    if (nic.type === NetworkInterfaceType.Bridge) {
      this.bridgeMembers$ = this.networkService.getBridgeMembersChoices(nic.id).pipe(choicesToOptions());
    } else if (nic.type === NetworkInterfaceType.LinkAggregation) {
      this.lagPorts$ = this.networkService.getLaggPortsChoices(nic.id).pipe(choicesToOptions());
    }
    this.initialPhysicalBridgeMembers = this.getPhysicalBridgeMembers(this.model().bridge_members);
  }

  /** A new interface is named after its type (`br1`, `bond2`, ...) with the first number not in use. */
  protected onTypeSelected(type: NetworkInterfaceType): void {
    const name = this.isNew() ? this.generateNextAvailableNameByType(type) : null;
    if (name) {
      this.form.name().value.set(name);
    }
  }

  protected addStaticIpAddress(): void {
    this.model.update((model) => ({
      ...model,
      aliases: [...model.aliases, { address: '', failover_address: '', failover_virtual_address: '' }],
    }));
  }

  protected removeStaticIpAddress(index: number): void {
    this.model.update((model) => ({ ...model, aliases: model.aliases.filter((_, i) => i !== index) }));
  }

  protected handleSubmit = (
    event: FormSubmitEvent<InterfaceFormModel>,
  ): SubmitResult<boolean, NetworkConfigToBeRemoved> => {
    const params = this.prepareSubmitParams();
    const existingInterface = this.editInterface();

    // "Back to editing" completes the chain without emitting, so the form stays open with its values.
    const request$ = this.confirmBridgeLoopRiskIfNeeded().pipe(
      filter(Boolean),
      switchMap(() => (existingInterface
        ? this.api.call('interface.update', [existingInterface.id, toNetworkInterfaceCreateArgs(params)])
        : this.api.call('interface.create', [toNetworkInterfaceCreateArgs(params)]))),
      switchMap(() => {
        this.store$.dispatch(networkInterfacesChanged({ commit: false, checkIn: false }));
        return this.api.call('interface.network_config_to_be_removed').pipe(map(toNetworkConfigToBeRemoved));
      }),
    );

    return {
      request$,
      successMessage: event.isEdit
        ? this.translate.instant('Network interface updated')
        : this.translate.instant('Network interface created'),
      onSuccess: (configToRemove) => {
        if (configToRemove && Object.keys(configToRemove).length > 0) {
          this.tnDialog.open(DefaultGatewayDialog, {
            width: '600px',
            data: configToRemove,
          });
        }
      },
    };
  };

  /**
   * Two physical NICs in one bridge form a Layer 2 loop if the switch already connects them, and nothing
   * on this side can see that topology — so ask before staging a bridge whose physical member set is new.
   * Edits that leave that set alone don't ask again.
   */
  private confirmBridgeLoopRiskIfNeeded(): Observable<boolean> {
    if (!this.isBridge()) {
      return of(true);
    }

    const physicalMembers = this.getPhysicalBridgeMembers(this.model().bridge_members);
    const hasPhysicalMembersChanged = this.isNew() || !isEqual(physicalMembers, this.initialPhysicalBridgeMembers);
    if (physicalMembers.length < 2 || !hasPhysicalMembersChanged) {
      return of(true);
    }

    return this.dialog.confirm({
      title: this.translate.instant(this.helptext.bridgeLoopWarning.title),
      message: this.translate.instant(this.helptext.bridgeLoopWarning.message),
      hideCheckbox: true,
      buttonText: this.translate.instant('Continue'),
      cancelText: this.translate.instant('Back to editing'),
    });
  }

  /** Sorted, so a reordered selection compares equal to the one it started as. */
  private getPhysicalBridgeMembers(members: string[]): string[] {
    const physicalNames = new Set(
      this.interfacesList()
        .filter((nic) => nic.type === NetworkInterfaceType.Physical)
        .map((nic) => nic.name),
    );
    return members.filter((member) => physicalNames.has(member)).sort((a, b) => a.localeCompare(b));
  }

  private generateNextAvailableNameByType(type: NetworkInterfaceType): string | null {
    const prefix = this.interfaceNameValidator.getNamePrefix(type);
    if (!prefix) return null;

    const usedNumbers = new Set(
      this.interfacesList()
        .map((item) => new RegExp(`^${prefix}(\\d+)$`).exec(item.name))
        .filter(Boolean)
        .map((match) => Number(match[1])),
    );
    let next = 1;
    while (usedNumbers.has(next)) {
      next++;
    }
    return `${prefix}${next}`;
  }

  /**
   * FEC mode is gated on `NETWORK_FEC` and nothing else. It used to share a product-type
   * check with the failover lookup below, which gated two unrelated things at once.
   */
  private loadFecModes(): void {
    const existingInterface = this.editInterface();
    if (!existingInterface) {
      return;
    }

    this.entitlements.entitled$(EntitlementFeature.NetworkFec).pipe(
      filter(Boolean),
      take(1),
      switchMap(() => this.api.call('interface.available_fec_modes', [existingInterface.id])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((modes) => {
      this.fecModeOptions.set(modes.map((mode) => ({ label: mode, value: mode })));
    });
  }

  /** The `HA` entitlement alone decides HA here; product type must not pre-gate it. */
  private loadFailoverStatus(): void {
    this.store$.select(selectHaInfoState).pipe(
      filter((haInfo) => haInfo.isHaLicensed !== null),
      map((haInfo) => haInfo.isHaLicensed),
      take(1),
      switchMap((isHaLicensed) => (isHaLicensed
        ? this.api.call('failover.node').pipe(map((failoverNode) => [true, failoverNode] as const))
        : of([false, null] as const)
      )),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(([isHaLicensed, failoverNode]) => {
      if (!isHaLicensed) {
        return;
      }
      // Autoconfigure IPv6 is not supported on HA, so it is switched off and locked.
      this.form.ipv6_auto().value.set(false);
      this.isHaLicensed.set(true);

      if (failoverNode === 'A') {
        this.ipLabelSuffix.set(' ' + this.translate.instant('(This Controller)'));
        this.failoverLabelSuffix.set(' ' + this.translate.instant('(TrueNAS Controller 2)'));
      } else if (failoverNode === 'B') {
        this.ipLabelSuffix.set(' ' + this.translate.instant('(TrueNAS Controller 1)'));
        this.failoverLabelSuffix.set(' ' + this.translate.instant('(This Controller)'));
      }
    });
  }

  /**
   * Built field by field rather than from `activeValue()`: an existing VLAN's parent is disabled but must still
   * be sent, LAG sends its hash policy and LACPDU rate whatever the protocol (the API ignores them where they do
   * not apply), and `ipv6_auto` is sent even while HA locks it.
   */
  private prepareSubmitParams(): NetworkInterfaceCreate | NetworkInterfaceUpdate {
    const values = this.model();

    let params = {
      name: values.name,
      description: values.description,
      ipv4_dhcp: values.ipv4_dhcp,
      ipv6_auto: values.ipv6_auto,
      mtu: values.mtu,
    } as NetworkInterfaceCreate | NetworkInterfaceUpdate;

    // Under DHCP the static addresses are hidden and left out: a new interface gets none, an edited one keeps
    // what it has.
    if (this.canHaveStaticIpAddresses()) {
      const aliases = formAliasesToInterfaceAliases(values.aliases);
      params.aliases = aliases.aliases;

      if (this.isHaLicensed()) {
        params.failover_aliases = aliases.failover_aliases;
        params.failover_virtual_aliases = aliases.failover_virtual_aliases;
      }
    }

    if (this.isNew()) {
      (params as NetworkInterfaceCreate).type = values.type as unknown as CreateNetworkInterfaceType;
    }

    if (this.isBridge()) {
      params.bridge_members = values.bridge_members;
      params.enable_learning = values.enable_learning;
    } else if (this.isLag()) {
      params = {
        ...params,
        lag_protocol: values.lag_protocol as LinkAggregationProtocol,
        xmit_hash_policy: values.xmit_hash_policy,
        lacpdu_rate: values.lacpdu_rate,
        lag_ports: values.lag_ports,
      };
    } else if (this.isVlan()) {
      params = {
        ...params,
        vlan_parent_interface: values.vlan_parent_interface,
        vlan_tag: values.vlan_tag,
        vlan_pcp: values.vlan_pcp,
      };
    }

    if (this.isHaLicensed()) {
      params = {
        ...params,
        failover_critical: values.failover_critical,
        failover_group: values.failover_group,
      };
    }

    if (this.showFecMode() && values.fec_mode) {
      params.fec_mode = values.fec_mode;
    }

    return params;
  }

  protected withSuffix(label: string, suffix: string): TranslatedString {
    return (label + suffix) as TranslatedString;
  }
}
