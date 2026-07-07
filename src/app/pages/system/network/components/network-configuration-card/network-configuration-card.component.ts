import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Actions, ofType } from '@ngrx/effects';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnCardHeaderDirective, TnIconComponent,
  TnListComponent, TnListIconDirective, TnListItemComponent,
} from '@truenas/ui-components';
import ipRegex from 'ip-regex';
import { combineLatest } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { NetworkActivityType } from 'app/enums/network-activity-type.enum';
import { NetworkConfiguration } from 'app/interfaces/network-configuration.interface';
import { NetworkSummary } from 'app/interfaces/network-summary.interface';
import { Option } from 'app/interfaces/option.interface';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { NetworkConfigurationComponent } from 'app/pages/system/network/components/network-configuration/network-configuration.component';
import {
  networkConfigurationCardElements,
} from 'app/pages/system/network/components/network-configuration-card/network-configuration-card.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

@Component({
  selector: 'ix-network-configuration-card',
  templateUrl: './network-configuration-card.component.html',
  styleUrls: ['./network-configuration-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardFooterActionsDirective,
    TnButtonComponent,
    UiSearchDirective,
    TnListComponent,
    TnListItemComponent,
    TnListIconDirective,
    TnIconComponent,
    TranslateModule,
    CastPipe,
  ],
})
export class NetworkConfigurationCardComponent implements OnInit {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private searchDirectives = inject(UiSearchDirectivesService);
  private actions$ = inject(Actions);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly networkConfigurationCardElements = networkConfigurationCardElements;

  protected readonly summary = signal<NetworkSummary | undefined>(undefined);
  protected readonly config = signal<NetworkConfiguration | undefined>(undefined);
  protected readonly isLoading = signal(false);

  ngOnInit(): void {
    this.loadNetworkConfigAndSummary();

    this.actions$.pipe(ofType(networkInterfacesChanged), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadNetworkConfigAndSummary());
  }

  protected readonly serviceAnnouncement = computed<string>(() => {
    const config = this.config();
    if (!config) {
      return '';
    }

    const options: string[] = [];
    if (config.service_announcement.netbios) {
      options.push('NETBIOS-NS');
    }
    if (config.service_announcement.mdns) {
      options.push('mDNS');
    }
    if (config.service_announcement.wsd) {
      options.push('WS-DISCOVERY');
    }

    return options.join(', ');
  });

  protected readonly additionalDomains = computed<string>(() => {
    const config = this.config();
    if (!config) {
      return '-';
    }

    return config.domains.length > 0 ? config.domains.join(', ') : '-';
  });

  protected readonly outboundNetwork = computed<string>(() => {
    const config = this.config();
    if (!config) {
      return '';
    }

    if (config.activity.activities.length === 0) {
      if (config.activity.type === NetworkActivityType.Allow) {
        return this.translate.instant('Deny All');
      }

      return this.translate.instant('Allow All');
    }

    if (config.activity.type === NetworkActivityType.Allow) {
      return this.translate.instant(
        'Only allow: {activities}',
        { activities: config.activity.activities.join(', ') },
      );
    }

    return this.translate.instant(
      'Allow all except: {activities}',
      { activities: config.activity.activities.join(', ') },
    );
  });

  protected readonly nameservers = computed<Option[]>(() => {
    const config = this.config();
    const summary = this.summary();
    if (!config || !summary) {
      return [];
    }

    const nameservers: Option[] = [];
    const nameserverAttributes = ['nameserver1', 'nameserver2', 'nameserver3'] as const;
    const labels = [
      this.translate.instant('Primary'),
      this.translate.instant('Secondary'),
      this.translate.instant('Tertiary'),
    ];

    nameserverAttributes.forEach((attribute, index) => {
      const nameserver = config[attribute];
      if (nameserver) {
        nameservers.push({
          label: this.translate.instant(labels[index]),
          value: nameserver,
        });
      }
    });

    summary.nameservers.forEach((nameserver) => {
      if (nameserverAttributes.some((attribute) => config[attribute] === nameserver)) {
        return;
      }

      nameservers.push({
        label: this.translate.instant('Nameserver (DHCP)'),
        value: nameserver,
      });
    });

    return nameservers;
  });

  protected readonly ipv4 = computed<string[]>(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }

    return summary.default_routes.filter((item) => ipRegex.v4().test(item));
  });

  protected readonly ipv6 = computed<string[]>(() => {
    const summary = this.summary();
    if (!summary) {
      return [];
    }

    return summary.default_routes.filter((item) => ipRegex.v6().test(item));
  });

  onSettingsClicked(): void {
    this.formPanel.open(NetworkConfigurationComponent, {
      title: this.translate.instant('Edit Global Configuration'),
      wide: true,
    })
      .onSuccess(() => this.loadNetworkConfigAndSummary(), this.destroyRef);
  }

  private loadNetworkConfigAndSummary(): void {
    this.isLoading.set(true);

    combineLatest([
      this.api.call('network.general.summary'),
      this.api.call('network.configuration.config'),
    ])
      .pipe(
        this.errorHandler.withErrorHandler(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(([summary, config]) => {
        this.summary.set(summary);
        this.config.set(config);
        this.isLoading.set(false); // TODO: Add loading indication in UI.
        setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 2);
      });
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
