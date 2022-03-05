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
import { SysInfoEvent, SystemInfoWithFeatures } from 'app/interfaces/events/sys-info-event.interface';
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
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
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

  reorderButtonConfig = {
    name: 'dashReorder',
    label: this.translate.instant('Reorder'),
    type: 'button',
    value: undefined,
    color: 'primary',
  } as ControlConfig;

  confirmButtonConfig = {
    name: 'dashConfirm',
    label: this.translate.instant('Confirm'),
    type: 'hidden',
    value: undefined,
    color: 'primary',
  } as ControlConfig;

  cancelButtonConfig = {
    name: 'dashCancel',
    label: this.translate.instant('Cancel'),
    type: 'hidden',
    value: undefined,
    color: 'secondary',
  } as ControlConfig;

  reorderMode = false;

  screenType = 'Desktop'; // Desktop || Mobile
  optimalDesktopWidth = '100%';
  widgetWidth = 540; // in pixels (Desktop only)

  dashStateReady = false;
  dashState: DashConfigItem[]; // Saved State
  previousState: DashConfigItem[];
  activeMobileWidget: DashConfigItem[] = [];
  availableWidgets: DashConfigItem[] = [];
  renderedWidgets: DashConfigItem[];

  large = 'lg';
  medium = 'md';
  small = 'sm';
  noteFlex = '23';

  statsDataEvent$: Subject<CoreEvent> = new Subject<CoreEvent>();
  interval: Interval;

  // For empty state
  get empty(): boolean {
    return this.dashState.every((widget) => !widget.rendered);
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

  onWidgetReorder(newState: unknown[]): void {
    this.applyState(this.sanitizeState(newState as DashConfigItem[]));
  }

  ngAfterViewInit(): void {
    this.checkScreenSize();
  }

  getWidgetId(index: number, widget: DashConfigItem): string {
    return widget.id;
  }

  checkScreenSize(): void {
    const st = window.innerWidth < 600 ? 'Mobile' : 'Desktop';

    // If leaving .xs screen then reset mobile position
    if (st === 'Desktop' && this.screenType === 'Mobile') {
      this.onMobileBack();
    }

    if (this.screenType !== st) {
      this.onScreenSizeChange(st, this.screenType);
    }

    this.screenType = st;

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
    const viewportElement = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(viewportElement);
    const carouselElement = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(carouselElement);
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
    const viewportElement = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(viewportElement);
    const carouselElement = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(carouselElement);
    const vpw = viewport.get('width'); // 600;

    const startX = vpw * -1;
    const endX = 0;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start({
      update: (valuesUpdate: { x: number }) => {
        carousel.set(valuesUpdate);
      },
      complete: () => {
        this.activeMobileWidget = [];
      },
    });
  }

  onMobileResize(evt: Event): void {
    if (this.screenType === 'Desktop') { return; }
    const viewportElement = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(viewportElement);
    const carouselElement = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(carouselElement);

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

    this.ws.call('interface.query').pipe(untilDestroyed(this)).subscribe((interfaces) => {
      const clone = [...interfaces] as DashboardNetworkInterface[];
      const removeNics: { [nic: string]: number | string } = {};

      // Store keys for fast lookup
      const nicKeys: { [nic: string]: number | string } = {};
      interfaces.forEach((item, index) => {
        nicKeys[item.name] = index.toString();
      });

      // Process Vlans (attach vlans to their parent)
      interfaces.forEach((item, index) => {
        if (item.type !== NetworkInterfaceType.Vlan && !clone[index].state.vlans) {
          clone[index].state.vlans = [];
        }

        if (item.type === NetworkInterfaceType.Vlan) {
          const parentIndex = parseInt(nicKeys[item.state.parent] as string);
          if (!clone[parentIndex].state.vlans) {
            clone[parentIndex].state.vlans = [];
          }

          clone[parentIndex].state.vlans.push(item.state);
          removeNics[item.name] = index;
        }
      });

      // Process LAGGs
      interfaces.forEach((item, index) => {
        if (item.type === NetworkInterfaceType.LinkAggregation) {
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

    this.getDisksData();
  }

  startListeners(): void {
    this.ws.sub<ReportingRealtimeUpdate>('reporting.realtime').pipe(untilDestroyed(this)).subscribe((update) => {
      if (update.cpu) {
        this.statsDataEvent$.next({ name: 'CpuStats', data: update.cpu });
      }

      if (update.virtual_memory) {
        const memStats: MemoryStatsEventData = { ...update.virtual_memory };

        if (update.zfs && update.zfs.arc_size !== null) {
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
      if (typeof dataset === undefined || !dataset) { return; }
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
      this.loadVolumeData();
    }, 15000);

    this.core.register({ observerClass: this, eventName: 'SysInfo' }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      if (typeof this.systemInformation === 'undefined') {
        this.systemInformation = evt.data;
        if (!this.pools || this.pools.length === 0) {
          this.loadPoolData();
        }
      }
    });

    this.core.emit({ name: 'SysInfoRequest', sender: this });
  }

  isDataReady(): void {
    const isReady = Boolean(
      this.statsDataEvent$ && Array.isArray(this.pools) && this.nics,
    );

    if (!isReady) {
      return;
    }

    this.availableWidgets = this.generateDefaultConfig();
    if (!this.dashState) {
      this.setDashState(this.availableWidgets);
    }

    this.formEvents$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'FormSubmit':
          this.setDashState(evt.data);
          break;
        case 'ToolbarChanged':
          this.handleToolbarChanged(evt);
          break;
      }
    });

    this.actionsConfig = this.getActionsConfig(this.formEvents$);

    this.core.emit({ name: 'GlobalActions', data: this.actionsConfig, sender: this });
    this.loadUserAttributes();
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

    conf.push({ name: 'Help', rendered: true });

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
        if (!pool) {
          console.warn(`Pool for ${item.name} [${item.identifier}] widget is not available!`);
          return;
        }
        return this.volumeData && this.volumeData[pool.name];
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
          const pools = this.pools.filter((pool) => pool[key as keyof Pool] === value);
          if (pools) { data = pools[0]; }
        } else {
          console.warn('DashConfigItem has no identifier!');
        }
        break;
      case 'interface':
        if (spl) {
          const nics = this.nics.filter((nic) => nic[key as keyof DashboardNetworkInterface] === value);
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
      console.warn(`Data for ${item.name} [${item.identifier}] widget is not available!`);
    }

    return data;
  }

  showConfigForm(): void {
    const modal = this.slideInService.open(DashboardFormComponent);
    modal.setupForm(this.dashState, this.formEvents$);
  }

  private sanitizeState(state: DashConfigItem[]): DashConfigItem[] {
    return state.filter((widget) => {
      if (
        ['pool', 'storage'].includes(widget.name.toLowerCase())
       && (!this.volumeDataFromConfig(widget) || !this.dataFromConfig(widget))
      ) {
        return false;
      }
      return true;
    });
  }

  private applyState(newState: DashConfigItem[]): void {
    // This reconciles current state with saved dashState

    if (!this.dashState) {
      console.warn('Cannot apply saved state to dashboard. Property dashState does not exist!');
      return;
    }

    const hidden = this.dashState
      .filter((widget) => {
        return newState.every((updatedWidget) => {
          return !(widget?.identifier === updatedWidget.identifier || widget?.name === updatedWidget.name);
        });
      })
      .map((widget) => ({ ...widget, rendered: false }));

    this.setDashState([...newState, ...hidden]);
  }

  private setDashState(dashState: DashConfigItem[]): void {
    this.dashState = dashState;
    this.renderedWidgets = dashState.filter((widget) => widget.rendered);
  }

  private getActionsConfig(target$: Subject<CoreEvent>): EntityToolbarActionConfig {
    const controls = [
      this.cancelButtonConfig,
      this.confirmButtonConfig,
      this.reorderButtonConfig,
      {
        name: 'dashConfig',
        label: this.translate.instant('Configure'),
        type: 'button',
        value: 'click',
        color: 'primary',
      } as ControlConfig,
    ];

    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: target$,
        controls,
      },
    };
    return actionsConfig;
  }

  private onScreenSizeChange(newScreenType: string, oldScreenType: string): void {
    if (newScreenType === 'Desktop' && oldScreenType === 'Mobile') {
      this.enableReorderMode();
    }

    if (newScreenType === 'Mobile' && oldScreenType === 'Desktop') {
      this.disableReorderMode();
    }
  }

  private handleToolbarChanged(evt: CoreEvent): void {
    switch (evt.data?.event_control) {
      case 'dashReorder':
        this.previousState = this.dashState.map((widget) => ({ ...widget }));

        this.enterReorderMode();
        break;

      case 'dashConfirm':
        this.saveState(this.dashState);
        delete this.previousState;

        this.exitReorderMode();
        break;

      case 'dashCancel':
        this.exitReorderMode();
        break;

      default:
        this.showConfigForm();
    }
  }

  private enterReorderMode(): void {
    this.reorderMode = true;

    this.reorderButtonConfig.type = 'hidden';

    this.confirmButtonConfig.type = 'button';
    this.cancelButtonConfig.type = 'button';
  }

  private exitReorderMode(): void {
    if (this.previousState) {
      this.setDashState(this.previousState);
      delete this.previousState;
    }

    this.reorderMode = false;

    this.reorderButtonConfig.type = 'button';

    this.confirmButtonConfig.type = 'hidden';
    this.cancelButtonConfig.type = 'hidden';
  }

  private enableReorderMode(): void {
    this.reorderMode = false;

    this.reorderButtonConfig.type = 'button';

    this.confirmButtonConfig.type = 'hidden';
    this.cancelButtonConfig.type = 'hidden';
  }

  private disableReorderMode(): void {
    if (this.reorderMode) {
      this.exitReorderMode();
    }

    this.reorderButtonConfig.type = 'hidden';
  }

  private saveState(state: DashConfigItem[]): void {
    this.ws.call('user.set_attribute', [1, 'dashState', state])
      .pipe(untilDestroyed(this))
      .subscribe((res) => {
        if (!res) {
          throw new Error('Unable to save Dashboard State');
        }
      });
  }

  private loadPoolData(): void {
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe((pools) => {
      this.pools = pools;

      if (this.pools.length > 0) {
        this.loadVolumeData();
      } else {
        this.setVolumeData([]);
        this.isDataReady();
      }
    });
  }

  private loadVolumeData(): void {
    this.ws
      .call('pool.dataset.query', [[], { extra: { retrieve_children: false } }])
      .pipe(untilDestroyed(this))
      .subscribe((dataset) => {
        this.setVolumeData(dataset);
        if (this.initialLoading) {
          this.isDataReady();
        }
        this.initialLoading = false;
      });
  }

  private loadUserAttributes(): void {
    this.ws.call('user.query', [[['id', '=', 1]]]).pipe(untilDestroyed(this)).subscribe((user) => {
      if (user[0].attributes.dashState) {
        this.applyState(user[0].attributes.dashState);
      }
      this.dashStateReady = true;
    });
  }
}
