import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { range } from 'lodash';
import { forkJoin, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
  CreateNetworkInterfaceType,
  LacpduRate,
  LinkAggregationProtocol,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { choicesToOptions, singleArrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/network/interfaces/interfaces-form';
import {
  NetworkInterface,
  NetworkInterfaceCreate,
  NetworkInterfaceUpdate,
} from 'app/interfaces/network-interface.interface';
import { ipv4or6cidrValidator, ipv4or6Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { rangeValidator } from 'app/modules/entity/entity-form/validators/range-validation';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import {
  DefaultGatewayDialogComponent,
} from 'app/pages/network/components/default-gateway-dialog/default-gateway-dialog.component';
import {
  InterfaceNameValidatorService,
} from 'app/pages/network/components/interface-form/interface-name-validator.service';
import {
  formAliasesToInterfaceAliases,
  interfaceAliasesToFormAliases,
  NetworkInterfaceFormAlias,
} from 'app/pages/network/components/interface-form/network-interface-alias-control.interface';
import { NetworkService, SystemGeneralService, WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './interface-form.component.html',
  styleUrls: ['./interface-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InterfaceNameValidatorService],
})
export class InterfaceFormComponent implements OnInit {
  readonly defaultMtu = 1500;

  isLoading = false;
  isHa = false;
  ipLabelSuffix = '';
  failoverLabelSuffix = '';

  form = this.formBuilder.group({
    type: [null as NetworkInterfaceType, Validators.required],
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

    // Lag fields
    lag_protocol: [LinkAggregationProtocol.None],
    xmit_hash_policy: [XmitHashPolicy.Layer2Plus3],
    lacpdu_rate: [LacpduRate.Slow],
    lag_ports: [[] as string[]],

    // Vlan fields
    vlan_parent_interface: [''],
    vlan_tag: [null as number, rangeValidator(1, 4094)],
    vlan_pcp: [null as number],

    // Failover
    failover_critical: [false],
    failover_group: [null as number],

    mtu: [this.defaultMtu, rangeValidator(1492, 9216)],

    // Aliases
    aliases: this.formBuilder.array<NetworkInterfaceFormAlias>([]),
  });

  interfaceTypes$ = of([
    { label: this.translate.instant('Bridge'), value: NetworkInterfaceType.Bridge },
    { label: this.translate.instant('Link Aggregation'), value: NetworkInterfaceType.LinkAggregation },
    { label: 'VLAN', value: NetworkInterfaceType.Vlan },
  ]);

  bridgeMembers$ = this.networkService.getBridgeMembersChoices().pipe(choicesToOptions());

  lagProtocols$ = this.networkService.getLaggProtocolChoices().pipe(singleArrayToOptions());
  lagPorts$ = this.networkService.getLaggPortsChoices().pipe(choicesToOptions());
  xmitHashPolicies$ = this.ws.call('interface.xmit_hash_policy_choices').pipe(choicesToOptions());
  lacpduRates$ = this.ws.call('interface.lacpdu_rate_choices').pipe(choicesToOptions());

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

  readonly helptext = helptext;

  private existingInterface: NetworkInterface;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private networkService: NetworkService,
    private errorHandler: FormErrorHandlerService,
    private slideInService: IxSlideInService,
    private core: CoreService,
    private validatorsService: IxValidatorsService,
    private interfaceFormValidator: InterfaceNameValidatorService,
    private matDialog: MatDialog,
    private systemGeneralService: SystemGeneralService,
  ) {}

  get isNew(): boolean {
    return !this.existingInterface;
  }

  get isVlan(): boolean {
    return this.form.get('type').value === NetworkInterfaceType.Vlan;
  }

  get isBridge(): boolean {
    return this.form.get('type').value === NetworkInterfaceType.Bridge;
  }

  get isLag(): boolean {
    return this.form.get('type').value === NetworkInterfaceType.LinkAggregation;
  }

  get isLacpLag(): boolean {
    return this.form.get('lag_protocol').value === LinkAggregationProtocol.Lacp;
  }

  get isFailover(): boolean {
    return this.form.get('lag_protocol').value === LinkAggregationProtocol.Failover;
  }

  get isLoadBalanceLag(): boolean {
    return this.form.get('lag_protocol').value === LinkAggregationProtocol.LoadBalance;
  }

  get canHaveAliases(): boolean {
    return !this.form.value.ipv4_dhcp && !this.form.value.ipv6_auto;
  }

  ngOnInit(): void {
    this.loadFailoverStatus();
    this.validateNameOnTypeChange();
  }

  setInterfaceForEdit(interfaceToEdit: NetworkInterface): void {
    this.existingInterface = interfaceToEdit;
    interfaceToEdit.aliases.forEach(() => this.addAlias());
    this.form.patchValue({
      ...interfaceToEdit,
      mtu: interfaceToEdit.mtu || this.defaultMtu,
      aliases: interfaceAliasesToFormAliases(interfaceToEdit),
    });

    this.setOptionsForEdit();
    this.disableVlanParentInterface();
  }

  addAlias(): void {
    this.form.controls.aliases.push(this.formBuilder.group({
      address: ['', [Validators.required, ipv4or6cidrValidator()]],
      failover_address: ['', [
        this.validatorsService.validateOnCondition(
          () => this.isHa,
          Validators.required,
        ),
        ipv4or6Validator(),
      ]],
      failover_virtual_address: ['', [
        this.validatorsService.validateOnCondition(
          () => this.isHa,
          Validators.required,
        ),
        ipv4or6Validator(),
      ]],
    }));
  }

  removeAlias(index: number): void {
    this.form.controls.aliases.removeAt(index);
  }

  onSubmit(): void {
    this.isLoading = true;
    const params = this.prepareSubmitParams();

    const request$ = this.isNew
      ? this.ws.call('interface.create', [params])
      : this.ws.call('interface.update', [this.existingInterface.id, params]);

    request$.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isLoading = false;
        this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false, checkin: false }, sender: this });
        this.slideInService.close();

        this.ws.call('interface.default_route_will_be_removed').pipe(
          filter(Boolean),
          untilDestroyed(this),
        ).subscribe(() => {
          this.matDialog.open(DefaultGatewayDialogComponent, {
            width: '600px',
          });
        });

        this.cdr.markForCheck();
      },
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }

  private validateNameOnTypeChange(): void {
    this.form.controls.type.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      setTimeout(() => {
        this.form.controls.name.updateValueAndValidity();
      });
    });
  }

  private setOptionsForEdit(): void {
    if (this.isBridge) {
      this.bridgeMembers$ = this.networkService
        .getBridgeMembersChoices(this.existingInterface.id)
        .pipe(choicesToOptions());
    } else if (this.isLag) {
      this.lagPorts$ = this.networkService
        .getLaggPortsChoices(this.existingInterface.id)
        .pipe(choicesToOptions());
    }
  }

  private loadFailoverStatus(): void {
    if (this.systemGeneralService.getProductType() !== ProductType.ScaleEnterprise) {
      return;
    }

    forkJoin([
      this.ws.call('failover.licensed'),
      this.ws.call('failover.node'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([isHa, failoverNode]) => {
        this.isHa = isHa;
        if (isHa) {
          if (failoverNode === 'A') {
            this.ipLabelSuffix = ' ' + this.translate.instant('(This Controller)');
            this.failoverLabelSuffix = ' ' + this.translate.instant('(TrueNAS Controller 2)');
          } else if (failoverNode === 'B') {
            this.ipLabelSuffix = ' ' + this.translate.instant('(TrueNAS Controller 1)');
            this.failoverLabelSuffix = ' ' + this.translate.instant('(This Controller)');
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

    if (this.isHa) {
      params.failover_aliases = aliases.failover_aliases;
      params.failover_virtual_aliases = aliases.failover_virtual_aliases;
    }

    if (this.isNew) {
      (params as NetworkInterfaceCreate).type = formValues.type as unknown as CreateNetworkInterfaceType;
    }

    if (this.isBridge) {
      params.bridge_members = formValues.bridge_members;
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

    if (this.isHa) {
      params = {
        ...params,
        failover_critical: formValues.failover_critical,
        failover_group: formValues.failover_group,
      };
    }

    return params;
  }
}
