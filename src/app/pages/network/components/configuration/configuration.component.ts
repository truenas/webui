import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { arrayToOptions } from 'app/helpers/operators/options.operators';
import helptext from 'app/helptext/network/configuration/configuration';
import {
  NetworkConfiguration, NetworkConfigurationActivity, NetworkConfigurationConfig, NetworkConfigurationUpdate,
} from 'app/interfaces/network-configuration.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ipv4Validator, ipv6Validator } from 'app/modules/ix-forms/validators/ip-validation';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  templateUrl: './configuration.component.html',
  styleUrls: ['./configuration.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkConfigurationComponent implements OnInit {
  isFormLoading = false;

  form = this.fb.group({
    hostname: ['', Validators.required],
    hostname_b: [null as string],
    hostname_virtual: [null as string],
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

  readonly helptext = helptext;

  hostname = {
    fcName: 'hostname',
    label: helptext.hostname_placeholder,
    tooltip: helptext.hostname_tooltip,
  };

  hostnameB = {
    fcName: 'hostname_b',
    label: helptext.hostname_b_placeholder,
    tooltip: helptext.hostname_b_tooltip,
    hidden: true,
  };

  hostnameVirtual = {
    fcName: 'hostname_virtual',
    label: helptext.hostname_virtual_placeholder,
    tooltip: helptext.hostname_virtual_tooltip,
    hidden: true,
  };

  inheritDhcp = {
    fcName: 'inherit_dhcp',
    label: helptext.inherit_dhcp_placeholder,
    tooltip: helptext.inherit_dhcp_tooltip,
  };

  domain = {
    fcName: 'domain',
    label: helptext.domain_placeholder,
    tooltip: helptext.domain_tooltip,
  };

  domains = {
    fcName: 'domains',
    label: helptext.domains_placeholder,
    tooltip: helptext.domains_tooltip,
  };

  netbios = {
    fcName: 'netbios',
    label: helptext.netbios_placeholder,
    tooltip: helptext.netbios_tooltip,
  };

  mdns = {
    fcName: 'mdns',
    label: helptext.mdns_placeholder,
    tooltip: helptext.mdns_tooltip,
  };

  wsd = {
    fcName: 'wsd',
    label: helptext.wsd_placeholder,
    tooltip: helptext.wsd_tooltip,
  };

  nameserver1 = {
    fcName: 'nameserver1',
    label: helptext.nameserver1_placeholder,
    tooltip: helptext.nameserver1_tooltip,
  };

  nameserver2 = {
    fcName: 'nameserver2',
    label: helptext.nameserver2_placeholder,
    tooltip: helptext.nameserver2_tooltip,
  };

  nameserver3 = {
    fcName: 'nameserver3',
    label: helptext.nameserver3_placeholder,
    tooltip: helptext.nameserver3_tooltip,
  };

  ipv4gateway = {
    fcName: 'ipv4gateway',
    label: helptext.ipv4gateway_placeholder,
    tooltip: helptext.ipv4gateway_tooltip,
  };

  ipv6gateway = {
    fcName: 'ipv6gateway',
    label: helptext.ipv6gateway_placeholder,
    tooltip: helptext.ipv6gateway_tooltip,
  };

  outboundNetworkActivity = {
    fcName: 'outbound_network_activity',
    label: helptext.outbound_activity,
    tooltip: '',
    options: of([
      // Mismatch between enum and label is expected.
      // We will send empty list of services when Allow All or Deny All is selected.
      // I.e. selecting 'Allow All' will send Deny [], effectively allowing all services.
      {
        label: helptext.outbound_network_activity.allow.placeholder,
        value: NetworkActivityType.Deny,
        tooltip: helptext.outbound_network_activity.allow.tooltip,
      },
      {
        label: helptext.outbound_network_activity.deny.placeholder,
        value: NetworkActivityType.Allow,
        tooltip: helptext.outbound_network_activity.deny.tooltip,
      },
      {
        label: helptext.outbound_network_activity.specific.placeholder,
        value: 'SPECIFIC',
        tooltip: helptext.outbound_network_activity.specific.tooltip,
      },
    ]),
  };

  outboundNetworkValue = {
    fcName: 'outbound_network_value',
    label: helptext.outbound_network_value.placeholder,
    tooltip: helptext.outbound_network_value.tooltip,
    options: this.ws.call('network.configuration.activity_choices').pipe(arrayToOptions()),
    hidden: true,
  };

  httpproxy = {
    fcName: 'httpproxy',
    label: helptext.httpproxy_placeholder,
    tooltip: helptext.httpproxy_tooltip,
  };

  hosts = {
    fcName: 'hosts',
    label: helptext.hosts_placeholder,
    tooltip: helptext.hosts_tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private slideInRef: IxSlideInRef<NetworkConfigurationComponent>,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
    private systemGeneralService: SystemGeneralService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
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

    if (this.systemGeneralService.getProductType() === ProductType.ScaleEnterprise) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.hostnameB.hidden = !isHaLicensed;
        this.hostnameVirtual.hidden = !isHaLicensed;
      });
    }
  }

  private loadConfig(): void {
    this.ws.call('network.configuration.config')
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
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
        error: (error: WebsocketError) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  onSubmit(): void {
    const values = this.form.value;
    let activity: NetworkConfigurationActivity;

    if ([NetworkActivityType.Allow, NetworkActivityType.Deny].includes(values.outbound_network_activity)) {
      activity = { type: values.outbound_network_activity, activities: [] };
    } else {
      activity = { type: NetworkActivityType.Allow, activities: values.outbound_network_value };
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

    this.isFormLoading = true;
    this.ws.call('network.configuration.update', [params] as [NetworkConfigurationUpdate])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.slideInRef.close();
        },
        error: (error) => {
          this.isFormLoading = false;
          this.formErrorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
  }
}
