import {
  Component, OnDestroy, ViewChild, ElementRef,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { ErrorMessage } from 'app/core/classes/ix-interfaces';
import { EnclosureMetadata, SystemProfiler } from 'app/core/classes/system-profiler';
import { CoreService } from 'app/core/services/core-service/core.service';
import { PoolScanState } from 'app/enums/pool-scan-state.enum';
import { CoreEvent } from 'app/interfaces/events';
import { DisksDataEvent } from 'app/interfaces/events/disks-data-event.interface';
import { EnclosureDataEvent } from 'app/interfaces/events/enclosure-data-event.interface';
import { PoolDataEvent } from 'app/interfaces/events/pool-data-event.interface';
import { ResilveringEvent } from 'app/interfaces/events/resilvering-event.interface';
import { SensorDataEvent } from 'app/interfaces/events/sensor-data-event.interface';
import { SysInfoEvent } from 'app/interfaces/events/sys-info-event.interface';
import { EntityToolbarComponent } from 'app/pages/common/entity/entity-toolbar/entity-toolbar.component';

export interface ViewConfig {
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
export class ViewEnclosureComponent implements OnDestroy {
  errors: ErrorMessage[] = [];
  events: Subject<CoreEvent> ;
  formEvent$: Subject<CoreEvent> ;
  @ViewChild('navigation', { static: false }) nav: ElementRef;

  currentView: ViewConfig = {
    name: 'Disks',
    alias: 'Disks',
    icon: 'harddisk',
    id: 0,
    showInNavbar: true,
  };

  scrollContainer: HTMLElement;
  system: SystemProfiler;
  selectedEnclosure: EnclosureMetadata;
  views: ViewConfig[] = [];
  spinner = true;

  supportedHardware = false;

  get showEnclosureSelector(): boolean {
    if (
      !this.system
      || !this.events
      || !this.system.pools
      || !this.system.enclosures
      || !this.supportedHardware
    ) return false;

    // These conditions are here because M series actually reports a separate chassis for
    // the rear bays. SystemProfiler will store a rearIndex value for those machines.
    if (this.system && this.system.rearIndex && this.system.profile.length > 2) {
      return true;
    } if (this.system && !this.system.rearIndex && this.system.profile.length > 1) {
      return true;
    }
    return false;
  }

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

  constructor(private core: CoreService, public router: Router) {
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

    core.register({ observerClass: this, eventName: 'EnclosureData' }).pipe(untilDestroyed(this)).subscribe((evt: EnclosureDataEvent) => {
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

    core.register({ observerClass: this, eventName: 'SensorData' }).pipe(untilDestroyed(this)).subscribe((evt: SensorDataEvent) => {
      this.system.sensorData = evt.data;
    });

    core.register({ observerClass: this, eventName: 'Resilvering' }).pipe(untilDestroyed(this)).subscribe((evt: ResilveringEvent) => {
      if (evt.data.scan.state == PoolScanState.Finished) this.fetchData();
    });

    core.register({ observerClass: this, eventName: 'DisksChanged' }).pipe(untilDestroyed(this)).subscribe(() => {
      this.fetchData();
    });

    core.register({ observerClass: this, eventName: 'DisksData' }).pipe(untilDestroyed(this)).subscribe((evt: DisksDataEvent) => {
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

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
  }

  selectEnclosure(index: number): void {
    this.selectedEnclosure = this.system.profile[index];
    this.addViews();
  }

  extractVisualizations(): void {
    if (this.showEnclosureSelector) {
      this.system.profile.forEach((item, index) => {
        if (this.system.rearIndex && item.enclosureKey == this.system.rearIndex) { return; }
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

      if (view.alias == this.currentView.alias) { matchIndex = view.id; }
    });

    this.views = views;

    if (matchIndex && matchIndex > 0) {
      this.currentView = views[matchIndex];
    } else {
      this.currentView = disks;
    }

    // Setup event listener
    if (this.views.length > 0) {
      this.formEvent$ = new Subject<CoreEvent>();
      this.formEvent$.pipe(
        untilDestroyed(this),
      ).subscribe((evt: CoreEvent) => {
        const nextView = this.views.find((view) => view.alias == evt.data.configFiles.value);
        this.changeView(nextView.id);
      });
    }

    // Setup/update ViewActions that live in page title component
    const actionsConfig = {
      actionType: EntityToolbarComponent,
      actionConfig: {
        target: this.formEvent$,
        controls: [
          {
            name: 'configFiles',
            label: 'Elements',
            type: 'menu',
            color: 'primary',
            options: this.views.map((view) => {
              return { label: view.alias, value: view.alias };
            }),
          },
        ],
      },
    };

    if (this.views && this.views.length > 1) {
      this.core.emit({ name: 'GlobalActions', data: actionsConfig, sender: this });
    }
  }
}
