import { DOCUMENT } from '@angular/common';
import {
  Component, AfterViewInit, OnDestroy, ElementRef, Inject, HostListener, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { tween, styler } from 'popmotion';
import { skipWhile, take, tap } from 'rxjs/operators';
import { Styler } from 'stylefire';
import { EmptyType } from 'app/enums/empty-type.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { WidgetName } from 'app/enums/widget-name.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import {
  NetworkInterface, NetworkInterfaceAlias,
  NetworkInterfaceState,
} from 'app/interfaces/network-interface.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { VolumesData } from 'app/interfaces/volume-data.interface';
import { DashboardFormComponent } from 'app/pages/dashboard-old/components/dashboard-form/dashboard-form.component';
import { DashConfigItem } from 'app/pages/dashboard-old/components/widget-controller/widget-controller.component';
import { DashboardStore } from 'app/pages/dashboard-old/store/dashboard-store.service';
import { ResourcesUsageStore } from 'app/pages/dashboard-old/store/resources-usage-store.service';
import { deepCloneState } from 'app/pages/dashboard-old/utils/deep-clone-state.helper';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { dashboardStateLoaded, dashboardStateUpdated } from 'app/store/preferences/preferences.actions';

// TODO: This adds additional fields. Unclear if vlan is coming from backend
export type DashboardNetworkInterface = NetworkInterface & {
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
  selector: 'ix-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './dashboard.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent implements AfterViewInit, OnDestroy {
  reorderMode = false;
  isSavingState = false;
  screenType = ScreenType.Desktop;
  optimalDesktopWidth = '100%';
  widgetWidth = 540; // in pixels (Desktop only)
  dashState: DashConfigItem[]; // Saved State
  previousState: DashConfigItem[];
  activeMobileWidget: DashConfigItem[] = [];
  renderedWidgets: DashConfigItem[];

  readonly ScreenType = ScreenType;
  readonly WidgetType = WidgetName;

  isLoaded = true;

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

  // For widgetpool
  pools: Pool[];
  volumesData: VolumesData;

  nics: DashboardNetworkInterface[];

  constructor(
    protected ws: WebSocketService,
    private el: ElementRef<HTMLElement>,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private layoutService: LayoutService,
    private store$: Store<AppState>,
    private dashboardStore$: DashboardStore,
    private resourcesUsageStore$: ResourcesUsageStore,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngAfterViewInit(): void {
    this.checkScreenSize();
    this.startListeners();
    this.dashboardStore$.isLoading$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (isLoading) => {
        this.isLoaded = !isLoading;
        this.cdr.detectChanges();
      },
    });
    this.subscribeToResourceUsageUpdates();
    this.generateDefaultConfig();
  }

  startListeners(): void {
    this.dashboardStore$.state$.pipe(
      deepCloneState(),
      skipWhile(() => this.document.hidden),
      tap((state) => {
        if (state.isLoading) {
          return;
        }
        this.nics = state.nics;
        this.pools = state.pools;
        this.volumesData = state.volumesData;
        this.setDashState(state.dashboardState);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  ngOnDestroy(): void {
    // Restore top level scrolling
    const wrapper = document.querySelector<HTMLElement>('.fn-maincontent');
    wrapper.style.overflow = 'auto';

    // update dashboard store with latest data
    this.dashboardStore$.applyState(this.dashState);
  }

  onWidgetReorder(newState: DashConfigItem[]): void {
    this.renderedWidgets = newState;
    this.applyState(newState);
  }

  getWidgetId(index: number, widget: DashConfigItem): string {
    return widget.id;
  }

  @HostListener('window:resize', ['$event'])
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

  private generateDefaultConfig(): void {
    const conf: DashConfigItem[] = [
      {
        name: WidgetName.SystemInformation,
        rendered: true,
        id: '0',
      },
    ];

    conf.push({ name: WidgetName.Help, rendered: true });
    conf.push({ name: WidgetName.Cpu, rendered: true, id: conf.length.toString() });
    conf.push({ name: WidgetName.Memory, rendered: true, id: conf.length.toString() });
    conf.push({ name: WidgetName.Storage, rendered: true, id: conf.length.toString() });
    conf.push({ name: WidgetName.Network, rendered: true, id: conf.length.toString() });
    conf.push({ name: WidgetName.Backup, rendered: true, id: conf.length.toString() });
  }

  showConfigForm(): void {
    const slideInRef = this.slideInService.open(DashboardFormComponent, { data: this.dashState });
    slideInRef.slideInClosed$.pipe(take(1), untilDestroyed(this)).subscribe((dashState: DashConfigItem[]) => {
      if (dashState) {
        this.store$.dispatch(dashboardStateLoaded({ dashboardState: dashState }));
        this.setDashState(dashState);
        this.cdr.markForCheck();
      }
    });
  }

  onEnter(): void {
    this.previousState = [...this.dashState];
    this.enterReorderMode();
    this.cdr.markForCheck();
  }

  onCancel(): void {
    this.exitReorderMode();
    this.cdr.markForCheck();
  }

  onConfirm(): void {
    this.saveState(this.dashState);
    delete this.previousState;
  }

  private subscribeToResourceUsageUpdates(): void {
    this.resourcesUsageStore$.getResourceUsageUpdates().pipe(untilDestroyed(this)).subscribe();
  }

  private applyState(newState: DashConfigItem[]): void {
    // TODO: Remove this method and use the store to update the state
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
    // TODO: Remove this method and use the store to update the state
    this.dashState = dashState;

    if (!this.reorderMode) {
      this.renderedWidgets = this.dashState.filter((widget) => widget.rendered);
    }
  }

  private onScreenSizeChange(newScreenType: ScreenType, oldScreenType: ScreenType): void {
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
    this.reorderMode = false;
    this.isSavingState = false;

    if (this.previousState) {
      this.setDashState(this.previousState);
      delete this.previousState;
    }
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
    this.isSavingState = true;

    this.ws.call('auth.set_attribute', ['dashState', state])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.exitReorderMode();
          this.store$.dispatch(dashboardStateUpdated({ dashboardState: state }));
          this.cdr.markForCheck();
        },
        error: () => {
          this.exitReorderMode();
          this.cdr.markForCheck();
        },
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
}
