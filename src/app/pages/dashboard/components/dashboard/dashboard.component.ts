import {
  Component, OnInit, AfterViewInit, OnDestroy, ElementRef, TemplateRef, ViewChild, Inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { tween, styler } from 'popmotion';
import { Subject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';
import { Styler } from 'stylefire';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { NetworkInterfaceAliasType, NetworkInterfaceType } from 'app/enums/network-interface.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Dataset } from 'app/interfaces/dataset.interface';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { CoreEvent } from 'app/interfaces/events';
import { MemoryStatsEventData } from 'app/interfaces/events/memory-stats-event.interface';
import { SystemFeatures, SystemInfoWithFeatures } from 'app/interfaces/events/sys-info-event.interface';
import {
  NetworkInterface, NetworkInterfaceAlias,
  NetworkInterfaceState,
} from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Interval } from 'app/interfaces/timeout.interface';
import { VolumesData, VolumeData } from 'app/interfaces/volume-data.interface';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { dashboardStateLoaded } from 'app/store/preferences/preferences.actions';
import { PreferencesState } from 'app/store/preferences/preferences.reducer';
import { selectPreferencesState } from 'app/store/preferences/preferences.selectors';
import { waitForSystemFeatures, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

// TODO: This adds additional fields. Unclear if vlan is coming from backend
type DashboardNetworkInterface = NetworkInterface & {
  state: DashboardNicState;
};

export interface DashboardNicState extends NetworkInterfaceState {
  vlans: (NetworkInterfaceState & { interface?: string })[];
  lagg_ports: string[];
  aliases: DashboardNetworkInterfaceAlias[];
}

export interface DashboardNetworkInterfaceAlias extends NetworkInterfaceAlias {
  interface?: string;
}

@UntilDestroy()
@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './dashboard.component.scss',
  ],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  reorderMode = false;
  screenType = ScreenType.Desktop;
  optimalDesktopWidth = '100%';
  widgetWidth = 540; // in pixels (Desktop only)
  dashStateReady = false;
  dashState: DashConfigItem[]; // Saved State
  previousState: DashConfigItem[];
  activeMobileWidget: DashConfigItem[] = [];
  availableWidgets: DashConfigItem[] = this.generateDefaultConfig();
  renderedWidgets: DashConfigItem[];
  large = 'lg';
  medium = 'md';
  small = 'sm';
  statsDataEvent$: Subject<CoreEvent> = new Subject<CoreEvent>();
  interval: Interval;

  readonly ScreenType = ScreenType;

  get isLoaded(): boolean {
    return this.dashStateReady
      && this.statsDataEvent$
      && this.pools
      && this.nics
      && this.volumeData
      && this.sysinfoReady;
  }
  // For empty state
  get isEmpty(): boolean {
    if (!this.dashState) {
      return true;
    }
    return this.dashState.every((widget) => !widget.rendered);
  }

  emptyDashConf: EmptyConfig = {
    type: EmptyType.NoPageData,
    large: true,
    title: this.translate.instant('Dashboard is Empty!'),
    message: this.translate.instant('You have hidden all of your available widgets. Use the dashboard configuration form to add widgets.'),
    button: {
      label: this.translate.instant('Configure Dashboard'),
      action: () => {
        this.showConfigForm();
      },
    },
  };

  // For widgetsysinfo
  isHaLicensed: boolean;
  sysinfoReady = false;

  // For CPU widget
  systemInformation: SystemInfoWithFeatures;

  // For widgetpool
  pools: Pool[];
  volumeData: VolumesData;

  nics: DashboardNetworkInterface[];

  initialLoading = true;

  constructor(
    protected ws: WebSocketService,
    private el: ElementRef<HTMLElement>,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    window.onresize = () => {
      this.checkScreenSize();
    };
    window.onload = () => {
      this.checkScreenSize();
    };
  }

  ngOnInit(): void {
    this.checkScreenSize();
    this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
      this.isHaLicensed = isHaLicensed;
    });
    this.sysinfoReady = true;
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
    this.checkScreenSize();
    this.startListeners();
  }

  ngOnDestroy(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.interval) {
      clearInterval(this.interval);
    }

    // Restore top level scrolling
    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    wrapper.style.overflow = 'auto';
  }

  onWidgetReorder(newState: DashConfigItem[]): void {
    this.applyState(newState);
  }

  getWidgetId(index: number, widget: DashConfigItem): string {
    return widget.id;
  }

  checkScreenSize(): void {
    const currentScreenType = this.window.innerWidth < 600 ? ScreenType.Mobile : ScreenType.Desktop;

    // If leaving .xs screen then reset mobile position
    if (currentScreenType === ScreenType.Desktop && this.screenType === ScreenType.Mobile) {
      this.onMobileBack();
    }

    if (this.screenType !== currentScreenType) {
      this.onScreenSizeChange(currentScreenType, this.screenType);
    }

    this.screenType = currentScreenType;

    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    if (wrapper) {
      wrapper.style.overflow = this.screenType === ScreenType.Mobile ? 'hidden' : 'auto';
      this.optimizeWidgetContainer();
    }
  }

  optimizeWidgetContainer(): void {
    const wrapper = this.layoutService.getContentContainer();

    const withMargin = this.widgetWidth + 8;
    const max = Math.floor(wrapper.offsetWidth / withMargin);
    const odw = max * withMargin;
    this.optimalDesktopWidth = odw.toString() + 'px';
  }

  onMobileLaunch(evt: DashConfigItem): void {
    this.activeMobileWidget = [evt];

    const { carousel, vpw } = this.getCarouselHtmlData();

    const startX = 0;
    const endX = vpw * -1;

    tween({
      from: { x: startX },
      to: { x: endX },
      duration: 250,
    }).start(carousel.set);
  }

  onMobileBack(): void {
    const { carousel, vpw } = this.getCarouselHtmlData();

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
    if (this.screenType === ScreenType.Desktop) { return; }
    const { carousel, startX } = this.getCarouselHtmlData();

    const endX = this.activeMobileWidget.length > 0 ? (evt.target as Window).innerWidth * -1 : 0;

    if (startX !== endX) {
      carousel.set('x', endX);
    }
  }

  startListeners(): void {
    this.getDisksData();
    this.getNetworkInterfaces();
    this.listenForPoolUpdates();

    this.ws.subscribe('reporting.realtime').pipe(
      map((event) => event.fields),
      untilDestroyed(this),
    ).subscribe((update) => {
      if (update?.cpu) {
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
          this.statsDataEvent$.next({ name: 'NetTraffic_' + key, data: update.interfaces[key] });
        });
      }
    });
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
    this.isDataReady();
  }

  getDisksData(): void {
    if (this.interval) {
      clearInterval(this.interval);
    }

    this.interval = setInterval(() => {
      this.loadVolumeData();
    }, 15000);

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe((sysInfo) => {
      if (typeof this.systemInformation === 'undefined') {
        this.systemInformation = { ...sysInfo } as SystemInfoWithFeatures;
        if (!this.pools || this.pools.length === 0) {
          this.loadPoolData();
        }
      }
    });
    this.store$.pipe(waitForSystemFeatures, untilDestroyed(this)).subscribe((features: SystemFeatures) => {
      this.systemInformation.features = features;
    });
  }

  isDataReady(): void {
    const isReady = Array.isArray(this.pools) && Array.isArray(this.nics) && !!this.volumeData;

    if (!isReady) {
      return;
    }

    this.availableWidgets = this.generateDefaultConfig();
    if (!this.dashState) {
      this.setDashState(this.availableWidgets);
    }
    this.loadUserAttributes();
  }

  generateDefaultConfig(): DashConfigItem[] {
    const conf: DashConfigItem[] = [
      { name: 'System Information', rendered: true, id: '0' },
    ];

    if (this.isHaLicensed) {
      conf.push({
        id: conf.length.toString(),
        name: 'System Information(Standby)',
        identifier: 'passive,true',
        rendered: true,
      });
    }

    conf.push({ name: 'Help', rendered: true });
    conf.push({ name: 'CPU', rendered: true, id: conf.length.toString() });
    conf.push({ name: 'Memory', rendered: true, id: conf.length.toString() });
    conf.push({ name: 'Storage', rendered: true, id: conf.length.toString() });
    conf.push({ name: 'Network', rendered: true, id: conf.length.toString() });

    this.pools?.forEach((pool) => {
      conf.push({
        id: conf.length.toString(),
        name: 'Pool',
        identifier: `name,${pool.name}`,
        rendered: false,
      });
    });

    this.nics?.forEach((nic) => {
      conf.push({
        id: conf.length.toString(),
        name: 'Interface',
        identifier: `name,${nic.name}`,
        rendered: false,
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

    if (item.name.toLowerCase() === 'storage') {
      return this.volumeData;
    }

    const dashboardPool = this.pools.find((pool) => pool[key as keyof Pool] === value);
    if (!dashboardPool) {
      console.warn(`Pool for ${item.name} [${item.identifier}] widget is not available!`);
      return undefined;
    }
    return this.volumeData && this.volumeData[dashboardPool.name];
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
          if (pools.length) { data = pools[0]; }
        } else {
          console.warn('DashConfigItem has no identifier!');
        }
        break;
      case 'interface':
        if (spl) {
          const nics = this.nics.filter((nic) => nic[key as keyof DashboardNetworkInterface] === value);
          if (nics.length) { data = nics[0].state; }
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
    const slideInServiceRef = this.slideInService.open(DashboardFormComponent);
    slideInServiceRef.componentInstance.setupForm(this.dashState);
    slideInServiceRef.componentInstance.onSubmit$.pipe(take(1), untilDestroyed(this)).subscribe((dashState) => {
      this.store$.dispatch(dashboardStateLoaded({ dashboardState: dashState }));
      this.setDashState(dashState);
    });
  }

  onEnter(): void {
    this.previousState = [...this.dashState];
    this.enterReorderMode();
  }

  onCancel(): void {
    this.exitReorderMode();
  }

  onConfirm(): void {
    this.saveState(this.dashState);
    delete this.previousState;
    this.exitReorderMode();
  }

  private sanitizeState(state: DashConfigItem[]): DashConfigItem[] {
    return state.filter((widget) => {
      if (
        ['pool', 'storage'].includes(widget.name.toLowerCase())
       && (!this.volumeDataFromConfig(widget) || !this.dataFromConfig(widget))
      ) {
        return false;
      }
      if (widget.name === 'Interface' && !this.dataFromConfig(widget)) {
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
      .filter((widget) => newState.every((updatedWidget) => {
        if (widget.identifier) {
          return widget.identifier !== updatedWidget.identifier;
        }
        return widget.name !== updatedWidget.name;
      }))
      .map((widget) => ({ ...widget, rendered: false }));

    this.setDashState([...newState, ...hidden]);
  }

  private setDashState(dashState: DashConfigItem[]): void {
    this.dashState = this.sanitizeState(dashState);
    this.renderedWidgets = this.dashState.filter((widget) => widget.rendered);
  }

  private onScreenSizeChange(newScreenType: string, oldScreenType: string): void {
    if (newScreenType === ScreenType.Desktop && oldScreenType === ScreenType.Mobile) {
      this.enableReorderMode();
    }

    if (newScreenType === ScreenType.Mobile && oldScreenType === ScreenType.Desktop) {
      this.disableReorderMode();
    }
  }

  private enterReorderMode(): void {
    this.reorderMode = true;
  }

  private exitReorderMode(): void {
    if (this.previousState) {
      this.setDashState(this.previousState);
      delete this.previousState;
    }

    this.reorderMode = false;
  }

  private enableReorderMode(): void {
    this.reorderMode = false;
  }

  private disableReorderMode(): void {
    if (this.reorderMode) {
      this.exitReorderMode();
    }
  }

  private saveState(state: DashConfigItem[]): void {
    this.ws.call('auth.set_attribute', ['dashState', state])
      .pipe(untilDestroyed(this))
      .subscribe((wasSet) => {
        if (!wasSet) {
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
    this.store$.pipe(
      select(selectPreferencesState),
      filter(Boolean),
      take(1),
      untilDestroyed(this),
    ).subscribe((preferences: PreferencesState) => {
      if (preferences.dashboardState) {
        this.applyState(preferences.dashboardState);
      } else {
        this.availableWidgets = this.generateDefaultConfig();
        this.setDashState(this.availableWidgets);
      }
      this.dashStateReady = true;
    });
  }

  private getNetworkInterfaces(): void {
    this.ws.call('interface.query').pipe(untilDestroyed(this)).subscribe((interfaces) => {
      const clone = [...interfaces] as DashboardNetworkInterface[];
      const removeNics: { [nic: string]: number | string } = {};

      // Store keys for fast lookup
      const nicKeys: { [nic: string]: number | string } = {};
      interfaces.forEach((networkInterface, index) => {
        nicKeys[networkInterface.name] = index.toString();

        // Process Vlans (attach vlans to their parent)
        if (networkInterface.type !== NetworkInterfaceType.Vlan && !clone[index].state.vlans) {
          clone[index].state.vlans = [];
        }

        if (networkInterface.type === NetworkInterfaceType.Vlan && networkInterface.state.parent) {
          const parentIndex = parseInt(nicKeys[networkInterface.state.parent] as string);
          if (!clone[parentIndex].state.vlans) {
            clone[parentIndex].state.vlans = [];
          }

          clone[parentIndex].state.vlans.push(networkInterface.state);
          removeNics[networkInterface.name] = index;
        }

        // Process LAGGs
        if (networkInterface.type === NetworkInterfaceType.LinkAggregation) {
          clone[index].state.lagg_ports = networkInterface.lag_ports;
          networkInterface.lag_ports.forEach((nic) => {
            // Consolidate addresses
            clone[index].state.aliases.forEach((alias) => {
              (alias as DashboardNetworkInterfaceAlias).interface = nic;
            });
            clone[index].state.aliases = clone[index].state.aliases.concat(clone[nicKeys[nic] as number].state.aliases);

            // Consolidate vlans
            clone[index].state.vlans.forEach((vlan) => { vlan.interface = nic; });
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
  }

  private getCarouselHtmlData(): { carousel: Styler; vpw: number; startX: number } {
    const viewportElement = this.el.nativeElement.querySelector('.mobile-viewport');
    const viewport = styler(viewportElement);
    const carouselElement = this.el.nativeElement.querySelector('.mobile-viewport .carousel');
    const carousel = styler(carouselElement);
    const vpw = viewport.get('width') as number;
    const startX = viewport.get('x') as number;

    return { carousel, vpw, startX };
  }

  private listenForPoolUpdates(): void {
    this.ws.subscribe('pool.query').pipe(
      filter((event) => !(event.msg === IncomingApiMessageType.Changed && event.cleared)),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loadPoolData();
    });
  }
}
