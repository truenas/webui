import {
  AfterContentInit, ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Application, Container } from 'pixi.js';
import * as popmotion from 'popmotion';
import { ValueReaction } from 'popmotion/lib/reactions/value';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { EnclosureSlotStatus } from 'app/enums/enclosure-slot-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import {
  Enclosure, EnclosureElement, EnclosureSlot, EnclosureView,
} from 'app/interfaces/enclosure.interface';
import { CoreEvent } from 'app/interfaces/events';
import { CanvasExtractEvent, DriveSelectedEvent } from 'app/interfaces/events/disk-events.interface';
import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Disk, TopologyDisk } from 'app/interfaces/storage.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { ChassisView } from 'app/pages/system/view-enclosure/classes/chassis-view';
import { DriveTray } from 'app/pages/system/view-enclosure/classes/drivetray';
import { Chassis } from 'app/pages/system/view-enclosure/classes/hardware/chassis';
import { E16 } from 'app/pages/system/view-enclosure/classes/hardware/e16';
import { E24 } from 'app/pages/system/view-enclosure/classes/hardware/e24';
import { E60 } from 'app/pages/system/view-enclosure/classes/hardware/e60';
import { Es102 } from 'app/pages/system/view-enclosure/classes/hardware/es102';
import { Es12 } from 'app/pages/system/view-enclosure/classes/hardware/es12';
import { Es24 } from 'app/pages/system/view-enclosure/classes/hardware/es24';
import { Es24F } from 'app/pages/system/view-enclosure/classes/hardware/es24f';
import { Es60 } from 'app/pages/system/view-enclosure/classes/hardware/es60';
import { F60 } from 'app/pages/system/view-enclosure/classes/hardware/f60';
import { M50 } from 'app/pages/system/view-enclosure/classes/hardware/m50';
import { MINIR } from 'app/pages/system/view-enclosure/classes/hardware/mini-r';
import { R10 } from 'app/pages/system/view-enclosure/classes/hardware/r10';
import { R20 } from 'app/pages/system/view-enclosure/classes/hardware/r20';
import { R20A } from 'app/pages/system/view-enclosure/classes/hardware/r20a';
import { R20B } from 'app/pages/system/view-enclosure/classes/hardware/r20b';
import { R30 } from 'app/pages/system/view-enclosure/classes/hardware/r30';
import { R40 } from 'app/pages/system/view-enclosure/classes/hardware/r40';
import { R50 } from 'app/pages/system/view-enclosure/classes/hardware/r50';
import { R50B } from 'app/pages/system/view-enclosure/classes/hardware/r50b';
import { R50Bm } from 'app/pages/system/view-enclosure/classes/hardware/r50bm';
import { VDevLabelsSvg } from 'app/pages/system/view-enclosure/classes/v-dev-labels-svg';
import {
  SetEnclosureLabelDialogComponent,
  SetEnclosureLabelDialogData,
} from 'app/pages/system/view-enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { SystemProfile } from 'app/pages/system/view-enclosure/components/view-enclosure/view-enclosure.component';
import { ViewConfig } from 'app/pages/system/view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/view-enclosure/stores/enclosure-store.service';
import { DialogService } from 'app/services/dialog.service';
import { DiskTemperatureService, Temperature } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';
import CanvasExtract = PIXI.extract.CanvasExtract;

export enum EnclosureLocation {
  Front = 'front',
  Rear = 'rear',
  Internal = 'internal',
}

export interface DiskFailure {
  disk: string;
  enclosure: number;
  slot: number;
  location: string;
  reasons?: string[];
}

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-disks',
  templateUrl: './enclosure-disks.component.html',
  styleUrls: ['./enclosure-disks.component.scss'],
})
export class EnclosureDisksComponent implements AfterContentInit, OnDestroy {
  showCaption = true;
  protected aborted = false;

  @ViewChild('visualizer', { static: true }) visualizer: ElementRef<HTMLElement>;
  @ViewChild('disksoverview', { static: true }) overview: ElementRef<HTMLElement>;
  @ViewChild('diskdetails', { static: false }) details: ElementRef<HTMLElement>;
  @ViewChild('domLabels', { static: false }) domLabels: ElementRef<HTMLElement>;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('current-tab') currentTab: ViewConfig;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('controller-events') controllerEvent$: Subject<CoreEvent>;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('profile') systemProfile: SystemProfile;
  enclosureViews: EnclosureView[] = [];
  systemState: EnclosureState;

  // TODO: Implement Expanders
  get expanders(): EnclosureElement[] {
    return this.selectedEnclosureView.expanders;
  }
  // Tracked by parent component
  get selectedEnclosureNumber(): number {
    const selected: number = this.systemState?.selectedEnclosure !== null
      ? Number(this.systemState?.selectedEnclosure) : -1;
    return selected;
  }

  // Tracked by this component
  selectedSlotNumber: number | null = null;

  get selectedEnclosure(): Enclosure {
    return this.systemState?.enclosures?.filter((enclosure: Enclosure) => {
      return enclosure.number === this.selectedEnclosureNumber;
    })[0];
  }

  get selectedEnclosureView(): EnclosureView | null {
    if (this.selectedEnclosureNumber > -1 && this.systemState.enclosureViews.length) {
      return this.systemState?.enclosureViews?.filter((view: EnclosureView) => {
        return view.number === this.selectedEnclosureNumber;
      })[0];
    }
    return null;
  }

  get selectedSlot(): EnclosureSlot | null {
    if (this.selectedEnclosureView) {
      const selected = this.selectedEnclosureView.slots
        .find((enclosure: EnclosureSlot) => enclosure.slot === this.selectedSlotNumber);
      return selected || null;
    }
    return null;
  }

  get selectedVdevDisks(): string[] {
    const selectedSlot = this.selectedSlot;
    const result = selectedSlot?.vdev?.type === TopologyItemType.Disk
      ? [selectedSlot.vdev.disk]
      : selectedSlot?.vdev?.children?.map((item: TopologyDisk) => item.disk);

    if (result) {
      return result.filter((name: string) => name !== null);
    }
    return [];
  }

  get selectedVdevSlotNumbers(): { [devName: string]: number } {
    const result: unknown = {};
    this.selectedVdevDisks.forEach((diskName: string) => {
      const disk = this.systemState.disks.filter((drive: Disk) => drive.name === diskName);
      if (disk.length) (result as { [devName: string]: number })[disk[0].name] = disk[0].enclosure.slot;
    });

    return result as { [devName: string]: number };
  }

  get selectedVdevSlots(): EnclosureSlot[] | null {
    if (!this.selectedVdevDisks) return [];

    const selectedVdevSlots: unknown[] = this.selectedVdevDisks.map((diskName: string) => {
      const enclosure = this.systemState.disks.find((disk: Disk) => disk.name === diskName)?.enclosure;

      if (enclosure) {
        return this.systemState.enclosureViews.find((view: EnclosureView) => {
          return view.number === enclosure.number;
        }).slots.find((eSlot: EnclosureSlot) => {
          return eSlot.slot === enclosure.slot;
        });
      }
      return null;
    });

    return selectedVdevSlots as EnclosureSlot[];
  }

  get selectedEnclosurePools(): string[] {
    return this.selectedEnclosureView.pools;
  }

  // Data fetching. TODO: Move to service or store
  get unhealthyPools(): Pool[] {
    return this.systemState.pools.filter((pool: Pool) => {
      return !pool.healthy && this.selectedEnclosurePools.includes(pool.name);
    });
  }

  // Find bad status strings in both disk.status and slot.status.
  // TODO: Move to service or store
  get failedDisks(): DiskFailure[] {
    if (!this.selectedEnclosureView) return [];

    const failedDisks: DiskFailure[] = [];
    const failedSlots = this.selectedEnclosureView.slots.filter((slot: EnclosureSlot) => {
      const triggers: string[] = [
        TopologyItemStatus.Unavail,
        TopologyItemStatus.Faulted,
      ];
      return triggers.includes(slot.topologyStatus);
    });

    failedSlots.forEach((slot: EnclosureSlot) => {
      if (!slot.disk) return;

      const failure: DiskFailure = {
        disk: slot.disk.name,
        enclosure: slot.enclosure,
        slot: slot.slot,
        location: this.view,
        reasons: [slot.topologyStatus],
      };
      failedDisks.push(failure);
    });

    return failedDisks;
  }

  get isTopologyDisk(): boolean {
    return this.selectedSlot?.vdev?.type === TopologyItemType.Disk;
  }
  // END DATA PROPERTIES

  temperatures: Temperature;

  // PIXI and View related...
  app: Application;
  private resources = PIXI.loader.resources;
  container: Container;

  subenclosure: { poolKeys: Record<string, number> }; // Declare rear and internal enclosure visualizations here

  chassis: Chassis;
  view: string = EnclosureLocation.Front;
  get chassisView(): ChassisView {
    if (!this.chassis) return null;

    switch (this.view) {
      case EnclosureLocation.Rear:
        return this.chassis.rear;
      case EnclosureLocation.Internal:
        return this.chassis.internal;
      default:
        return this.chassis.front;
    }
  }

  get hideIdentifyDrive(): boolean {
    const selectedEnclosureView = this.selectedEnclosureView;
    return selectedEnclosureView.model === 'TRUENAS-MINI-R';
  }

  theme: Theme;
  protected themeUtils: ThemeUtils;
  currentView: string; // pools || status || expanders || details
  exitingView: string; // pools || status || expanders || details

  protected defaultView = 'pools';
  protected emptySlotView: string | null = 'details';
  private labels: VDevLabelsSvg;
  private identifyBtnRef: {
    animation: popmotion.ColdSubscription;
    originalState: string;
    styler: ValueReaction;
  };
  protected pixiWidth = 960;
  protected pixiHeight = 304;

  readonly EnclosureLocation = EnclosureLocation;

  constructor(
    public cdr: ChangeDetectorRef,
    public dialogService: DialogService,
    protected translate: TranslateService,
    protected ws: WebSocketService,
    protected store$: Store<AppState>,
    protected themeService: ThemeService,
    protected diskTemperatureService: DiskTemperatureService,
    protected matDialog: MatDialog,
    protected enclosureStore: EnclosureStore,
  ) {
    this.themeUtils = new ThemeUtils();
    this.diskTemperatureService.listenForTemperatureUpdates();

    this.diskTemperatureService.temperature$.pipe(untilDestroyed(this)).subscribe((data) => {
      const chassisView: ChassisView = this.chassisView && this.view === 'rear' ? this.chassis?.rear : this.chassis?.front;
      if (!this.chassis || !chassisView?.driveTrayObjects) { return; }

      const clone: Temperature = { ...data };
      clone.values = {};
      clone.keys = [];

      if (chassisView?.driveTrayObjects) {
        const enclosureView: EnclosureView = this.selectedEnclosureView;
        chassisView.driveTrayObjects.forEach((dt: DriveTray) => {
          const disk = enclosureView.slots.find((enclosureSlot: EnclosureSlot) => {
            return enclosureSlot.slot === parseInt(dt.id);
          })?.disk;

          if (disk) {
            clone.keys.push(disk.name);
            clone.values[disk.name] = data.values[disk.name];
          }
        });
      } else {
        console.warn({
          message: 'No Chassis View Available',
          chassisView,
          thisChassisView: this.chassisView,
        });
      }

      this.temperatures = clone;
    });
    this.diskTemperatureService.diskTemperaturesSubscribe();

    this.store$.select(selectTheme).pipe(
      filter(Boolean),
      map(() => this.themeService.currentTheme()),
      untilDestroyed(this),
    ).subscribe((theme: Theme) => {
      this.theme = theme;
      this.setCurrentView(this.currentView);
      if (this.labels?.events$) {
        this.labels.events$.next({ name: 'ThemeChanged', data: theme, sender: this });
      }
      this.optimizeChassisOpacity();
    });
  }

  clearDisk(): void {
    this.setCurrentView(this.defaultView);
  }

  // Mainly data subscription and PIXI setup
  ngAfterContentInit(): void {
    this.systemProfile.enclosureStore$.pipe(untilDestroyed(this))
      .subscribe((data: EnclosureState) => {
        if (data.enclosureViews.length) {
          this.systemState = data;

          if (!this.app) {
            this.appSetup();
          }
        }
      });
  }

  // PIXI Visualization Setup
  appSetup(): void {
    this.controllerEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'CanvasExtract':
          this.createExtractedEnclosure((evt as CanvasExtractEvent).data);
          break;
        case 'PoolsChanged':
          this.setDisksEnabledState();
          this.setCurrentView(this.defaultView);
          break;
        case 'EnclosureSelected':
          // Enabled subenclosure functionality
          this.loadEnclosure(
            this.selectedEnclosureView,
            EnclosureLocation.Front,
            (this.chassisView !== null), // TODO: Make sure this doesn't break on enclosure selection
          );
          break;
      }
    });

    this.pixiInit();

    // Listen for DOM changes to avoid race conditions with animations
    const callback = (mutationList: MutationRecord[]): void => {
      mutationList.forEach((mutation) => {
        switch (mutation.type) {
          case 'childList': {
            /* One or more children have been added to and/or removed
               from the tree; see mutation.addedNodes and
               mutation.removedNodes */
            const element = mutation.addedNodes?.[0] as HTMLElement;
            if (
              !element?.classList
              || mutation.addedNodes.length === 0
              || element.classList.length === 0
            ) {
              break;
            }
            const fullStage: boolean = element.classList.contains('full-stage');
            const stageLeft: boolean = element.classList.contains('stage-left');
            const stageRight: boolean = element.classList.contains('stage-right');
            if (stageLeft) {
              this.enter('stage-left'); // View has changed so we launch transition animations
            } else if (stageRight) {
              this.enter('stage-right'); // View has changed so we launch transition animations
            } else if (fullStage) {
              this.enter('full-stage'); // View has changed so we launch transition animations
            }
            break;
          }
          case 'attributes': {
            /* An attribute value changed on the element in
               mutation.target; the attribute name is in
               mutation.attributeName and its previous value is in
               mutation.oldValue */

            const diskName: boolean = (mutation.target as HTMLElement).classList.contains('disk-name');

            if (diskName && this.currentView === 'details' && this.exitingView === 'details') {
              this.updateHtml('stage-right'); // View has changed so we launch transition animations
              this.updateHtml('stage-left'); // View has changed so we launch transition animations
            }
            break;
          }
        }
      });
    };

    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true, // Omit or set to false to observe only changes to the parent node.
    };

    const domChanges = new MutationObserver(callback);
    domChanges.observe(this.overview?.nativeElement, observerOptions);
  }

  // Component Cleanup
  ngOnDestroy(): void {
    this.diskTemperatureService.diskTemperaturesUnsubscribe();
    this.destroyAllEnclosures();
    this.app.stage.destroy(true);
    this.app.destroy(true);
  }

  // Recreates enclosure when switching between enclosures or front/rear/internal visualizations
  loadEnclosure(enclosureView: EnclosureView, view?: string, update?: boolean): void {
    if (this.selectedSlotNumber > -1) {
      this.clearDisk();
    }
    this.destroyEnclosure();
    if (view) {
      this.view = view;
    }
    if (update && this.chassisView) {
      this.createEnclosure(enclosureView);
    }
  }

  // Instantiate PIXI stuff
  pixiInit(): void {
    PIXI.settings.PRECISION_FRAGMENT = 'highp'; // this makes text looks better? Answer = NO
    PIXI.settings.SPRITE_MAX_TEXTURES = Math.min(PIXI.settings.SPRITE_MAX_TEXTURES, 16);// Fixes FireFox gl errors
    PIXI.utils.skipHello();
    this.app = new PIXI.Application({
      width: this.pixiWidth,
      height: this.pixiHeight,
      forceCanvas: false,
      transparent: true,
      antialias: true,
      autoStart: true,
    });

    this.app.renderer.backgroundColor = 0x000000;
    this.visualizer.nativeElement.appendChild(this.app.view);

    this.container = new PIXI.Container();
    this.container.name = 'top_level_container';
    this.app.stage.name = 'stage_container';
    this.app.stage.addChild(this.container);
    this.container.width = this.app.stage.width;
    this.container.height = this.app.stage.height;

    this.createEnclosure();
    this.controllerEvent$.next({ name: 'VisualizerReady', sender: this });
  }

  // TODO: Helps with template type checking. To be removed when 'strict' checks are enabled.
  themeKey(key: string): keyof Theme {
    return key as keyof Theme;
  }

  // TODO: Move switch to a service. Also need to implement rackmount detection since systemprofiler is going away
  createEnclosure(enclosure: EnclosureView = this.selectedEnclosureView): void {
    if (this.currentView === 'details') {
      this.clearDisk();
    }

    switch (enclosure.model) {
      case 'TRUENAS-R10':
      case 'R10':
        this.chassis = new R10();
        break;
      case 'TRUENAS-R20':
      case 'R20':
        this.chassis = new R20(true);
        break;
      case 'TRUENAS-R20A':
      case 'R20A':
        this.chassis = new R20A(true);
        break;
      case 'TRUENAS-R20B':
      case 'R20B':
        this.chassis = new R20B(true);
        break;
      case 'R30':
      case 'TRUENAS-R30':
        this.chassis = new R30();
        break;
      case 'R40':
      case 'TRUENAS-R40':
        this.chassis = new R40();
        break;
      case 'TRUENAS-R50':
      case 'R50':
        this.chassis = new R50(true);
        this.showCaption = false;
        break;
      case 'TRUENAS-R50B':
      case 'R50B':
        this.chassis = new R50B(true);
        this.showCaption = false;
        break;
      case 'TRUENAS-R50BM':
      case 'R50BM':
        this.chassis = new R50Bm(true);
        this.showCaption = false;
        break;
      case 'M Series': {
        // We need to detect rear chassis. Not all M Series will have rear slots
        this.chassis = new M50(enclosure.slots.length > 24);
        break;
      }
      case 'Rear': // Ignore reported rear chassis for M50
        break;
      case 'X Series':
      case 'ES12':
        this.chassis = new Es12();
        break;
      case 'TRUENAS-MINI-R':
        this.chassis = new MINIR();
        break;
      case 'Z Series':
      case 'TRUENAS-Z20-HA-D':
      case 'E16':
        this.chassis = new E16();
        break;
      case 'ES24':
        this.chassis = new Es24();
        break;
      case 'ES24F':
        this.chassis = new Es24F();
        break;
      case 'E24':
        this.chassis = new E24();
        break;
      case 'ES60':
        this.chassis = new Es60();
        break;
      case 'E60':
        this.chassis = new E60();
        break;
      case 'ES102':
        this.chassis = new Es102();
        this.showCaption = false;
        break;
      case 'TRUENAS-F100-HA':
      case 'F100':
      case 'TRUENAS-F130-HA':
      case 'F130':
      case 'TRUENAS-F60-HA':
      case 'F60':
        this.chassis = new F60();
        break;
      default:
        this.controllerEvent$.next({
          name: 'Error',
          data: {
            name: 'Unsupported Hardware',
            message: 'This chassis has an unknown or missing model value. (METHOD: createEnclosure)',
          },
        });
        this.aborted = true;
    }
    if (this.aborted) {
      return;
    }

    this.setupChassisViewEvents();
  }

  // Setup communication with ChassisView
  setupChassisViewEvents(): void {
    this.chassisView.events.pipe(untilDestroyed(this)).subscribe((evt) => {
      switch (evt.name) {
        case 'Ready':
          this.container.addChild(this.chassisView.container);
          this.chassisView.container.name = this.chassisView.model;
          this.chassisView.container.width = this.chassisView.container.width / 2;
          this.chassisView.container.height = this.chassisView.container.height / 2;

          this.chassisView.container.x = this.pixiWidth / 2 - this.chassisView.container.width / 2;
          this.chassisView.container.y = this.pixiHeight / 2 - this.chassisView.container.height / 2;

          this.setDisksEnabledState();
          this.setCurrentView(this.defaultView);

          this.optimizeChassisOpacity();

          break;
        case 'DriveSelected': {
          const slotNumber = parseInt((evt as DriveSelectedEvent).data.id);

          if (this.identifyBtnRef) {
            this.toggleSlotStatus(true);
            this.radiate(true);
          }

          this.selectedSlotNumber = slotNumber;
          const isSlotEmpty = !this.selectedSlot?.disk;

          if (isSlotEmpty) {
            this.setCurrentView(this.emptySlotView);
          } else if ((evt as DriveSelectedEvent).data.enabled) {
            this.setCurrentView('details');
          }
          break;
        }
      }
    });

    if (!this.resources[this.chassisView.model]) {
      this.chassisView.load();
    } else {
      this.onImport();
    }
  }

  // Similar to createEnclosure method. This just provides parent with images for enclosure selector strip
  createExtractedEnclosure(enclosureView: EnclosureView): void {
    const rawEnclosure = this.systemState.enclosures[enclosureView.number];
    let extractedChassis: Chassis;

    switch (rawEnclosure.model) {
      case 'TRUENAS-R10':
      case 'R10':
        extractedChassis = new R10();
        break;
      case 'TRUENAS-R20A':
      case 'R20A':
        extractedChassis = new R20A();
        break;
      case 'TRUENAS-R20':
      case 'R20':
        extractedChassis = new R20();
        break;
      case 'TRUENAS-R20B':
      case 'R20B':
        extractedChassis = new R20B();
        break;
      case 'R30':
      case 'TRUENAS-R30':
        extractedChassis = new R30();
        break;
      case 'TRUENAS-R40':
      case 'R40':
        extractedChassis = new R40();
        break;
      case 'TRUENAS-R50':
      case 'R50':
        extractedChassis = new R50();
        break;
      case 'TRUENAS-R50B':
      case 'R50B':
        extractedChassis = new R50B();
        break;
      case 'TRUENAS-R50BM':
      case 'R50BM':
        extractedChassis = new R50Bm();
        break;
      case 'M Series':
        extractedChassis = new M50();
        break;
      case 'X Series':
      case 'ES12':
        extractedChassis = new Es12();
        break;
      case 'TRUENAS-MINI-R':
        extractedChassis = new MINIR();
        break;
      case 'Z Series':
      case 'TRUENAS-Z20-HA-D':
      case 'E16':
        extractedChassis = new E16();
        break;
      case 'E24':
        extractedChassis = new E24();
        break;
      case 'ES24':
        extractedChassis = new Es24();
        break;
      case 'ES24F':
        extractedChassis = new Es24F();
        break;
      case 'ES60':
        extractedChassis = new Es60();
        break;
      case 'E60':
        extractedChassis = new E60();
        break;
      case 'ES102':
        extractedChassis = new Es102();
        break;
      case 'TRUENAS-F100-HA':
      case 'F100':
      case 'TRUENAS-F130-HA':
      case 'F130':
      case 'TRUENAS-F60-HA':
      case 'F60':
        extractedChassis = new F60();
        break;
      default:
        this.controllerEvent$.next({
          name: 'Error',
          data: {
            name: 'Unsupported Hardware',
            message: 'This extractedChassis has an unknown or missing model value. (METHOD: createExtractedEnclosure)',
          },
        });
        this.aborted = true;
    }

    if (this.aborted) {
      return;
    }

    const chassisView: ChassisView = extractedChassis.front;

    chassisView.events
      .pipe(filter((event) => event.name === 'Ready'), untilDestroyed(this))
      .subscribe(() => {
        this.container.addChild(chassisView.container);
        chassisView.container.name = chassisView.model + '_for_extraction';
        chassisView.container.width = chassisView.container.width / 2;
        chassisView.container.height = chassisView.container.height / 2;

        chassisView.container.x = this.pixiWidth / 2 - chassisView.container.width / 2;
        chassisView.container.y = this.pixiHeight / 2 - chassisView.container.height / 2;

        this.optimizeChassisOpacity(chassisView);

        enclosureView.slots.forEach((enclosureSlot: EnclosureSlot) => {
          this.setDiskHealthState(enclosureSlot, chassisView);
        });
        this.extractEnclosure(chassisView, enclosureView);
      });

    chassisView.load();
  }

  // Helper for createExtractedEnclosure
  extractEnclosure(enclosure: ChassisView, enclosureView: EnclosureView): void {
    const canvas = (this.app.renderer.plugins as { [name: string]: CanvasExtract }).extract.canvas(enclosure.container);
    this.controllerEvent$.next({ name: 'EnclosureCanvas', data: { canvas, enclosureView }, sender: this });
    this.container.removeChild(enclosure.container);
  }

  // Cleanup objects in PIXI/ChassisView
  destroyEnclosure(): void {
    if (!this.chassisView) { return; }
    this.container.removeChild(this.chassisView.container);
    this.chassisView.destroy();
  }

  // PIXI/ChassisView cleanup with cache clearing
  destroyAllEnclosures(): void {
    if (this.chassisView) {
      // Clear out assets
      this.chassisView.destroy();
    }
    this.container.destroy(true);
    PIXI.loader.resources = {};
  }

  // PIXI Asset import callback
  onImport(): void {
    const sprite = PIXI.Sprite.from(this.chassisView.loader.resources.m50.texture.baseTexture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.name = this.chassisView.model + '_sprite';
    sprite.alpha = 0.1;
    this.container.addChild(sprite);

    const dt = this.chassisView.makeDriveTray();
    this.container.addChild(dt.container);
    this.setCurrentView(this.defaultView);
  }

  // Sets view to Pool vs Status vs Expanders vs Disk Details
  setCurrentView(viewName: string): void {
    if (this.currentView) { this.exitingView = this.currentView; }
    // pools || status || expanders || details

    if (this.labels) {
      // Start exit animation
      this.labels.exit();
    }

    if (this.exitingView && this.exitingView === 'details' && this.identifyBtnRef) {
      this.toggleSlotStatus(true);
      this.radiate(true);
    }

    switch (viewName) {
      case 'pools':
        this.container.alpha = 1;
        this.setDisksPoolState();
        break;
      case 'status':
        this.container.alpha = 1;
        this.setDisksDisabled();
        this.setDisksHealthState();
        break;
      case 'expanders':
        this.container.alpha = 0;
        break;
      case 'details': {
        this.container.alpha = 1;
        this.setDisksDisabled();

        this.setDisksPoolState();

        const selectedSlot = !this.selectedSlot ? this.selectedEnclosureView.slots[0] : this.selectedSlot;
        this.labels = new VDevLabelsSvg(this.chassisView, this.app, selectedSlot.disk, this.theme);

        const evtData: unknown = {
          name: 'LabelDrives',
          data: {
            selected: this.selectedSlot,
            vdevSlots: this.selectedVdevSlots,
          },
          sender: this,
        };
        this.labels.events$.next(evtData as LabelDrivesEvent);
        break;
      }
    }

    this.currentView = viewName;
    this.resizeView();
  }

  // Updates HTML layers in tandem with Canvas
  updateHtml(className: string): void { // stage-left or stage-right or expanders
    const sideStage: HTMLElement = this.overview.nativeElement
      .querySelector('.' + this.currentView + '.' + className);
    const html: HTMLElement = this.overview.nativeElement
      .querySelector('.' + this.currentView + '.' + className + ' .content');
    const el = popmotion.styler(html, {});

    const x = (sideStage.offsetWidth * 0.5) - (el.get('width') * 0.5);
    const y = sideStage.offsetTop + (sideStage.offsetHeight * 0.5) - (el.get('height') * 0.5);
    html.style.left = x.toString() + 'px';
    html.style.top = y.toString() + 'px';
  }

  // More DOM animations
  enter(className: string): void { // stage-left or stage-right or expanders
    if (this.exitingView) {
      if (className === 'full-stage') {
        this.exit('stage-left');
        this.exit('stage-right');
      } else if (this.exitingView === 'expanders') {
        this.exit('full-stage');
      } else {
        this.exit(className);
      }
    }

    this.updateHtml(className);

    const html: HTMLElement = this.overview.nativeElement
      .querySelector('.' + this.currentView + '.' + className + ' .content');
    const el = popmotion.styler(html, {});
    popmotion.tween({
      from: { scale: 0, opacity: 0 },
      to: { scale: 1, opacity: 1 },
      duration: 360,
    }).start({
      update: (valuesUpdate: { scale: number; opacity: number }) => { el.set(valuesUpdate); },
    });
  }

  // More DOM animations
  exit(className: string): void { // stage-left or stage-right or full-stage
    const html = this.overview.nativeElement.querySelector('.' + className + '.' + this.exitingView);
    const el = popmotion.styler(html, {});
    let duration = 360;

    // x is the position relative to it's starting point.
    const width = el.get('width') as number;
    const startX = 0;
    let endX = className === 'stage-left' ? width * -1 : width;
    if (className === 'full-stage') {
      endX = startX;
      duration = 10;
    }

    // Move stage left
    popmotion.tween({
      from: { opacity: 1, x: 0 },
      to: {
        opacity: 0,
        x: endX,
      },
      duration,
    }).start({
      update: (valuesUpdate: { opacity: number; x: number }) => { el.set(valuesUpdate); },
      complete: () => {
        this.exitingView = null;
        el.set({ x: 0 });
      },
    });
  }

  // Fine tuning visualizations.
  optimizeChassisOpacity(extractedEnclosure?: ChassisView): void {
    const css = document.documentElement.style.getPropertyValue('--contrast-darkest');
    const hsl = this.themeUtils.hslToArray(css);

    let opacity;
    if (extractedEnclosure) {
      opacity = hsl[2] < 60 ? 0.35 : 0.75;
      extractedEnclosure.chassis.alpha = opacity;
    } else {
      opacity = hsl[2] < 60 ? 0.25 : 0.75;
      if (this.chassis?.front) {
        this.chassis?.front.setChassisOpacity(opacity);
      }

      if (this.chassis?.rear) {
        this.chassis.rear.setChassisOpacity(opacity);
      }
    }
  }

  // Visualization Colors
  setDisksEnabledState(chassisView: ChassisView = this.chassisView): void {
    chassisView.driveTrayObjects.forEach((dt) => {
      const disk = this.selectedEnclosureView.slots.filter((enclosureSlot: EnclosureSlot) => {
        return enclosureSlot.slot === Number(dt.id);
      });

      dt.enabled = !!disk;
    });
  }

  // Visualization Colors
  setDisksDisabled(): void {
    this.chassisView.driveTrayObjects.forEach((dt) => {
      this.chassisView.events.next({ name: 'ChangeDriveTrayColor', data: { id: dt.id, color: 'none' } });
    });
  }

  // Visualization Colors
  setDisksHealthState(): void {
    const selectedEnclosure = this.selectedEnclosureView;
    selectedEnclosure.slots.forEach((enclosureSlot: EnclosureSlot) => {
      this.setDiskHealthState(enclosureSlot);
    });
  }

  // Visualization Colors
  // Some data fetching of failed disk status strings
  setDiskHealthState(enclosureSlot: EnclosureSlot, enclosure: ChassisView = this.chassisView): void {
    let index = -1;

    enclosure.driveTrayObjects.forEach((dto: DriveTray, i: number) => {
      const result = (dto.id === enclosureSlot.slot.toString());
      if (result) {
        index = i;
      }
    });

    if (index === -1) {
      return;
    }

    enclosure.driveTrayObjects[index].enabled = true; //! !disk.enclosure.slot;

    let failed = false;

    // Health based on disk.status
    if (enclosureSlot.disk && enclosureSlot.topologyStatus) {
      switch (enclosureSlot.topologyStatus) {
        case 'ONLINE':
          enclosure.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: enclosureSlot.slot,
              color: this.theme.green,
              enclosure: enclosureSlot.disk.enclosure.number,
              slot: enclosureSlot.slot,
            },
          });
          break;
        case 'FAULT':
          failed = true;
          break;
        case 'AVAILABLE':
          enclosure.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: enclosureSlot.slot,
              color: '#999999',
              enclosure: enclosureSlot.disk.enclosure.number,
              slot: enclosureSlot.slot,
            },
          });
          break;
        default:
          enclosure.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: enclosureSlot.slot,
              color: this.theme.yellow,
              enclosure: enclosureSlot.disk.enclosure.number,
              slot: enclosureSlot.slot,
            },
          });
          break;
      }
    }

    if (!failed && enclosureSlot.fault) {
      failed = true;
    }

    if (failed) {
      enclosure.events.next({
        name: 'ChangeDriveTrayColor',
        data: {
          id: enclosureSlot.slot,
          color: this.theme.red,
          enclosure: enclosureSlot.disk.enclosure.number,
          slot: enclosureSlot.slot,
        },
      });
    }
  }

  // Sets visualization colors
  setDisksPoolState(): void {
    const selectedEnclosure: EnclosureView = this.selectedEnclosureView;
    this.setDisksDisabled();

    const paintSlots = (targetEnclosure: EnclosureView): void => {
      targetEnclosure.slots.forEach((enclosureSlot: EnclosureSlot): void => {
        if (
          enclosureSlot.slot < this.chassisView.slotRange.start
          || enclosureSlot.slot > this.chassisView.slotRange.end
          || !enclosureSlot.disk
        ) {
          return;
        }

        const poolIndex = this.selectedEnclosurePools.indexOf(enclosureSlot.pool);
        const driveColor = enclosureSlot.vdev
          ? this.theme[this.theme.accentColors[poolIndex] as keyof Theme]
          : '#999999';

        this.chassisView.events.next({
          name: 'ChangeDriveTrayColor',
          data: {
            id: enclosureSlot.slot,
            color: driveColor,
            enclosure: enclosureSlot.enclosure,
            slot: enclosureSlot.slot,
          },
        });
      });
    };

    paintSlots(selectedEnclosure);
  }

  findDiskBySlotNumber(slot: number): Disk {
    return this.selectedEnclosureView.slots
      .find((enclosureSlot: EnclosureSlot) => enclosureSlot.slot === slot)?.disk;
  }

  findPoolByName(name: string): Pool {
    return this.systemState.pools.find((pool: Pool) => pool.name === name);
  }

  // PIXI/Chassis trigger
  toggleHighlightMode(mode: string): void {
    const enclosureView = this.selectedEnclosureView;
    const selectedSlot = enclosureView.slots[this.selectedSlotNumber];
    if (selectedSlot.topologyStatus === 'AVAILABLE') { return; }

    this.labels.events$.next({
      name: mode === 'on' ? 'EnableHighlightMode' : 'DisableHighlightMode',
      sender: this,
    });
  }

  // Used on stage right disk name hover
  highlightPath(devname: string): void {
    // show the svg path
    this.labels.events$.next({
      name: 'HighlightDisk',
      data: { devname, overlay: this.domLabels },
      sender: this,
    });
  }

  // Used on stage right disk name hover
  unhighlightPath(devname: string): void {
    // show the svg path
    this.labels.events$.next({
      name: 'UnhighlightDisk',
      data: { devname, overlay: this.domLabels },
      sender: this,
    });
  }

  // Trigger to flash the lights
  toggleSlotStatus(kill?: boolean): void {
    const selectedEnclosure = this.selectedEnclosure;
    const enclosureId = this.systemState.enclosures[selectedEnclosure.number].id;
    const slot = this.selectedSlotNumber;
    const status = !this.identifyBtnRef && !kill ? EnclosureSlotStatus.Identify : EnclosureSlotStatus.Clear;

    this.ws.call('enclosure.set_slot_status', [enclosureId, slot, status])
      .pipe(untilDestroyed(this))
      .subscribe(() => {});

    this.radiate();
  }

  // Animate when slot status button is triggered
  radiate(kill?: boolean): void {
    // Animation
    if (this.identifyBtnRef) {
      // kill the animation
      this.identifyBtnRef.animation.seek(0);
      (this.identifyBtnRef.animation.stop as (styler: ValueReaction) => void)(this.identifyBtnRef.styler);
      this.identifyBtnRef = null;
    } else if (!this.identifyBtnRef && !kill) {
      const btn = popmotion.styler(this.details.nativeElement.querySelector('#identify-btn'), {});
      const startShadow = btn.get('box-shadow') as string;

      const elementBorder = popmotion.value(
        { borderColor: '', borderWidth: 0 },
        ({ borderColor, borderWidth }: { borderColor: string; borderWidth: number }) => btn.set({
          boxShadow: `0 0 0 ${borderWidth}px ${borderColor}`,
        }),
      );

      // Convert color to rgb value
      const cc = this.hexToRgb(this.theme.cyan);
      const animation = popmotion.keyframes({
        values: [
          { borderWidth: 0, borderColor: `rgb(${cc.rgb[0]}, ${cc.rgb[1]}, ${cc.rgb[2]})` },
          { borderWidth: 30, borderColor: `rgb(${cc.rgb[0]}, ${cc.rgb[1]}, ${cc.rgb[2]}, 0)` },
        ],
        duration: 1000,
        loop: Infinity,
      }).start(elementBorder);

      this.identifyBtnRef = { animation, originalState: startShadow, styler: elementBorder };
    }
  }

  // I believe this already exists in themeUtils
  hexToRgb(str: string): { hex: string; rgb: number[] } {
    return this.themeUtils.hexToRgb(str);
  }

  // Media Query stuff
  onResize(): void {
    this.resizeView();
  }

  // Media Query stuff
  resizeView(): void {
    // Layout helper code goes in here...
    if (this.overview?.nativeElement) {
      const visualizer = this.overview?.nativeElement.querySelector('#visualizer');
      visualizer?.classList.add('resized');
    }
  }

  // Changes front/rear/internal
  enclosureOverride(view: string): void {
    if (view !== this.view) {
      this.clearDisk();
      this.loadEnclosure(this.selectedEnclosureView, view, true);
    }
  }

  // Change enclosure name
  labelForm(): void {
    const enclosure = this.selectedEnclosure; // this.system.enclosures[this.selectedEnclosure.enclosureKey];
    const currentLabel = enclosure.label !== enclosure.name ? enclosure.label : enclosure.model;

    this.matDialog.open(SetEnclosureLabelDialogComponent, {
      data: {
        currentLabel,
        defaultLabel: enclosure.name,
        enclosureId: enclosure.id,
      } as SetEnclosureLabelDialogData,
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((newLabel: string) => {
        if (!newLabel) {
          return;
        }

        this.enclosureStore.updateLabel(enclosure.id, newLabel);
      });
  }
}
