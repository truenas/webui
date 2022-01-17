import {
  Component, OnInit, AfterViewInit, OnDestroy, ElementRef,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tween, styler } from 'popmotion';
import { Subject } from 'rxjs';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { CoreEvent } from 'app/interfaces/events';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { NicInfoEvent } from 'app/interfaces/events/nic-info-event.interface';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { SysInfoEvent, SystemInfoWithFeatures } from 'app/interfaces/events/sys-info-event.interface';
import { VolumeDataEvent } from 'app/interfaces/events/volume-data-event.interface';
import { EntityToolbarActionConfig } from 'app/interfaces/global-action.interface';
import {
  NetworkInterface,
  NetworkInterfaceState,
} from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { ReportingRealtimeUpdate } from 'app/interfaces/reporting.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { VolumesData, VolumeData } from 'app/interfaces/volume-data.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityToolbarComponent } from 'app/modules/entity/entity-toolbar/entity-toolbar.component';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ModalService } from 'app/services/modal.service';

// TODO: This adds additional fields. Unclear if vlan is coming from backend
type DashboardNetworkInterface = NetworkInterface & {
  state: DashboardNicState;
};

export type DashboardNicState = NetworkInterfaceState & {
  vlans: (NetworkInterfaceState & { interface?: string })[];
  lagg_ports: string[];
};

@UntilDestroy()
@Component({
  selector: 'dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  formEvents$: Subject<CoreEvent> = new Subject();
  actionsConfig: EntityToolbarActionConfig;

  screenType = 'Desktop'; // Desktop || Mobile
  optimalDesktopWidth = '100%';
  widgetWidth = 540; // in pixels (Desktop only)

  dashStateReady = false;
  dashState: DashConfigItem[]; // Saved State
  activeMobileWidget: DashConfigItem[] = [];
  availableWidgets: DashConfigItem[] = [];

  get renderedWidgets(): DashConfigItem[] {
    return this.dashState.filter((widget) => widget.rendered);
  }

  large = 'lg';
  medium = 'md';
  small = 'sm';
  noteFlex = '23';

  statsDataEvent$: Subject<CoreEvent> = new Subject<CoreEvent>();
  interval: Interval;

  // For empty state
  get empty(): boolean {
    const rendered = this.dashState.filter((widget) => widget.rendered);
    return rendered.length == 0;
  }

  emptyDashConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('Dashboard is Empty!'),
    message: this.translate.instant('You have hidden all of your available widgets. Use the dashboard configuration form to add widgets.'),
    button: {
      label: 'Configure Dashboard',
      action: () => {
        this.showConfigForm();
      },
    },
  };

  // For widgetsysinfo
  isHa: boolean;
  sysinfoReady = false;

  // For CPU widget
  systemInformation: SystemInfoWithFeatures;

  // For widgetpool
  pools: Pool[];
  volumeData: VolumesData;

  nics: DashboardNetworkInterface[];

  animation = 'stop';
  shake = false;

  showSpinner = true;
  initialLoading = true;

  constructor(
    protected core: CoreService,
    protected ws: WebSocketService,
    public mediaObserver: MediaObserver,
    private el: ElementRef,
    public modalService: ModalService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
  ) {
    core.register({ observerClass: this, eventName: 'SidenavStatus' }).pipe(untilDestroyed(this)).subscribe(() => {
      setTimeout(() => {
        this.checkScreenSize();
      }, 100);
    });

    this.checkScreenSize();

    window.onresize = () => {
      this.checkScreenSize();
    };
  }

  ngAfterViewInit(): void {
    this.checkScreenSize();
  }

  checkScreenSize(): void {
    const st = window.innerWidth < 600 ? 'Mobile' : 'Desktop';

    // If leaving .xs screen then reset mobile position
    if (st === 'Desktop' && this.screenType === 'Mobile') {
      this.onMobileBack();
    }

    this.screenType = st;

    // Eliminate top level scrolling
    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    wrapper.style.overflow = this.screenType === 'Mobile' ? 'hidden' : 'auto';
    this.optimizeWidgetContainer();
  }

  optimizeWidgetContainer(): void {
    const wrapper = document.querySelector<HTMLElement>('.rightside-content-hold');

    const withMargin = this.widgetWidth + 8;
    const max = Math.floor(wrapper.offsetWidth / withMargin);
    const odw = max * withMargin;
    this.optimalDesktopWidth = odw.toString() + 'px';
  }

  onMobileLaunch(evt: DashConfigItem): void {
    this.activeMobileWidget = [evt];

    // Transition
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(c);
    const vpw = viewport.get('width'); // 600;

    const startX = 0;
    const endX = vpw * -1;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start(carousel.set);
  }

  onMobileBack(): void {
    // Transition
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(c);
    const vpw = viewport.get('width'); // 600;

    const startX = vpw * -1;
    const endX = 0;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start({
      update: (v: { x: number }) => {
        carousel.set(v);
      },
      complete: () => {
        this.activeMobileWidget = [];
      },
    });
  }

  onMobileResize(evt: Event): void {
    if (this.screenType === 'Desktop') { return; }
    const vp = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(vp);
    const c = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(c);

    const startX = viewport.get('x');
    const endX = this.activeMobileWidget.length > 0 ? (evt.target as Window).innerWidth * -1 : 0;

    if (startX !== endX) {
      carousel.set('x', endX);
    }
  }

  ngOnInit(): void {
    this.init();

    this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((hasFailover) => {
      if (hasFailover) {
        this.isHa = true;
      }
    });
    this.sysinfoReady = true;
  }

  ngOnDestroy(): void {
    this.stopListeners();
    this.core.unregister({ observerClass: this });

    // Restore top level scrolling
    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    wrapper.style.overflow = 'auto';
  }

  init(): void {
    this.startListeners();

    this.core.register({ observerClass: this, eventName: 'NicInfo' }).pipe(untilDestroyed(this)).subscribe((evt: NicInfoEvent) => {
      const clone = [...evt.data] as DashboardNetworkInterface[];
      const removeNics: { [nic: string]: number | string } = {};

      // Store keys for fast lookup
      const nicKeys: { [nic: string]: number | string } = {};
      evt.data.forEach((item, index) => {
        nicKeys[item.name] = index.toString();
      });

      // Process Vlans (attach vlans to their parent)
      evt.data.forEach((item, index) => {
        if (item.type !== NetworkInterfaceType.Vlan && !clone[index].state.vlans) {
          clone[index].state.vlans = [];
        }

        if (item.type == NetworkInterfaceType.Vlan) {
          const parentIndex = parseInt(nicKeys[item.state.parent] as string);
          if (!clone[parentIndex].state.vlans) {
            clone[parentIndex].state.vlans = [];
          }

          clone[parentIndex].state.vlans.push(item.state);
          removeNics[item.name] = index;
        }
      });

      // Process LAGGs
      evt.data.forEach((item, index) => {
        if (item.type == NetworkInterfaceType.LinkAggregation) {
          clone[index].state.lagg_ports = item.lag_ports;
          item.lag_ports.forEach((nic) => {
            // Consolidate addresses
            clone[index].state.aliases.forEach((item: any) => { item.interface = nic; });
            clone[index].state.aliases = clone[index].state.aliases.concat(clone[nicKeys[nic] as number].state.aliases);

            // Consolidate vlans
            clone[index].state.vlans.forEach((item) => { item.interface = nic; });
            clone[index].state.vlans = clone[index].state.vlans.concat(clone[nicKeys[nic] as number].state.vlans);

            // Mark interface for removal
            removeNics[nic] = nicKeys[nic];
          });
        }
      });

      // Remove NICs from list
      for (let i = clone.length - 1; i >= 0; i--) {
        if (removeNics[clone[i].name]) {
          // Remove
          clone.splice(i, 1);
        } else {
          // Only keep INET addresses
          clone[i].state.aliases = clone[i].state.aliases.filter((address) => {
            return [NetworkInterfaceAliasType.Inet, NetworkInterfaceAliasType.Inet6].includes(address.type);
          });
        }
      }

      // Update NICs array
      this.nics = clone;

      this.isDataReady();
    });

    this.core.emit({ name: 'NicInfoRequest' });
    this.getDisksData();
  }

  startListeners(): void {
    this.core.register({ observerClass: this, eventName: 'UserAttributes' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      if (evt.data.dashState) {
        this.applyState(evt.data.dashState);
      }
      this.dashStateReady = true;
    });

    this.ws.sub<ReportingRealtimeUpdate>('reporting.realtime').pipe(untilDestroyed(this)).subscribe((update) => {
      if (update.cpu) {
        this.statsDataEvent$.next({ name: 'CpuStats', data: update.cpu });
      }

      if (update.virtual_memory) {
        const memStats: MemoryStatsEventData = { ...update.virtual_memory };

        if (update.zfs && update.zfs.arc_size != null) {
          memStats.arc_size = update.zfs.arc_size;
        }
        this.statsDataEvent$.next({ name: 'MemoryStats', data: memStats });
      }

      if (update.interfaces) {
        const keys = Object.keys(update.interfaces);
        keys.forEach((key) => {
          const data = update.interfaces[key];
          this.statsDataEvent$.next({ name: 'NetTraffic_' + key, data });
        });
      }
    });
  }

  stopListeners(): void {
    // unsubsribe from global actions
    if (this.formEvents$) {
      this.formEvents$.complete();
    }
  }

  setVolumeData(data: Dataset[]): void {
    const vd: VolumesData = {};

    data.forEach((dataset) => {
      if (typeof dataset == undefined || !dataset) { return; }
      const usedPercent = dataset.used.parsed / (dataset.used.parsed + dataset.available.parsed);
      const zvol = {
        avail: dataset.available.parsed,
        id: dataset.id,
        name: dataset.name,
        used: dataset.used.parsed,
        used_pct: (usedPercent * 100).toFixed(0) + '%',
      };

      vd[zvol.id] = zvol;
    });

    this.volumeData = vd;
  }

  getDisksData(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.core.emit({ name: 'VolumeDataRequest' });
    }, 15000);

    this.core.register({ observerClass: this, eventName: 'PoolData' }).pipe(untilDestroyed(this)).subscribe((evt: PoolDataEvent) => {
      this.pools = evt.data;

      if (this.pools.length > 0) {
        this.core
          .register({ observerClass: this, eventName: 'VolumeData' })
          .pipe(untilDestroyed(this))
          .subscribe((evt: VolumeDataEvent) => {
            this.setVolumeData(evt.data);
            if (this.initialLoading) {
              this.isDataReady();
            }
            this.initialLoading = false;
          });
        this.core.emit({ name: 'VolumeDataRequest' });
      } else {
        this.setVolumeData([]);
        this.isDataReady();
      }
    });

    this.core.register({ observerClass: this, eventName: 'SysInfo' }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      if (typeof this.systemInformation === 'undefined') {
        this.systemInformation = evt.data;
        if (!this.pools || this.pools.length == 0) {
          this.core.emit({ name: 'PoolDataRequest', sender: this });
        }
      }
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  isDataReady(): void {
    const isReady = Boolean(
      this.statsDataEvent$ && Array.isArray(this.pools) && this.nics,
    );

    if (isReady) {
      this.availableWidgets = this.generateDefaultConfig();
      if (!this.dashState) {
        this.dashState = this.availableWidgets;
      }

      this.formEvents$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
        switch (evt.name) {
          case 'FormSubmit':
            this.dashState = evt.data;
            break;
          case 'ToolbarChanged':
            this.showConfigForm();
            break;
        }
      });

      // Setup Global Actions
      const actionsConfig = {
        actionType: EntityToolbarComponent,
        actionConfig: {
          target: this.formEvents$,
          controls: [
            {
              name: 'dashConfig',
              label: 'Configure',
              type: 'button',
              value: 'click',
              color: 'primary',
            },
          ],
        },
      };

      this.actionsConfig = actionsConfig;

      this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
      this.core.emit({ name: 'UserAttributesRequest' }); // Fetch saved dashboard state
    }
  }

  generateDefaultConfig(): DashConfigItem[] {
    const conf: DashConfigItem[] = [
      { name: 'System Information', rendered: true, id: '0' },
    ];

    if (this.isHa) {
      conf.push({
        name: 'System Information(Standby)', identifier: 'passive,true', rendered: true, id: conf.length.toString(),
      });
    }

    conf.push({ name: 'CPU', rendered: true, id: conf.length.toString() });
    conf.push({ name: 'Memory', rendered: true, id: conf.length.toString() });

    conf.push({ name: 'Storage', rendered: true, id: conf.length.toString() });

    this.pools.forEach((pool) => {
      conf.push({
        name: 'Pool', identifier: 'name,' + pool.name, rendered: false, id: conf.length.toString(),
      });
    });

    conf.push({ name: 'Network', rendered: true, id: conf.length.toString() });

    this.nics.forEach((nic) => {
      conf.push({
        name: 'Interface', identifier: 'name,' + nic.name, rendered: false, id: conf.length.toString(),
      });
    });

    return conf;
  }

  volumeDataFromConfig(item: DashConfigItem): VolumesData | VolumeData {
    let spl: string[];
    let key: string;
    let value: string;
    if (item.identifier) {
      spl = item.identifier.split(',');
      key = spl[0] as keyof Pool;
      value = spl[1];
    }

    switch (item.name.toLowerCase()) {
      case 'storage':
        return this.volumeData;
      default:
        const pool = this.pools.find((pool) => pool[key as keyof Pool] === value);
        return this.volumeData && this.volumeData[pool.name] ? this.volumeData[pool.name] : null;
    }
  }

  dataFromConfig(item: DashConfigItem): Subject<CoreEvent> | DashboardNicState | Pool | Pool[] {
    let spl: string[];
    let key: string;
    let value: string;
    if (item.identifier) {
      spl = item.identifier.split(',');
      key = spl[0];
      value = spl[1];
    }

    // TODO: Convoluted typing, split apart.
    // eslint-disable-next-line rxjs/finnish
    let data: Subject<CoreEvent> | DashboardNicState | Pool | Pool[];

    switch (item.name.toLowerCase()) {
      case 'cpu':
        data = this.statsDataEvent$;
        break;
      case 'memory':
        data = this.statsDataEvent$;
        break;
      case 'pool':
        if (spl) {
          const pools = this.pools.filter((pool) => pool[key as keyof Pool] == value);
          if (pools) { data = pools[0]; }
        } else {
          console.warn('DashConfigItem has no identifier!');
        }
        break;
      case 'interface':
        if (spl) {
          const nics = this.nics.filter((nic) => nic[key as keyof DashboardNetworkInterface] == value);
          if (nics) { data = nics[0].state; }
        } else {
          console.warn('DashConfigItem has no identifier!');
        }
        break;
      case 'storage':
        data = this.pools;
        break;
    }

    if (!data) {
      console.warn('Data for this widget is not available!');
    }

    return data;
  }

  toggleShake(): void {
    if (this.shake) {
      this.shake = false;
    } else if (!this.shake) {
      this.shake = true;
    }
  }

  showConfigForm(): void {
    const modal = this.slideInService.open(DashboardFormComponent);
    modal.setupForm(this.dashState, this.formEvents$);
  }

  applyState(state: DashConfigItem[]): void {
    // This reconciles current state with saved dashState

    if (!this.dashState) {
      console.warn('Cannot apply saved state to dashboard. Property dashState does not exist!');
      return;
    }

    const clone = Object.assign([], this.dashState);
    clone.forEach((widget, index) => {
      const matches = state.filter((w) => {
        const key = widget.identifier ? 'identifier' : 'name';

        return widget[key] == w[key];
      });

      if (matches.length == 1) {
        clone[index] = matches[0];
      }
    });

    this.dashState = clone;
  }
}
