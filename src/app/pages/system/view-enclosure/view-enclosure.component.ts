import {
  Component, AfterContentInit, OnDestroy, ViewChild, ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { ErrorMessage } from 'app/core/classes/ix-interfaces';
import { SystemProfiler } from 'app/core/classes/system-profiler';
import { CoreService } from 'app/core/services/core-service/core.service';
import { CoreEvent } from 'app/interfaces/events';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';

interface ViewConfig {
  name: string;
  alias: string; // Used for tab label
  icon: string;
  id: number;
  elementIndex?: number;
  showInNavbar: boolean;
}

@UntilDestroy()
@Component({
  selector: 'view-enclosure',
  templateUrl: './view-enclosure.component.html',
  styleUrls: ['./view-enclosure.component.scss'],
})
export class ViewEnclosureComponent implements AfterContentInit, OnDestroy {
  errors: ErrorMessage[] = [];
  events: Subject<CoreEvent> ;
  @ViewChild('navigation', { static: false }) nav: ElementRef;

  // public currentView: ViewConfig
  currentView: ViewConfig = {
    name: 'Disks',
    alias: 'Disks',
    icon: 'harddisk',
    id: 0,
    showInNavbar: true,
  };

  scrollContainer: HTMLElement;
  system: SystemProfiler;
  selectedEnclosure: any;
  views: ViewConfig[] = [];
  spinner = true;

  supportedHardware = false;
  system_manufacturer: string;
  private _system_product: string;
  get system_product(): string {
    return this._system_product;
  }
  set system_product(value) {
    if (!this._system_product) {
      this._system_product = value;
      this.core.emit({ name: 'EnclosureDataRequest', sender: this });
    }
  }

  changeView(index: number): void {
    this.currentView = this.views[index];
  }

  constructor(private core: CoreService, protected router: Router) {
    this.events = new Subject<CoreEvent>();
    this.events.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'VisualizerReady':
          this.extractVisualizations();
          break;
        case 'EnclosureCanvas':
          if (!this.nav) {
            console.warn('No navigation UI detected');
            return;
          }
          const selector = '.enclosure-' + evt.data.profile.enclosureKey;
          const el = this.nav.nativeElement.querySelector(selector);

          const oldCanvas = this.nav.nativeElement.querySelector(selector + ' canvas');
          if (oldCanvas) {
            el.removeChild(oldCanvas);
          }

          evt.data.canvas.setAttribute('style', 'width: 80% ;');
          el.appendChild(evt.data.canvas);
          break;
        case 'Error':
          this.errors.push(evt.data);
          console.warn({ ERROR_REPORT: this.errors });
          break;
        case 'SetEnclosureLabel':
          core.emit(evt);
          break;
      }
    });

    core.register({ observerClass: this, eventName: 'ThemeChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      if (this.system) {
        this.extractVisualizations();
      }
    });

    core.register({ observerClass: this, eventName: 'EnclosureData' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      this.system = new SystemProfiler(this.system_product, evt.data);
      this.selectedEnclosure = this.system.profile[this.system.headIndex];
      core.emit({ name: 'DisksRequest', sender: this });
      core.emit({ name: 'SensorDataRequest', sender: this });
    });

    core.register({ observerClass: this, eventName: 'EnclosureLabelChanged' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      this.system.enclosures[evt.data.index].label = evt.data.label;
      this.events.next(evt);
    });

    core.register({ observerClass: this, eventName: 'PoolData' }).pipe(untilDestroyed(this)).subscribe((evt: PoolDataEvent) => {
      this.system.pools = evt.data;
      this.events.next({ name: 'PoolsChanged', sender: this });
      this.addViews();
    });

    core.register({ observerClass: this, eventName: 'SensorData' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      this.system.sensorData = evt.data;
    });

    core.register({ observerClass: this, eventName: 'DisksChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.fetchData();
    });

    core.register({ observerClass: this, eventName: 'DisksData' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      this.system.diskData = evt.data;
      core.emit({ name: 'PoolDataRequest', sender: this });
      setTimeout(() => {
        this.spinner = false;
      }, 1500);
    });

    core.register({ observerClass: this, eventName: 'SysInfo' }).pipe(untilDestroyed(this)).subscribe((evt: SysInfoEvent) => {
      if (!this.system_product) {
        this.system_product = evt.data.system_product;
        this.system_manufacturer = evt.data.system_manufacturer.toLowerCase();
        this.supportedHardware = evt.data.features.enclosure;
      }
    });

    core.emit({ name: 'SysInfoRequest', sender: this });
  }

  fetchData(): void {
    this.core.emit({ name: 'DisksRequest', sender: this });
  }

  ngAfterContentInit(): void {
    this.scrollContainer = document.querySelector('.rightside-content-hold');
    this.scrollContainer.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
    this.scrollContainer.style.overflow = 'auto';
  }

  selectEnclosure(index: number): void {
    this.selectedEnclosure = this.system.profile[index];
    this.addViews();
  }

  extractVisualizations(): void {
    this.system.profile.forEach((item, index) => {
      if (this.system.rearIndex && item.enclosureKey == this.system.rearIndex) { return; }
      if (this.system.profile) {
        this.events.next({ name: 'CanvasExtract', data: this.system.profile[index], sender: this });
      }
    });
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

    this.system.enclosures[this.selectedEnclosure.enclosureKey].elements.forEach((element: any, index: number) => {
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

      if (view.alias == this.currentView.alias) { matchIndex = view.id; }
    });

    this.views = views;

    if (matchIndex && matchIndex > 0) {
      this.currentView = views[matchIndex];
    } else {
      this.currentView = disks;
    }
  }
}
