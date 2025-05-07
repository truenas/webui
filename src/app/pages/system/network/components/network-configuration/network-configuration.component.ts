import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, signal,
} from '@angular/core';
import { Validators, ReactiveFormsModule, NonNullableFormBuilder } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { Role } from 'app/enums/role.enum';
import { arrayToOptions } from 'app/helpers/operators/options.operators';
import { helptextNetworkConfiguration } from 'app/helptext/network/configuration/configuration';
import {
  NetworkConfiguration, NetworkConfigurationActivity, NetworkConfigurationConfig, NetworkConfigurationUpdate,
} from 'app/interfaces/network-configuration.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ipv4Validator, ipv6Validator } from 'app/modules/forms/ix-forms/validators/ip-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { systemInfoUpdated } from 'app/store/system-info/system-info.actions';

@UntilDestroy()
@Component({
  selector: 'ix-network-configuration',
  templateUrl: './network-configuration.component.html',
  styleUrls: ['./network-configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxCheckboxComponent,
    IxChipsComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class NetworkConfigurationComponent implements OnInit {
  protected readonly requiredRoles = [Role.NetworkGeneralWrite];

  protected isFormLoading = signal(false);

  form = this.fb.group({
    hostname: ['', Validators.required],
    hostname_b: [null as string | null],
    hostname_virtual: [null as string | null],
    inherit_dhcp: [false],
    domain: [''],
    domains: [[] as string[]],
    netbios: [false],
    mdns: [false],
    wsd: [false],
    nameserver1: [''],
    nameserver2: [''],
    nameserver3: [''],
    ipv4gateway: ['', ipv4Validator()],
    ipv6gateway: ['', ipv6Validator()],
    outbound_network_activity: [NetworkActivityType.Deny],
    outbound_network_value: [[] as string[]],
    httpproxy: [''],
    hosts: [[] as string[]],
  });

  readonly helptext = helptextNetworkConfiguration;

  hostname = {
    fcName: 'hostname',
    label: helptextNetworkConfiguration.hostnameLabel,
  };

  hostnameB = {
    fcName: 'hostname_b',
    label: helptextNetworkConfiguration.bHostnameLabel,
    hidden: true,
  };

  hostnameVirtual = {
    fcName: 'hostname_virtual',
    label: helptextNetworkConfiguration.hostnameVirtualLabel,
    tooltip: helptextNetworkConfiguration.hostnameVirtualTooltip,
    hidden: true,
  };

  inheritDhcp = {
    fcName: 'inherit_dhcp',
    label: helptextNetworkConfiguration.inheritDhcpPlaceholder,
  };

  domain = {
    fcName: 'domain',
    label: helptextNetworkConfiguration.domainLabel,
    tooltip: helptextNetworkConfiguration.domainTooltip,
  };

  domains = {
    fcName: 'domains',
    label: helptextNetworkConfiguration.domainsLabel,
    tooltip: helptextNetworkConfiguration.domainsTooltip,
  };

  netbios = {
    fcName: 'netbios',
    label: helptextNetworkConfiguration.netbiosLabel,
    tooltip: helptextNetworkConfiguration.netbiosTooltip,
  };

  mdns = {
    fcName: 'mdns',
    label: helptextNetworkConfiguration.mdnsLabel,
    tooltip: helptextNetworkConfiguration.mdnsTooltip,
  };

  wsd = {
    fcName: 'wsd',
    label: helptextNetworkConfiguration.wsdLabel,
    tooltip: helptextNetworkConfiguration.wsdTooltip,
  };

  nameserver1 = {
    fcName: 'nameserver1',
    label: helptextNetworkConfiguration.nameserver1Label,
    tooltip: helptextNetworkConfiguration.nameserver1Tooltip,
  };

  nameserver2 = {
    fcName: 'nameserver2',
    label: helptextNetworkConfiguration.nameserver2Label,
    tooltip: helptextNetworkConfiguration.nameserver2Tooltip,
  };

  nameserver3 = {
    fcName: 'nameserver3',
    label: helptextNetworkConfiguration.nameserver3Label,
    tooltip: helptextNetworkConfiguration.nameserver3Tooltip,
  };

  ipv4gateway = {
    fcName: 'ipv4gateway',
    label: helptextNetworkConfiguration.ipv4gatewayLabel,
    tooltip: helptextNetworkConfiguration.ipv4gatewayTooltip,
  };

  ipv6gateway = {
    fcName: 'ipv6gateway',
    label: helptextNetworkConfiguration.ipv6gatewayLabel,
    tooltip: helptextNetworkConfiguration.ipv6gatewayTooltip,
  };

  outboundNetworkActivity = {
    fcName: 'outbound_network_activity',
    label: helptextNetworkConfiguration.outboundActivity,
    tooltip: '',
    options: of([
      // Mismatch between enum and label is expected.
      // We will send empty list of services when Allow All or Deny All is selected.
      // I.e. selecting 'Allow All' will send Deny [], effectively allowing all services.
      {
        label: helptextNetworkConfiguration.outboundNetworkActivity.allow.label,
        value: NetworkActivityType.Deny,
        tooltip: helptextNetworkConfiguration.outboundNetworkActivity.allow.tooltip,
      },
      {
        label: helptextNetworkConfiguration.outboundNetworkActivity.deny.label,
        value: NetworkActivityType.Allow,
        tooltip: helptextNetworkConfiguration.outboundNetworkActivity.deny.tooltip,
      },
      {
        label: helptextNetworkConfiguration.outboundNetworkActivity.specific.label,
        value: 'SPECIFIC',
        tooltip: helptextNetworkConfiguration.outboundNetworkActivity.specific.tooltip,
      },
    ]),
  };

  outboundNetworkValue = {
    fcName: 'outbound_network_value',
    label: helptextNetworkConfiguration.outboundNetworkValue.label,
    tooltip: helptextNetworkConfiguration.outboundNetworkValue.tooltip,
    options: this.api.call('network.configuration.activity_choices').pipe(arrayToOptions()),
    hidden: true,
  };

  httpproxy = {
    fcName: 'httpproxy',
    label: helptextNetworkConfiguration.httpproxyLabel,
    tooltip: helptextNetworkConfiguration.httpproxyTooltip,
  };

  hosts = {
    fcName: 'hosts',
    label: helptextNetworkConfiguration.hostsLabel,
    tooltip: helptextNetworkConfiguration.hostsTooltip,
  };

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: NonNullableFormBuilder,
    private systemGeneralService: SystemGeneralService,
    private store$: Store<AppState>,
    public slideInRef: SlideInRef<undefined, boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    this.isFormLoading.set(true);
    this.loadConfig();

    this.form.controls.outbound_network_activity.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: NetworkActivityType) => {
        if ([NetworkActivityType.Allow, NetworkActivityType.Deny].includes(value)) {
          this.outboundNetworkValue.hidden = true;
        } else {
          this.outboundNetworkValue.hidden = false;
        }
      },
    );

    this.form.controls.inherit_dhcp.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: boolean) => {
        if (value) {
          this.form.controls.domain.disable();
        } else {
          this.form.controls.domain.enable();
        }
      },
    );

    if (this.systemGeneralService.getProductType() === ProductType.Enterprise) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.hostnameB.hidden = !isHaLicensed;
        this.hostnameVirtual.hidden = !isHaLicensed;
      });
    }
  }

  private loadConfig(): void {
    this.api.call('network.configuration.config')
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (config: NetworkConfiguration) => {
          const transformed: NetworkConfigurationConfig = {
            hostname: config.hostname,
            hostname_b: config.hostname_b,
            hostname_virtual: config.hostname_virtual,
            inherit_dhcp: config.domain === '',
            domain: config.domain,
            domains: config.domains,
            nameserver1: config.nameserver1 || config.state.nameserver1,
            nameserver2: config.nameserver2 || config.state.nameserver2,
            nameserver3: config.nameserver3 || config.state.nameserver3,
            ipv4gateway: config.ipv4gateway || config.state.ipv4gateway,
            ipv6gateway: config.ipv6gateway || config.state.ipv6gateway,
            outbound_network_activity: NetworkActivityType.Allow,
            outbound_network_value: [],
            httpproxy: config.httpproxy,
            hosts: config.hosts,
            netbios: config.service_announcement.netbios,
            mdns: config.service_announcement.mdns,
            wsd: config.service_announcement.wsd,
          };

          if (config.activity) {
            if (config.activity.activities.length === 0) {
              transformed.outbound_network_activity = config.activity.type;
            } else if (config.activity.type === NetworkActivityType.Allow) {
              transformed.outbound_network_activity = 'SPECIFIC' as NetworkActivityType;
              transformed.outbound_network_value = config.activity.activities;
            }
          }

          this.form.patchValue(transformed);
          this.isFormLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.isFormLoading.set(false);
        },
      });
  }

  onSubmit(): void {
    const values = { ...this.form.value };
    let activity: NetworkConfigurationActivity;

    if (
      values.outbound_network_activity
      && [NetworkActivityType.Allow, NetworkActivityType.Deny].includes(values.outbound_network_activity)
    ) {
      activity = { type: values.outbound_network_activity, activities: [] };
    } else {
      activity = { type: NetworkActivityType.Allow, activities: values.outbound_network_value || [] };
    }

    if (values.inherit_dhcp) {
      values.domain = '';
    }

    const serviceAnnouncement = {
      netbios: values.netbios as false,
      mdns: values.mdns as true,
      wsd: values.wsd as true,
    };
    delete values.netbios;
    delete values.mdns;
    delete values.wsd;

    delete values.outbound_network_activity;
    delete values.outbound_network_value;
    delete values.inherit_dhcp;

    const params = {
      ...values,
      activity,
      service_announcement: serviceAnnouncement,
    };

    this.isFormLoading.set(true);
    this.api.call('network.configuration.update', [params] as [NetworkConfigurationUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.store$.dispatch(systemInfoUpdated());
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
