import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal, inject } from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { FormBuilder, FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { range } from 'lodash-es';
import {
  BehaviorSubject, EMPTY, forkJoin, of,
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
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
import {
  NetworkInterface,
  NetworkInterfaceCreate,
  NetworkInterfaceUpdate,
} from 'app/interfaces/network-interface.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxIpInputWithNetmaskComponent } from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4or6cidrValidator, ipv4or6Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TranslatedString } from 'app/modules/translate/translate.helper';
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
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { NetworkService } from 'app/services/network.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-interface-form',
  templateUrl: './interface-form.component.html',
  styleUrls: ['./interface-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InterfaceNameValidatorService],
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxSelectComponent,
    IxInputComponent,
    IxCheckboxComponent,
    OrderedListboxComponent,
    IxListComponent,
    IxListItemComponent,
    IxIpInputWithNetmaskComponent,
    IxErrorsComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
    AsyncPipe,
    IxRadioGroupComponent,
    MatTooltip,
  ],
})
export class InterfaceFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private networkService = inject(NetworkService);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private validatorsService = inject(IxValidatorsService);
  private interfaceFormValidator = inject(InterfaceNameValidatorService);
  private matDialog = inject(MatDialog);
  private systemGeneralService = inject(SystemGeneralService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<{
    interfaces?: NetworkInterface[];
    interface?: NetworkInterface;
  }, boolean>>(SlideInRef);

  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];
  protected existingInterface: NetworkInterface | undefined;

  readonly defaultMtu = 1500;
  protected readonly isHaEnabled$ = new BehaviorSubject(false);

  protected isLoading = signal(false);
  isHaLicensed = false;
  ipLabelSuffix: TranslatedString = '';
  failoverLabelSuffix: TranslatedString = '';

  form = this.formBuilder.group({
    type: new FormControl(null as NetworkInterfaceType | null, Validators.required),
    name: ['', [
      Validators.required,
      this.interfaceFormValidator.validate,
    ]],
    description: [''],
    ipv4_dhcp: [false],
    ipv6_auto: [false],

    // Bridge fields
    bridge_members: [[] as string[]],
    stp: [true],
    enable_learning: [true],

    // Lag fields
    lag_protocol: [LinkAggregationProtocol.None],
    xmit_hash_policy: [XmitHashPolicy.Layer2Plus3],
    lacpdu_rate: [LacpduRate.Slow],
    lag_ports: [[] as string[]],

    // Vlan fields
    vlan_parent_interface: [''],
    vlan_tag: new FormControl(null as number | null, rangeValidator(1, 4094)),
    vlan_pcp: new FormControl(null as number | null),

    // Failover
    failover_critical: [false],
    failover_group: new FormControl(null as number | null),

    mtu: [this.defaultMtu, rangeValidator(68, 9216)],

    // Aliases
    aliases: this.formBuilder.array<NetworkInterfaceFormAlias>([]),
  });

  interfaceTypes$ = of([
    { label: this.translate.instant('Bridge'), value: NetworkInterfaceType.Bridge },
    { label: this.translate.instant('Link Aggregation'), value: NetworkInterfaceType.LinkAggregation },
    { label: 'VLAN', value: NetworkInterfaceType.Vlan },
  ]);

  dhcpOptions$ = of([
    { label: this.translate.instant('Get IP Address Automatically from DHCP'), value: true },
    { label: this.translate.instant('Define Static IP Addresses'), value: false },
  ]);

  bridgeMembers$ = this.networkService.getBridgeMembersChoices().pipe(choicesToOptions());

  lagProtocols$ = this.networkService.getLaggProtocolChoices().pipe(singleArrayToOptions());
  lagPorts$ = this.networkService.getLaggPortsChoices().pipe(choicesToOptions());
  xmitHashPolicies$ = this.api.call('interface.xmit_hash_policy_choices').pipe(choicesToOptions());
  lacpduRates$ = this.api.call('interface.lacpdu_rate_choices').pipe(choicesToOptions());

  vlanPcpOptions$ = of([
    { value: 0, label: this.translate.instant('Best effort (default)') },
    { value: 1, label: this.translate.instant('Background (lowest)') },
    { value: 2, label: this.translate.instant('Excellent effort') },
    { value: 3, label: this.translate.instant('Critical applications') },
    { value: 4, label: this.translate.instant('Video, < 100ms latency') },
    { value: 5, label: this.translate.instant('Video, < 10ms latency') },
    { value: 6, label: this.translate.instant('Internetwork control') },
    { value: 7, label: this.translate.instant('Network control (highest)') },
  ]);

  vlanParentInterfaces$ = this.networkService.getVlanParentInterfaceChoices().pipe(choicesToOptions());

  failoverGroups$ = of(range(1, 32)).pipe(singleArrayToOptions());

  readonly helptext = helptextInterfacesForm;

  constructor() {
    const slideInRef = this.slideInRef;

    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.existingInterface = slideInRef.getData()?.interface;
  }

  get isNew(): boolean {
    return !this.existingInterface;
  }

  get isVlan(): boolean {
    return this.form.controls.type.value === NetworkInterfaceType.Vlan;
  }

  get isBridge(): boolean {
    return this.form.controls.type.value === NetworkInterfaceType.Bridge;
  }

  get isLag(): boolean {
    return this.form.controls.type.value === NetworkInterfaceType.LinkAggregation;
  }

  get isLacpLag(): boolean {
    return this.form.controls.lag_protocol.value === LinkAggregationProtocol.Lacp;
  }

  get isFailover(): boolean {
    return this.form.controls.lag_protocol.value === LinkAggregationProtocol.Failover;
  }

  get isLoadBalanceLag(): boolean {
    return this.form.controls.lag_protocol.value === LinkAggregationProtocol.LoadBalance;
  }

  get canHaveStaticIpAddresses(): boolean {
    return !this.form.value.ipv4_dhcp;
  }

  ngOnInit(): void {
    this.loadFailoverStatus();
    this.validateNameOnTypeChange();
    this.checkFailoverDisabled();

    if (this.existingInterface) {
      this.setInterfaceForEdit(this.existingInterface);
    }
  }

  private checkFailoverDisabled(): void {
    this.networkService.getIsHaEnabled().pipe(
      untilDestroyed(this),
    ).subscribe((isHaEnabled) => {
      this.isHaEnabled$.next(isHaEnabled);
    });
  }

  private setInterfaceForEdit(nic: NetworkInterface): void {
    nic.aliases.forEach(() => this.addStaticIpAddress());
    this.form.patchValue({
      ...nic,
      mtu: nic.mtu || this.defaultMtu,
      aliases: interfaceAliasesToFormAliases(nic),
    });

    this.setOptionsForEdit(nic);
    this.disableVlanParentInterface();
  }

  protected addStaticIpAddress(): void {
    this.form.controls.aliases.push(this.formBuilder.group({
      address: ['', [Validators.required, ipv4or6cidrValidator()]],
      failover_address: ['', [
        this.validatorsService.validateOnCondition(
          () => this.isHaLicensed,
          Validators.required,
        ),
        ipv4or6Validator(),
      ]],
      failover_virtual_address: ['', [
        this.validatorsService.validateOnCondition(
          () => this.isHaLicensed,
          Validators.required,
        ),
        ipv4or6Validator(),
      ]],
    }));
  }

  protected removeStaticIpAddress(index: number): void {
    this.form.controls.aliases.removeAt(index);
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    const params = this.prepareSubmitParams();

    const request$ = this.existingInterface
      ? this.api.call('interface.update', [this.existingInterface.id, params])
      : this.api.call('interface.create', [params]);

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.store$.dispatch(networkInterfacesChanged({ commit: false, checkIn: false }));

        this.api.call('interface.network_config_to_be_removed').pipe(untilDestroyed(this)).subscribe((configToRemove) => {
          if (configToRemove && Object.keys(configToRemove).length > 0) {
            this.matDialog.open(DefaultGatewayDialog, {
              width: '600px',
              data: configToRemove,
            });
          }

          this.slideInRef.close({ response: true });
          this.isLoading.set(false);
          this.snackbar.success(this.translate.instant('Network interface updated'));
        });
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }

  private generateNextAvailableNameByType(type: NetworkInterfaceType): string | null {
    const interfaces = this.slideInRef.getData()?.interfaces ?? [];
    const prefix = this.getPrefixByType(type);
    if (!prefix) return null;

    const usedNumbers = this.getUsedNumbersForPrefix(interfaces, prefix);
    const nextAvailableNumber = this.findNextAvailableNumber(usedNumbers);

    return `${prefix}${nextAvailableNumber}`;
  }

  private getPrefixByType(type: NetworkInterfaceType): string | null {
    switch (type) {
      case NetworkInterfaceType.LinkAggregation:
        return 'bond';
      case NetworkInterfaceType.Bridge:
        return 'br';
      case NetworkInterfaceType.Vlan:
        return 'vlan';
      default:
        return null;
    }
  }

  private getUsedNumbersForPrefix(interfaces: NetworkInterface[], prefix: string): Set<number> {
    return new Set(
      interfaces
        .map((item) => new RegExp(`^${prefix}(\\d+)$`).exec(item.name))
        .filter(Boolean)
        .map((match) => Number(match[1])),
    );
  }

  private findNextAvailableNumber(usedNumbers: Set<number>): number {
    const sorted = Array.from(usedNumbers).sort((a, b) => a - b);
    for (let i = 1; i <= sorted.length + 1; i++) {
      if (!usedNumbers.has(i)) {
        return i;
      }
    }
    return sorted.length + 1;
  }

  private validateNameOnTypeChange(): void {
    this.form.controls.type.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((type: NetworkInterfaceType) => {
        if (!this.existingInterface) {
          const name = this.generateNextAvailableNameByType(type);
          if (name) {
            this.form.controls.name.patchValue(name, { emitEvent: false });
          }
        }

        setTimeout(() => {
          this.form.controls.name.updateValueAndValidity();
        });
      });
  }

  private setOptionsForEdit(nic: NetworkInterface): void {
    if (this.isBridge) {
      this.bridgeMembers$ = this.networkService
        .getBridgeMembersChoices(nic.id)
        .pipe(choicesToOptions());
    } else if (this.isLag) {
      this.lagPorts$ = this.networkService
        .getLaggPortsChoices(nic.id)
        .pipe(choicesToOptions());
    }
  }

  private loadFailoverStatus(): void {
    this.store$.select(selectIsEnterprise).pipe(
      switchMap((isEnterprise) => {
        if (!isEnterprise) {
          return EMPTY;
        }

        return forkJoin([
          this.api.call('failover.licensed'),
          this.api.call('failover.node'),
        ]);
      }),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(([isHaLicensed, failoverNode]) => {
      this.isHaLicensed = isHaLicensed;
      if (isHaLicensed) {
        if (failoverNode === 'A') {
          this.ipLabelSuffix = ' ' + this.translate.instant('(This Controller)') as TranslatedString;
          this.failoverLabelSuffix = ' ' + this.translate.instant('(TrueNAS Controller 2)') as TranslatedString;
        } else if (failoverNode === 'B') {
          this.ipLabelSuffix = ' ' + this.translate.instant('(TrueNAS Controller 1)') as TranslatedString;
          this.failoverLabelSuffix = ' ' + this.translate.instant('(This Controller)') as TranslatedString;
        }
      }
      this.cdr.markForCheck();
    });
  }

  private disableVlanParentInterface(): void {
    if (!this.isVlan) {
      return;
    }

    this.form.controls.vlan_parent_interface.disable();
  }

  private prepareSubmitParams(): NetworkInterfaceCreate | NetworkInterfaceUpdate {
    const formValues = this.form.value;
    let params = {
      name: formValues.name,
      description: formValues.description,
      ipv4_dhcp: formValues.ipv4_dhcp,
      ipv6_auto: formValues.ipv6_auto,
      mtu: formValues.mtu,
    } as NetworkInterfaceCreate | NetworkInterfaceUpdate;

    const aliases = formAliasesToInterfaceAliases(formValues.aliases);
    params.aliases = aliases.aliases;

    if (this.isHaLicensed) {
      params.failover_aliases = aliases.failover_aliases;
      params.failover_virtual_aliases = aliases.failover_virtual_aliases;
    }

    if (this.isNew) {
      (params as NetworkInterfaceCreate).type = formValues.type as unknown as CreateNetworkInterfaceType;
    }

    if (this.isBridge) {
      params.bridge_members = formValues.bridge_members;
      params.enable_learning = formValues.enable_learning;
    } else if (this.isLag) {
      params = {
        ...params,
        lag_protocol: formValues.lag_protocol,
        xmit_hash_policy: formValues.xmit_hash_policy,
        lacpdu_rate: formValues.lacpdu_rate,
        lag_ports: formValues.lag_ports,
      };
    } else if (this.isVlan) {
      params = {
        ...params,
        vlan_parent_interface: formValues.vlan_parent_interface,
        vlan_tag: formValues.vlan_tag,
        vlan_pcp: formValues.vlan_pcp,
      };
    }

    if (this.isHaLicensed) {
      params = {
        ...params,
        failover_critical: formValues.failover_critical,
        failover_group: formValues.failover_group,
      };
    }

    return params;
  }

  protected asTranslatedString(string: string): TranslatedString {
    return string as TranslatedString;
  }
}
