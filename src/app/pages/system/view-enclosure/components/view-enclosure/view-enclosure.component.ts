import {
  AfterViewInit, ChangeDetectorRef,
  Component, ElementRef, OnDestroy, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Enclosure, EnclosureElement, EnclosureView } from 'app/interfaces/enclosure.interface';
import { CoreEvent } from 'app/interfaces/events';
import { EnclosureCanvasEvent } from 'app/interfaces/events/enclosure-events.interface';
import { ErrorMessage } from 'app/pages/system/view-enclosure/interfaces/error-message.interface';
import { ViewConfig } from 'app/pages/system/view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/view-enclosure/stores/enclosure-store.service';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectIsIxHardware, waitForSystemFeatures, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

export interface SystemProfile {
  enclosureStore$: Observable<EnclosureState>;
}

export enum EnclosureSelectorState {
  Show = 'show',
  Hide = 'hide',
  Uninitialized = 'uninitialized',
}

@UntilDestroy()
@Component({
  templateUrl: './view-enclosure.component.html',
  styleUrls: ['./view-enclosure.component.scss'],
})
export class ViewEnclosureComponent implements AfterViewInit, OnDestroy {
  errors: ErrorMessage[] = [];
  events: Subject<CoreEvent>;
  @ViewChild('navigation', { static: false }) nav: ElementRef<HTMLElement>;
  private disksUpdateSubscriptionId: string;
  private destroyed$ = new ReplaySubject<boolean>(1);

  currentView: ViewConfig = {
    name: 'Disks',
    alias: 'Disks',
    icon: 'harddisk',
    id: 0,
    showInNavbar: true,
  };

  systemProfile: SystemProfile;
  systemState: EnclosureState;
  views: ViewConfig[] = [];
  supportedHardware = false;
  get minWidth(): string {
    let count = 1;
    if (this.showEnclosureSelector) {
      count = this.systemState.enclosureViews.length;
    }

    return (count * 240).toString();
  }

  private _showEnclosureSelector: EnclosureSelectorState = EnclosureSelectorState.Uninitialized;
  get showEnclosureSelector(): boolean {
    return this._showEnclosureSelector === EnclosureSelectorState.Show;
  }

  get showVisualizer(): boolean {
    return this._showEnclosureSelector !== EnclosureSelectorState.Uninitialized
      && this.systemState?.enclosures.length > 0;
  }

  delayPending = true;
  get spinner(): boolean {
    const dataPending = (
      !this.systemState
      || this.systemState.areEnclosuresLoading
      || this.systemState.areDisksLoading
      || this.systemState.arePoolsLoading
    );

    if (dataPending && !this.delayPending) {
      return true;
    }
    return false;
  }

  get isRackmount(): boolean {
    switch (this.systemProduct) {
      case 'FREENAS-MINI-3.0':
      case 'TRUENAS-MINI-3.0':
      case 'FREENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E+':
      case 'FREENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X+':
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        return false;
      default:
        return true;
    }
  }

  get selectedEnclosure(): number | null {
    if (!this.systemState) return null;
    const selected = this.systemState.enclosureViews?.find((view: EnclosureView) => {
      return view.number === this.systemState.selectedEnclosure;
    });
    return selected ? selected.number : null;
  }

  get controller(): EnclosureView | null {
    return this.systemState?.enclosureViews
      ? this.systemState?.enclosureViews.find((enclosureView: EnclosureView) => enclosureView.isController)
      : null;
  }

  get shelfCount(): number {
    // TODO: implement actual logic into store
    const shelves = this.systemState.enclosureViews.filter((enclosureView: EnclosureView) => {
      return (!enclosureView.isController);
    });
    return shelves.length;
  }

  isIxHardware = false;
  private _systemProduct: string;
  get systemProduct(): string {
    return this._systemProduct;
  }
  set systemProduct(value) {
    if (!this._systemProduct) {
      this._systemProduct = value;
    }
  }

  changeView(view: ViewConfig): void {
    this.currentView = this.views[view.id];
  }

  constructor(
    public router: Router,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private disksUpdateService: DisksUpdateService,
    private enclosureStore: EnclosureStore,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.events = new Subject<CoreEvent>();
    this.events.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'VisualizerReady':
          this.extractVisualizations();
          break;
        case 'EnclosureCanvas': {
          if (!this.nav) {
            console.warn('No navigation UI detected');
            return;
          }

          const selector = `.enclosure-${(evt as EnclosureCanvasEvent).data.enclosureView?.number}`;
          const el = this.nav.nativeElement.querySelector(selector);

          const oldCanvas = this.nav.nativeElement.querySelector(selector + ' canvas');
          if (oldCanvas) {
            el.removeChild(oldCanvas);
          }

          (evt as EnclosureCanvasEvent).data.canvas.setAttribute('style', 'width: 80% ;');
          el?.appendChild((evt as EnclosureCanvasEvent).data.canvas);

          break;
        }
        case 'Error':
          this.errors.push(evt.data as ErrorMessage);
          console.warn({ ERROR_REPORT: this.errors });
          break;
      }
    });

    this.store$.select(selectTheme).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      if (this.systemProfile) {
        this.extractVisualizations();
      }
    });

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this))
      .subscribe((sysInfo) => {
        if (!this.systemProduct) {
          this.systemProduct = sysInfo.system_product;
        }
      });

    this.store$.select(selectIsIxHardware).pipe(
      untilDestroyed(this),
    ).subscribe((isIxHardware) => {
      this.isIxHardware = isIxHardware;
    });

    this.store$.pipe(waitForSystemFeatures, untilDestroyed(this)).subscribe((systemFeatures) => {
      this.supportedHardware = systemFeatures.enclosure;
    });
  }

  ngAfterViewInit(): void {
    this.enclosureStore.loadData();
    this.systemProfile = {
      enclosureStore$: this.enclosureStore.data$,
    };

    this.enclosureStore.data$.pipe(
      takeUntil(this.destroyed$),
      untilDestroyed(this),
    ).subscribe((state: EnclosureState) => {
      this.systemState = state;

      // Only set Hide on first load of data to avoid rendering every update
      if (this._showEnclosureSelector === EnclosureSelectorState.Uninitialized) {
        this._showEnclosureSelector = state.enclosureViews.length > 1
          ? EnclosureSelectorState.Show
          : EnclosureSelectorState.Hide;
      }

      if (state.enclosureViews.length > 1) {
        this._showEnclosureSelector = EnclosureSelectorState.Show;
        this.extractVisualizations();
      }

      setTimeout(() => {
        this.delayPending = false;
        this.addViews();
      }, 1500);

      this.changeDetectorRef.detectChanges();
    });
  }

  ngOnDestroy(): void {
    this.disksUpdateService.removeSubscriber(this.disksUpdateSubscriptionId);
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  selectEnclosure(enclosureNumber: number): void {
    this.enclosureStore.updateSelectedEnclosure(enclosureNumber);
    this.events.next({
      name: 'EnclosureSelected',
      sender: this,
    });
    this.addViews();
  }

  extractVisualizations(): void {
    if (this.showEnclosureSelector) {
      this.systemState.enclosureViews.forEach((enclosureView: EnclosureView) => {
        if (this.systemState) {
          this.events.next({ name: 'CanvasExtract', data: enclosureView, sender: this });
        }
      });
    }
  }

  addViews(): void {
    if (!this.systemState?.enclosures) return;

    const views = [];
    const disks = {
      name: 'Disks',
      alias: 'Disks',
      icon: 'harddisk',
      id: 0,
      showInNavbar: true,
    };

    views.unshift(disks);
    let matchIndex;
    const selectedEnclosure = this.systemState?.enclosures.find((enclosure: Enclosure) => {
      return enclosure.number === this.selectedEnclosure;
    });
    selectedEnclosure?.elements?.forEach((el: unknown, index: number) => {
      const element = el as EnclosureElement;
      const view = {
        name: element.name,
        alias: '',
        icon: '',
        id: views.length,
        elementIndex: index,
        showInNavbar: true,
      };

      switch (element.name) {
        case 'Cooling':
          view.alias = element.name;
          view.icon = 'fan';
          views.push(view);
          break;
        case 'Temperature Sensor':
          view.alias = 'Temperature';
          view.icon = 'fan';
          views.push(view);
          break;
        case 'Voltage Sensor':
          view.alias = 'Voltage';
          view.icon = 'flash';
          views.push(view);
          break;
        case 'Power Supply':
          view.alias = element.name;
          view.icon = 'flash';
          views.push(view);
          break;
        case 'SAS Connector':
          view.alias = 'SAS';
          view.icon = 'flash';
          views.push(view);
          break;
        case 'Enclosure Services Controller Electronics':
          view.alias = 'Services';
          view.icon = 'flash';
          views.push(view);
          break;
      }

      if (view.alias === this.currentView.alias) { matchIndex = view.id; }
    });

    this.views = views;

    if (matchIndex && matchIndex > 0) {
      this.currentView = views[matchIndex];
    } else {
      this.currentView = disks;
    }
  }
}
