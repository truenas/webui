import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Actions, ofType } from '@ngrx/effects';
import { TranslateService } from '@ngx-translate/core';
import ipRegex from 'ip-regex';
import { combineLatest } from 'rxjs';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkConfiguration } from 'app/interfaces/network-configuration.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { Option } from 'app/interfaces/option.interface';
import { NetworkConfigurationComponent } from 'app/pages/network/components/configuration/configuration.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@UntilDestroy()
@Component({
  selector: 'ix-network-configuration-card',
  templateUrl: './network-configuration-card.component.html',
  styleUrls: ['./network-configuration-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkConfigurationCardComponent implements OnInit {
  summary: NetworkSummary;
  config: NetworkConfiguration;
  isLoading = false;

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private slideInService: IxSlideInService,
    private actions$: Actions,
  ) {}

  ngOnInit(): void {
    this.loadNetworkConfigAndSummary();

    this.actions$.pipe(ofType(networkInterfacesChanged), untilDestroyed(this))
      .subscribe(() => this.loadNetworkConfigAndSummary());
  }

  get serviceAnnouncement(): string {
    const options: string[] = [];
    if (this.config.service_announcement.netbios) {
      options.push('NETBIOS-NS');
    }
    if (this.config.service_announcement.mdns) {
      options.push('mDNS');
    }
    if (this.config.service_announcement.wsd) {
      options.push('WS-DISCOVERY');
    }

    return options.join(', ');
  }

  get additionalDomains(): string {
    return this.config.domains.length > 0 ? this.config.domains.join(', ') : '---';
  }

  get outboundNetwork(): string {
    if (this.config.activity.type === NetworkActivityType.Deny) {
      return this.translate.instant('Allow All');
    }

    if (this.config.activity.activities.length === 0) {
      return this.translate.instant('Deny All');
    }

    return this.translate.instant(
      'Allow {activities}',
      { activities: this.config.activity.activities.join(', ') },
    );
  }

  get nameservers(): Option[] {
    const nameservers: Option[] = [];
    const nameserverAttributes = ['nameserver1', 'nameserver2', 'nameserver3'] as const;
    nameserverAttributes.forEach((attribute, n) => {
      const nameserver = this.config[attribute];
      if (nameserver) {
        nameservers.push({
          label: this.translate.instant('Nameserver {n}', { n: n + 1 }),
          value: nameserver,
        });
      }
    });

    this.summary.nameservers.forEach((nameserver) => {
      if (nameserverAttributes.some((attribute) => this.config[attribute] === nameserver)) {
        return;
      }

      nameservers.push({
        label: this.translate.instant('Nameserver (DHCP)'),
        value: nameserver,
      });
    });

    return nameservers;
  }

  get ipv4(): string[] {
    return this.summary.default_routes.filter((item) => ipRegex.v4().test(item));
  }

  get ipv6(): string[] {
    return this.summary.default_routes.filter((item) => ipRegex.v6().test(item));
  }

  onSettingsClicked(): void {
    const slideInRef = this.slideInService.open(NetworkConfigurationComponent, { wide: true });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.loadNetworkConfigAndSummary());
  }

  private loadNetworkConfigAndSummary(): void {
    this.isLoading = true;
    this.cdr.markForCheck();

    combineLatest([
      this.ws.call('network.general.summary'),
      this.ws.call('network.configuration.config'),
    ])
      .pipe(untilDestroyed(this))
      .subscribe(([summary, config]) => {
        this.isLoading = false; // TODO: Add loading indication in UI.
        this.summary = summary;
        this.config = config;

        this.cdr.markForCheck();
      });

    // TODO: Handle loading error
  }
}
