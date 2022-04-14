import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { arrayToOptions } from 'app/helpers/options.helper';
import helptext from 'app/helptext/network/configuration/configuration';
import {
  NetworkConfiguration, NetworkConfigurationActivity, NetworkConfigurationConfig, NetworkConfigurationUpdate,
} from 'app/interfaces/network-configuration.interface';
import { ipv4Validator, ipv6Validator } from 'app/modules/entity/entity-form/validators/ip-validation';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { DialogService, WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
    netwait_enabled: [false],
    netwait_ip: [[] as string[]],
    hosts: [[] as string[]],
  });

  readonly helptext = helptext;

  hostname = {
    fcName: 'hostname',
    label: helptext.hostname_placeholder,
    tooltip: helptext.hostname_tooltip,
  };

  hostname_b = {
    fcName: 'hostname_b',
    label: helptext.hostname_b_placeholder,
    tooltip: helptext.hostname_b_tooltip,
    hidden: true,
  };

  hostname_virtual = {
    fcName: 'hostname_virtual',
    label: helptext.hostname_virtual_placeholder,
    tooltip: helptext.hostname_virtual_tooltip,
    hidden: true,
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

  outbound_network_activity = {
    fcName: 'outbound_network_activity',
    label: '',
    tooltip: '',
    options: of([
      // deny type + empty list
      {
        label: helptext.outbound_network_activity.allow.placeholder,
        value: NetworkActivityType.Deny,
        tooltip: helptext.outbound_network_activity.allow.tooltip,
      },
      // allow type + empty list
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

  outbound_network_value = {
    fcName: 'outbound_network_value',
    label: '',
    tooltip: helptext.outbound_network_value.tooltip,
    options: this.ws.call('network.configuration.activity_choices').pipe(arrayToOptions()),
    hidden: true,
  };

  httpproxy = {
    fcName: 'httpproxy',
    label: helptext.httpproxy_placeholder,
    tooltip: helptext.httpproxy_tooltip,
  };

  netwait_enabled = {
    fcName: 'netwait_enabled',
    label: helptext.netwait_enabled_placeholder,
    tooltip: helptext.netwait_enabled_tooltip,
  };

  netwait_ip = {
    fcName: 'netwait_ip',
    label: helptext.netwait_ip_placeholder,
    tooltip: helptext.netwait_ip_tooltip,
    hidden: true,
  };

  hosts = {
    fcName: 'hosts',
    label: helptext.hosts_placeholder,
    tooltip: helptext.hosts_tooltip,
  };

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private fb: FormBuilder,
    private dialogService: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.loadConfig();

    this.form.controls.outbound_network_activity.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: NetworkActivityType) => {
        if ([NetworkActivityType.Allow, NetworkActivityType.Deny].includes(value)) {
          this.outbound_network_value.hidden = true;
        } else {
          this.outbound_network_value.hidden = false;
        }
      },
    );
    this.form.controls.netwait_enabled.valueChanges.pipe(untilDestroyed(this)).subscribe(
      (value: boolean) => {
        if (value) {
          this.netwait_ip.hidden = false;
        } else {
          this.netwait_ip.hidden = true;
        }
      },
    );

    if ([ProductType.Enterprise, ProductType.ScaleEnterprise].includes(window.localStorage.getItem('product_type') as ProductType)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHa) => {
        this.hostname_b.hidden = !isHa;
        this.hostname_virtual.hidden = !isHa;
      });
    }
  }

  private loadConfig(): void {
    this.ws.call('network.configuration.config')
      .pipe(untilDestroyed(this))
      .subscribe(
        (config: NetworkConfiguration) => {
          const transformed: NetworkConfigurationConfig = {
            hostname: config.hostname,
            hostname_b: config.hostname_b,
            hostname_virtual: config.hostname_virtual,
            domain: config.domain,
            domains: config.domains,
            nameserver1: config.nameserver1,
            nameserver2: config.nameserver2,
            nameserver3: config.nameserver3,
            ipv4gateway: config.ipv4gateway,
            ipv6gateway: config.ipv6gateway,
            outbound_network_activity: NetworkActivityType.Allow,
            outbound_network_value: [],
            httpproxy: config.httpproxy,
            netwait_enabled: config.netwait_enabled,
            netwait_ip: config.netwait_ip,
            hosts: [],
            netbios: config.service_announcement.netbios,
            mdns: config.service_announcement.mdns,
            wsd: config.service_announcement.wsd,
          };

          if (config.hosts && config.hosts !== '') {
            transformed.hosts = config.hosts.split('\n');
          }

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
        (error) => {
          new EntityUtils().handleWsError(null, error, this.dialogService);
          this.isFormLoading = false;
          this.cdr.markForCheck();
        },
      );
  }

  onSubmit(): void {
    const values = this.form.value;
    let activity: NetworkConfigurationActivity;

    if ([NetworkActivityType.Allow, NetworkActivityType.Deny].includes(values.outbound_network_activity)) {
      activity = { type: values.outbound_network_activity, activities: [] };
    } else {
      activity = { type: NetworkActivityType.Allow, activities: values.outbound_network_value };
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

    const params = {
      ...values,
      hosts: values.hosts.length > 0 ? values.hosts.join('\n') : '',
      activity,
      service_announcement: serviceAnnouncement,
    };

    this.isFormLoading = true;
    this.ws.call('network.configuration.update', [params] as [NetworkConfigurationUpdate])
      .pipe(untilDestroyed(this))
      .subscribe(
        () => {
          this.isFormLoading = false;
          this.cdr.markForCheck();
          this.slideInService.close();
        },
        (error) => {
          this.isFormLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      );
  }
}
