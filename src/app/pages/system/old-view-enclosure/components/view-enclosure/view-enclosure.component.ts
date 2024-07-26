import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { select, Store } from '@ngrx/store';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { EnclosureElementType } from 'app/enums/enclosure-slot-status.enum';
import { DashboardEnclosure, DashboardEnclosureElements } from 'app/interfaces/enclosure.interface';
import { viewEnclosureElements } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.elements';
import { EnclosureEvent } from 'app/pages/system/old-view-enclosure/interfaces/enclosure-events.interface';
import { ErrorMessage } from 'app/pages/system/old-view-enclosure/interfaces/error-message.interface';
import { OldEnclosure } from 'app/pages/system/old-view-enclosure/interfaces/old-enclosure.interface';
import { ViewConfig } from 'app/pages/system/old-view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/old-view-enclosure/stores/enclosure-store.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import {
  selectHasEnclosureSupport,
  selectIsIxHardware,
  waitForSystemInfo,
} from 'app/store/system-info/system-info.selectors';

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
  selector: 'ix-view-enclosure',
  templateUrl: './view-enclosure.component.html',
  styleUrls: ['./view-enclosure.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ViewEnclosureComponent implements AfterViewInit, OnDestroy {
  errors: ErrorMessage[] = [];
  events: Subject<EnclosureEvent>;
  @ViewChild('navigation', { static: false }) nav: ElementRef<HTMLElement>;
  private disksUpdateSubscriptionId: string;
  private destroyed$ = new ReplaySubject<boolean>(1);
  protected readonly searchableElements = viewEnclosureElements;

  currentView: ViewConfig = {
    name: EnclosureElementType.ArrayDeviceSlot,
    alias: 'Disks',
    icon: 'harddisk',
    enclosureIndex: 0,
    showInNavbar: true,
  };

  hasJbofLicensed = false;
  systemProfile: SystemProfile;
  systemState: EnclosureState;
  views: ViewConfig[] = [];
  supportedHardware = false;
  get minWidth(): string {
    let count = 1;
    if (this.showEnclosureSelector) {
      count = this.systemState.enclosures.length;
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
    );

    if (dataPending && !this.delayPending) {
      return true;
    }
    return false;
  }

  get isRackmount(): boolean {
    return this.controller?.rackmount;
  }

  get selectedEnclosure(): OldEnclosure {
    return this.systemState?.enclosures.find((enclosure) => {
      return enclosure.id === this.selectedEnclosureId;
    });
  }

  get selectedEnclosureId(): string | null {
    if (!this.systemState) return null;
    /* const selected: EnclosureUi = this.systemState.enclosures?.find((enclosure: EnclosureUi) => {
      return enclosure.id === this.systemState.selectedEnclosure;
    });
    return selected ? selected.id : null; */
    return this.systemState.selectedEnclosure;
  }

  get controller(): DashboardEnclosure | null {
    return this.systemState?.enclosures
      ? this.systemState?.enclosures.find((enclosure) => enclosure.controller)
      : null;
  }

  get hasPools(): boolean {
    return this.enclosureStore.getPools(this.selectedEnclosure).length as unknown as boolean;
  }

  /* get shelfCount(): number {
    // TODO: implement actual logic into store
    const shelves = this.systemState.enclosures.filter((enclosureView: EnclosureView) => {
      return (!enclosureView.isController);
    });
    return shelves.length;
  } */

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
    this.currentView = this.views[view.enclosureIndex];
    this.changeDetectorRef.markForCheck();
  }

  constructor(
    public router: Router,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    // private disksUpdateService: DisksUpdateService,
    private enclosureStore: EnclosureStore,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    this.events = new Subject<EnclosureEvent>();
    this.events.pipe(untilDestroyed(this)).subscribe((evt: EnclosureEvent) => {
      switch (evt.name) {
        case 'VisualizerReady':
          this.extractVisualizations();
          break;
        case 'EnclosureCanvas': {
          if (!this.nav) {
            console.warn('No navigation UI detected');
            return;
          }

          const selector = `.enclosure-${(evt).data.enclosureView?.id}`;
          const el = this.nav.nativeElement.querySelector(selector);

          const oldCanvas = this.nav.nativeElement.querySelector(selector + ' canvas');
          if (oldCanvas) {
            el.removeChild(oldCanvas);
          }

          (evt).data.canvas.setAttribute('style', 'width: 80% ;');
          el?.appendChild((evt).data.canvas);

          break;
        }
        case 'Error':
          this.errors.push(evt.data);
          console.warn({ ERROR_REPORT: this.errors });
          break;
      }

      this.changeDetectorRef.markForCheck();
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

    this.store$.pipe(select(selectHasEnclosureSupport), untilDestroyed(this)).subscribe((hasEnclosure) => {
      this.supportedHardware = hasEnclosure;
    });

    this.ws.call('jbof.licensed').pipe(untilDestroyed(this)).subscribe((licensed) => {
      this.hasJbofLicensed = licensed > 0;
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
      if (!this.selectedEnclosureId && state.selectedEnclosure) {
        this.selectEnclosure(state.selectedEnclosure);
      }
      this.systemState = state;

      // Only set Hide on first load of data to avoid rendering every update
      if (this._showEnclosureSelector === EnclosureSelectorState.Uninitialized) {
        this._showEnclosureSelector = state.enclosures.length > 1
          ? EnclosureSelectorState.Show
          : EnclosureSelectorState.Hide;
      }

      if (state.enclosures.length > 1) {
        this._showEnclosureSelector = EnclosureSelectorState.Show;
        this.extractVisualizations();
      }

      setTimeout(() => {
        this.delayPending = false;
        this.addViews();
        this.changeDetectorRef.markForCheck();
      }, 1500);

      this.changeDetectorRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    // this.disksUpdateService.removeSubscriber(this.disksUpdateSubscriptionId);
    this.destroyed$.next(true);
    this.destroyed$.complete();
  }

  selectEnclosure(enclosureId: string): void {
    this.enclosureStore.updateSelectedEnclosure(enclosureId);
    this.events.next({
      name: 'EnclosureSelected',
      sender: this,
    });
    this.addViews();
  }

  extractVisualizations(): void {
    if (this.showEnclosureSelector) {
      this.systemState.enclosures.forEach((enclosure) => {
        if (this.systemState) {
          this.events.next({ name: 'CanvasExtract', data: enclosure, sender: this });
        }
      });
    }
  }

  addViews(): void {
    if (!this.systemState?.enclosures.length) return;

    const views: ViewConfig[] = [];
    const disks: ViewConfig = {
      name: EnclosureElementType.ArrayDeviceSlot,
      alias: 'Disks',
      icon: 'harddisk',
      enclosureIndex: 0,
      showInNavbar: true,
    };

    views.unshift(disks);
    let matchIndex;
    const selectedEnclosure = this.systemState?.enclosures.find((enclosure) => {
      return enclosure.id === this.selectedEnclosureId;
    });
    if (!selectedEnclosure) {
      return;
    }

    // for (const [key, value] of Object.entries(selectedEnclosure?.elements)) {
    Object.entries(selectedEnclosure?.elements)
      .map((keyValue: [string, unknown]) => keyValue[0])
      .filter((elementKey: string) => elementKey !== 'Array Device Slot')
      .forEach((key: string, index) => {
        const view: ViewConfig = {
          name: key as keyof DashboardEnclosureElements,
          alias: '',
          icon: '',
          enclosureIndex: views.length,
          elementIndex: index,
          showInNavbar: true,
        };

        switch (key) {
          case 'Cooling':
            view.alias = key;
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
            view.alias = key;
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
          default:
            view.alias = key;
            view.icon = 'info';
            views.push(view);
            break;
        }

        if (view.alias === this.currentView.alias) { matchIndex = view.enclosureIndex; }
      });
    this.views = views;

    if (matchIndex && matchIndex > 0) {
      this.currentView = views[matchIndex];
    } else {
      this.currentView = disks;
    }

    this.changeDetectorRef.markForCheck();
  }
}
