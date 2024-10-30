import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { range } from 'lodash-es';
import { forkJoin, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import {
  CreateNetworkInterfaceType,
  LacpduRate,
  LinkAggregationProtocol,
  NetworkInterfaceType,
  XmitHashPolicy,
} from 'app/enums/network-interface.enum';
import { ProductType } from 'app/enums/product-type.enum';
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
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { ipv4or6cidrValidator, ipv4or6Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { rangeValidator } from 'app/modules/forms/ix-forms/validators/range-validation/range-validation';
import { OrderedListboxComponent } from 'app/modules/lists/ordered-list/ordered-list.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
import { NetworkService } from 'app/services/network.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@UntilDestroy()
@Component({
  selector: 'ix-interface-form',
  templateUrl: './interface-form.component.html',
  styleUrls: ['./interface-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [InterfaceNameValidatorService],
  standalone: true,
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
  ],
})
export class InterfaceFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.NetworkInterfaceWrite];

  readonly defaultMtu = 1500;

  isLoading = false;
  isHaLicensed = false;
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
    enable_learning: [true],

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

    mtu: [this.defaultMtu, rangeValidator(68, 9216)],

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

  readonly helptext = helptextInterfacesForm;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private translate: TranslateService,
    private networkService: NetworkService,
    private errorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    private validatorsService: IxValidatorsService,
    private interfaceFormValidator: InterfaceNameValidatorService,
    private matDialog: MatDialog,
    private systemGeneralService: SystemGeneralService,
    private slideInRef: SlideInRef<InterfaceFormComponent>,
    private store$: Store<AppState>,
    @Inject(SLIDE_IN_DATA) private existingInterface: NetworkInterface,
  ) {}

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

  get canHaveAliases(): boolean {
    return !this.form.value.ipv4_dhcp;
  }

  ngOnInit(): void {
    this.loadFailoverStatus();
    this.validateNameOnTypeChange();

    if (this.existingInterface) {
      this.setInterfaceForEdit();
    }
  }

  setInterfaceForEdit(): void {
    this.existingInterface.aliases.forEach(() => this.addAlias());
    this.form.patchValue({
      ...this.existingInterface,
      mtu: this.existingInterface.mtu || this.defaultMtu,
      aliases: interfaceAliasesToFormAliases(this.existingInterface),
    });

    this.setOptionsForEdit();
    this.disableVlanParentInterface();
  }

  addAlias(): void {
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
        this.store$.dispatch(networkInterfacesChanged({ commit: false, checkIn: false }));

        this.ws.call('interface.default_route_will_be_removed').pipe(untilDestroyed(this)).subscribe((approved) => {
          if (approved) {
            this.matDialog.open(DefaultGatewayDialogComponent, {
              width: '600px',
            });
          }

          this.slideInRef.close(true);
          this.isLoading = false;
          this.snackbar.success(this.translate.instant('Network interface updated'));
        });

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
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
      .subscribe(([isHaLicensed, failoverNode]) => {
        this.isHaLicensed = isHaLicensed;
        if (isHaLicensed) {
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
}
