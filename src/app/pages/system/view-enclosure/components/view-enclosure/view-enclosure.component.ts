import {
  AfterViewInit,
  Component, ElementRef, OnDestroy, TemplateRef, ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CoreEvent } from 'app/interfaces/events';
import { EnclosureCanvasEvent, EnclosureLabelChangedEvent } from 'app/interfaces/events/enclosure-events.interface';
import { Disk } from 'app/interfaces/storage.interface';
import { EnclosureMetadata, SystemProfiler } from 'app/pages/system/view-enclosure/classes/system-profiler';
import { ErrorMessage } from 'app/pages/system/view-enclosure/interfaces/error-message.interface';
import { ViewConfig } from 'app/pages/system/view-enclosure/interfaces/view.config';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { DisksUpdateService } from 'app/services/disks-update.service';
import { LayoutService } from 'app/services/layout.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import { selectIsIxHardware, waitForSystemFeatures, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  templateUrl: './view-enclosure.component.html',
  styleUrls: ['./view-enclosure.component.scss'],
})
export class ViewEnclosureComponent implements AfterViewInit, OnDestroy {
  errors: ErrorMessage[] = [];
  events: Subject<CoreEvent>;
  @ViewChild('navigation', { static: false }) nav: ElementRef;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;
  private disksUpdateSubscriptionId: string;

  currentView: ViewConfig = {
    name: 'Disks',
    alias: 'Disks',
    icon: 'harddisk',
    id: 0,
    showInNavbar: true,
  };

  system: SystemProfiler;
  selectedEnclosure: EnclosureMetadata;
  views: ViewConfig[] = [];
  spinner = true;
  isIxHardware = false;
  supportedHardware = false;

  get showEnclosureSelector(): boolean {
    if (
      !this.system
      || !this.events
      || !this.system.pools
      || !this.system.enclosures
      || !this.supportedHardware
    ) return false;

    return (this.system.getShelfCount() > 0);
  }

  private _systemProduct: string;
  get systemProduct(): string {
    return this._systemProduct;
  }
  set systemProduct(value) {
    if (!this._systemProduct) {
      this._systemProduct = value;
      this.loadEnclosureData();
    }
  }

  changeView(index: number): void {
    this.currentView = this.views[index];
  }

  constructor(
    private core: CoreService,
    public router: Router,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private layoutService: LayoutService,
    private disksUpdateService: DisksUpdateService,
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
          const selector = `.enclosure-${(evt as EnclosureCanvasEvent).data.profile.enclosureKey}`;
          const el = this.nav.nativeElement.querySelector(selector);

          const oldCanvas = this.nav.nativeElement.querySelector(selector + ' canvas');
          if (oldCanvas) {
            el.removeChild(oldCanvas);
          }

          (evt as EnclosureCanvasEvent).data.canvas.setAttribute('style', 'width: 80% ;');
          el.appendChild((evt as EnclosureCanvasEvent).data.canvas);
          break;
        }
        case 'Error':
          this.errors.push(evt.data as ErrorMessage);
          console.warn({ ERROR_REPORT: this.errors });
          break;
      }
    });

    this.store$.select(selectTheme).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      if (this.system) {
        this.extractVisualizations();
      }
    });

    core.register({ observerClass: this, eventName: 'EnclosureLabelChanged' }).pipe(untilDestroyed(this)).subscribe((evt: EnclosureLabelChangedEvent) => {
      this.system.enclosures[evt.data.index].label = evt.data.label;
      this.events.next(evt);
    });

    this.store$.pipe(waitForSystemInfo, untilDestroyed(this))
      .subscribe((sysInfo) => {
        if (!this.systemProduct) {
          this.systemProduct = sysInfo.system_product;
        }
      });

    this.store$.pipe(waitForSystemFeatures, untilDestroyed(this)).subscribe((systemFeatures) => {
      this.supportedHardware = systemFeatures.enclosure;
    });

    this.store$.select(selectIsIxHardware).pipe(
      untilDestroyed(this),
    ).subscribe((isIxHardware) => {
      this.isIxHardware = isIxHardware;
    });
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  ngOnDestroy(): void {
    this.disksUpdateService.removeSubscriber(this.disksUpdateSubscriptionId);
    this.core.unregister({ observerClass: this });
  }

  selectEnclosure(index: number): void {
    this.selectedEnclosure = this.system.profile[index];
    this.addViews();
  }

  extractVisualizations(): void {
    if (this.showEnclosureSelector) {
      this.system.profile.forEach((item, index) => {
        if (this.system.rearIndex && item.enclosureKey === this.system.rearIndex) { return; }
        if (this.system.profile) {
          this.events.next({ name: 'CanvasExtract', data: this.system.profile[index], sender: this });
        }
      });
    }
  }

  addViews(): void {
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

    this.system.enclosures[this.selectedEnclosure.enclosureKey].elements.forEach((element, index) => {
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

  private loadEnclosureData(): void {
    this.ws.call('enclosure.query').pipe(untilDestroyed(this)).subscribe((enclosures) => {
      if (enclosures.length === 0) {
        const noDataError: ErrorMessage = {
          name: 'No Enclosure Data',
          message: 'The system did not return any enclosure data. Nothing to display',
        };
        this.errors.push(noDataError);
        return;
      }

      this.system = new SystemProfiler(this.systemProduct, enclosures);
      this.selectedEnclosure = this.system.profile[this.system.headIndex];
      this.loadDiskData();

      this.ws.call('sensor.query').pipe(untilDestroyed(this)).subscribe((sensorData) => {
        this.system.sensorData = sensorData;
      });
    });
  }

  private loadDiskData(): void {
    this.ws.call('disk.query').pipe(untilDestroyed(this)).subscribe((disks) => {
      this.handleLoadedDisks(disks);
      setTimeout(() => {
        this.spinner = false;
      }, 1500);
    });
    if (!this.disksUpdateSubscriptionId) {
      const diskUpdatesTrigger$ = new Subject<Disk[]>();
      diskUpdatesTrigger$.pipe(untilDestroyed(this)).subscribe((disks) => {
        this.handleLoadedDisks(disks);
      });
      this.disksUpdateSubscriptionId = this.disksUpdateService.addSubscriber(diskUpdatesTrigger$, true);
    }
  }

  handleLoadedDisks(disks: Disk[]): void {
    this.system.diskData = disks;
    this.ws.call('pool.query').pipe(untilDestroyed(this)).subscribe((pools) => {
      this.system.pools = pools;
      this.events.next({ name: 'PoolsChanged', sender: this });
      this.addViews();
      this.extractVisualizations();
    });
  }
}
