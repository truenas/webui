import {
  AfterContentInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { TinyColor } from '@ctrl/tinycolor';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Application, Container } from 'pixi.js';
import * as popmotion from 'popmotion';
import { KeyframesProps } from 'popmotion';
import { ValueReaction } from 'popmotion/lib/reactions/value';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { EnclosureModel } from 'app/enums/enclosure-model.enum';
import { EnclosureDiskStatus, EnclosureSlotStatus } from 'app/enums/enclosure-slot-status.enum';
import { Role } from 'app/enums/role.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { DashboardEnclosureSlot, EnclosureElement } from 'app/interfaces/enclosure.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChassisView } from 'app/pages/system/old-view-enclosure/classes/chassis-view';
import { DriveTray } from 'app/pages/system/old-view-enclosure/classes/drivetray';
import { Chassis } from 'app/pages/system/old-view-enclosure/classes/hardware/chassis';
import { Es102 } from 'app/pages/system/old-view-enclosure/classes/hardware/es102';
import { Es102G2 } from 'app/pages/system/old-view-enclosure/classes/hardware/es102g2';
import { Es12 } from 'app/pages/system/old-view-enclosure/classes/hardware/es12';
import { Es24 } from 'app/pages/system/old-view-enclosure/classes/hardware/es24';
import { Es24F } from 'app/pages/system/old-view-enclosure/classes/hardware/es24f';
import { Es60 } from 'app/pages/system/old-view-enclosure/classes/hardware/es60';
import { Es60G2 } from 'app/pages/system/old-view-enclosure/classes/hardware/es60g2';
import { F60 } from 'app/pages/system/old-view-enclosure/classes/hardware/f60';
import { H10 } from 'app/pages/system/old-view-enclosure/classes/hardware/h10';
import { M50 } from 'app/pages/system/old-view-enclosure/classes/hardware/m50';
import { MINIR } from 'app/pages/system/old-view-enclosure/classes/hardware/mini-r';
import { R10 } from 'app/pages/system/old-view-enclosure/classes/hardware/r10';
import { R20 } from 'app/pages/system/old-view-enclosure/classes/hardware/r20';
import { R20A } from 'app/pages/system/old-view-enclosure/classes/hardware/r20a';
import { R20B } from 'app/pages/system/old-view-enclosure/classes/hardware/r20b';
import { R30 } from 'app/pages/system/old-view-enclosure/classes/hardware/r30';
import { R40 } from 'app/pages/system/old-view-enclosure/classes/hardware/r40';
import { R50 } from 'app/pages/system/old-view-enclosure/classes/hardware/r50';
import { R50B } from 'app/pages/system/old-view-enclosure/classes/hardware/r50b';
import { R50Bm } from 'app/pages/system/old-view-enclosure/classes/hardware/r50bm';
import { VDevLabelsSvg } from 'app/pages/system/old-view-enclosure/classes/v-dev-labels-svg';
import {
  SetEnclosureLabelDialogComponent,
  SetEnclosureLabelDialogData,
} from 'app/pages/system/old-view-enclosure/components/set-enclosure-label-dialog/set-enclosure-label-dialog.component';
import { SystemProfile } from 'app/pages/system/old-view-enclosure/components/view-enclosure/view-enclosure.component';
import {
  ChangeDriveTrayOptions,
  EnclosureEvent,
  LabelDrivesEvent,
} from 'app/pages/system/old-view-enclosure/interfaces/enclosure-events.interface';
import { OldEnclosure } from 'app/pages/system/old-view-enclosure/interfaces/old-enclosure.interface';
import { ViewConfig } from 'app/pages/system/old-view-enclosure/interfaces/view.config';
import { EnclosureState, EnclosureStore } from 'app/pages/system/old-view-enclosure/stores/enclosure-store.service';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EnclosureDisksComponent implements AfterContentInit, OnDestroy {
  @ViewChild('visualizer', { static: true }) visualizer: ElementRef<HTMLElement>;
  @ViewChild('disksoverview', { static: true }) overview: ElementRef<HTMLElement>;
  @ViewChild('diskdetails', { static: false }) details: ElementRef<HTMLElement>;
  @ViewChild('domLabels', { static: false }) domLabels: ElementRef<HTMLElement>;

  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('current-tab') currentTab: ViewConfig;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('controller-events') controllerEvent$: Subject<EnclosureEvent>;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('profile') systemProfile: SystemProfile;

  protected readonly requiredRoles = [Role.FullAdmin];
  showCaption = true;
  protected aborted = false;
  enclosureViews: OldEnclosure[] = [];
  systemState: EnclosureState;
  selectedDisk: DashboardEnclosureSlot;

  // TODO: Implement Expanders
  get expanders(): EnclosureElement[] {
    const keyValueArray = this.asArray(
      this.selectedEnclosure?.elements['SAS Expander'],
    ) as [string, EnclosureElement][];
    return keyValueArray.map((keyValue: [string, EnclosureElement]) => keyValue[1]);
  }
  // Tracked by parent component
  get selectedEnclosureNumber(): number {
    return this.systemState.enclosures.indexOf(this.selectedEnclosure);
  }

  enclosureNumberFromId(id: string): number {
    return this.systemState.enclosures
      .filter((enclosure) => enclosure.id === id)
      .map((filtered) => filtered.number)[0];
  }

  // Tracked by this component
  selectedSlotNumber: number | null = null;

  get selectedEnclosure(): OldEnclosure {
    return this.systemState?.enclosures?.filter((enclosure) => {
      return enclosure.id === this.systemState.selectedEnclosure;
    })[0];
  }

  get selectedEnclosurePools(): string[] {
    return this.enclosureStore.getPools(this.selectedEnclosure);
  }

  get selectedSlot(): DashboardEnclosureSlot | null {
    if (this.selectedEnclosure) {
      const selected = this.selectedEnclosure.elements['Array Device Slot'][this.selectedSlotNumber];
      return selected || null;
    }
    return null;
  }

  asArray(src: object): [string, unknown][] {
    return src ? Object.entries(src) : [];
  }

  // Data fetching. TODO: Move to service or store
  get unhealthyPools(): Pool[] {
    return [];
    /* return this.systemState.pools.filter((pool: Pool) => {
      return !pool.healthy && this.selectedEnclosurePools.includes(pool.name);
    }); */
  }

  // Find bad status strings in both disk.status and slot.status.
  get failedDisks(): DiskFailure[] {
    return [];
    if (!this.selectedEnclosure) return [];

    const slots: [string, DashboardEnclosureSlot][] = Object.entries(
      this.selectedEnclosure.elements['Array Device Slot'],
    ).filter((keyValue: [string, DashboardEnclosureSlot]) => {
      const enclosureSlot = keyValue[1];
      const triggers: string[] = [
        TopologyItemStatus.Unavail,
        TopologyItemStatus.Faulted,
      ];
      return triggers.includes(enclosureSlot.status);
    });

    const failedDisks: DiskFailure[] = slots.map((numberAndInfo: [string, DashboardEnclosureSlot]) => {
      const slotNumber = Number(numberAndInfo[0]);
      const slotInfo = numberAndInfo[1];
      const failure: DiskFailure = {
        disk: slotInfo.dev,
        enclosure: this.selectedEnclosureNumber,
        slot: slotNumber,
        location: this.view,
        reasons: [slotInfo.status],
      };
      return failure;
    });

    return failedDisks;
  }

  get isTopologyDisk(): boolean {
    return true;
    // return this.selectedSlot?.vdev?.type === TopologyItemType.Disk;
  }
  // END DATA PROPERTIES

  temperatures: Temperature;
  // TODO: Do we still need subenclosure now that rear bays are always merged?
  subenclosure: { poolKeys: Record<string, number> }; // Declare rear and internal enclosure visualizations here

  // PIXI and View related...
  app: Application;
  private resources = PIXI.loader.resources;
  container: Container;
  chassis: Chassis;
  view = EnclosureLocation.Front;
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

  theme: Theme;
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
    // this.diskTemperatureService.listenForTemperatureUpdates();

    // this.diskTemperatureService.temperature$.pipe(untilDestroyed(this)).subscribe((data) => {
    //   const chassisView: ChassisView = this.chassisView && this.view === EnclosureLocation.Rear
    //     ? this.chassis?.rear
    //     : this.chassis?.front;
    //   if (!this.chassis || !chassisView?.driveTrayObjects) { return; }

    //   const clone: Temperature = { ...data };
    //   clone.values = {};
    //   clone.keys = [];

    //   if (chassisView?.driveTrayObjects) {
    //     const enclosureView = this.selectedEnclosure;
    //     chassisView.driveTrayObjects.forEach((dt: DriveTray) => {
    //       const enclosureSlot = enclosureView.elements['Array Device Slot'][parseInt(dt.id)];
    //       if (enclosureSlot.dev) {
    //         clone.keys.push(enclosureSlot.dev);
    //         clone.values[enclosureSlot.dev] = data.values[enclosureSlot.dev];
    //       }
    //     });
    //   } else {
    //     console.warn({
    //       message: 'No Chassis View Available',
    //       chassisView,
    //       thisChassisView: this.chassisView,
    //     });
    //   }

    //   this.temperatures = clone;
    //   this.cdr.markForCheck();
    // });
    // this.diskTemperatureService.diskTemperaturesSubscribe();

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
        if (data.enclosures.length) {
          this.systemState = data;

          if (!this.app) {
            this.appSetup();
          }
        }
      });
  }

  // PIXI Visualization Setup
  appSetup(): void {
    this.controllerEvent$.pipe(untilDestroyed(this)).subscribe((evt: EnclosureEvent) => {
      switch (evt.name) {
        case 'CanvasExtract':
          this.createExtractedEnclosure((evt).data);
          break;
        case 'PoolsChanged':
          this.setDisksEnabledState();
          this.setCurrentView(this.defaultView);
          break;
        case 'EnclosureSelected':
          // Enabled subenclosure functionality
          this.loadEnclosure(
            this.selectedEnclosure,
            EnclosureLocation.Front,
            (this.chassisView !== null), // TODO: Make sure this doesn't break on enclosure selection
          );
          break;
      }
    });

    this.pixiInit();
    this.cdr.markForCheck();

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
      this.cdr.markForCheck();
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
    // this.diskTemperatureService.diskTemperaturesUnsubscribe();
    this.destroyAllEnclosures();
    if (this.app) {
      this.app.stage.destroy(true);
      this.app.destroy(true);
    }
  }

  // Recreates enclosure when switching between enclosures or front/rear/internal visualizations
  loadEnclosure(enclosureView: OldEnclosure, view?: EnclosureLocation, update?: boolean): void {
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

  // TODO: Move switch to a service. Also need to implement rackmount detection since systemprofiler is going away
  createEnclosure(enclosure /* EnclosureView */ = this.selectedEnclosure): void {
    if (this.currentView === 'details') {
      this.clearDisk();
    }

    switch (enclosure?.model) {
      case EnclosureModel.R10:
        this.chassis = new R10();
        break;
      case EnclosureModel.R20:
        this.chassis = new R20(true);
        break;
      case EnclosureModel.R20A:
        this.chassis = new R20A(true);
        break;
      case EnclosureModel.R20B:
        this.chassis = new R20B(true);
        break;
      case EnclosureModel.R30:
        this.chassis = new R30();
        break;
      case EnclosureModel.R40:
        this.chassis = new R40();
        break;
      case EnclosureModel.R50:
        this.chassis = new R50(true);
        this.showCaption = false;
        break;
      case EnclosureModel.R50B:
        this.chassis = new R50B(true);
        this.showCaption = false;
        break;
      case EnclosureModel.R50BM:
        this.chassis = new R50Bm(true);
        this.showCaption = false;
        break;
      case EnclosureModel.M40:
      case EnclosureModel.M50:
      case EnclosureModel.M60: {
        // We need to detect rear chassis. Not all M Series will have rear slots
        this.chassis = new M50(Object.entries(enclosure.elements['Array Device Slot']).length > 24);
        break;
      }
      case EnclosureModel.Es12:
        this.chassis = new Es12();
        break;
      case EnclosureModel.MiniR:
        this.chassis = new MINIR();
        break;
      case EnclosureModel.Es24:
        this.chassis = new Es24();
        break;
      case EnclosureModel.Es24F:
        this.chassis = new Es24F();
        break;
      case EnclosureModel.Es60:
        this.chassis = new Es60();
        break;
      case EnclosureModel.Es60G2:
        this.chassis = new Es60G2();
        break;
      case EnclosureModel.Es102:
        this.chassis = new Es102();
        this.showCaption = false;
        break;
      case EnclosureModel.Es102G2:
        this.chassis = new Es102G2();
        this.showCaption = false;
        break;
      case EnclosureModel.Es24N:
      case EnclosureModel.F100:
      case EnclosureModel.F130:
      case EnclosureModel.F60:
        this.chassis = new F60();
        break;
      case EnclosureModel.H10:
        this.chassis = new H10();
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
          const slotNumber = parseInt(evt.data.id);

          if (this.identifyBtnRef) {
            this.toggleSlotStatus(true);
            this.radiate(true);
          }
          this.selectedSlotNumber = slotNumber;
          const isSlotEmpty = !this.selectedSlot.dev;

          if (isSlotEmpty) {
            this.setCurrentView(this.emptySlotView);
          } else if ((evt).data.enabled) {
            this.selectedDisk = this.systemState?.selectedEnclosureDisks?.find((disk) => {
              return disk.dev === this.selectedSlot.dev;
            });
            this.setCurrentView('details');
          }
          break;
        }
      }
      this.cdr.markForCheck();
    });

    if (!this.resources[this.chassisView.model]) {
      this.chassisView.load();
    } else {
      this.onImport();
    }
  }

  // Similar to createEnclosure method. This just provides parent with images for enclosure selector strip
  createExtractedEnclosure(enclosureView: OldEnclosure): void {
    const rawEnclosure = this.systemState.enclosures.find((enclosure) => enclosure.id === enclosureView.id);
    let extractedChassis: Chassis;

    switch (rawEnclosure.model) {
      case EnclosureModel.R10:
        extractedChassis = new R10();
        break;
      case EnclosureModel.R20A:
        extractedChassis = new R20A();
        break;
      case EnclosureModel.R20:
        extractedChassis = new R20();
        break;
      case EnclosureModel.R20B:
        extractedChassis = new R20B();
        break;
      case EnclosureModel.R30:
        extractedChassis = new R30();
        break;
      case EnclosureModel.R40:
        extractedChassis = new R40();
        break;
      case EnclosureModel.R50:
        extractedChassis = new R50();
        break;
      case EnclosureModel.R50B:
        extractedChassis = new R50B();
        break;
      case EnclosureModel.R50BM:
        extractedChassis = new R50Bm();
        break;
      case EnclosureModel.M40:
      case EnclosureModel.M50:
      case EnclosureModel.M60:
        extractedChassis = new M50();
        break;
      case EnclosureModel.Es12:
        extractedChassis = new Es12();
        break;
      case EnclosureModel.MiniR:
        extractedChassis = new MINIR();
        break;
      case EnclosureModel.Es24:
        extractedChassis = new Es24();
        break;
      case EnclosureModel.Es24F:
        extractedChassis = new Es24F();
        break;
      case EnclosureModel.Es60:
        extractedChassis = new Es60();
        break;
      case EnclosureModel.Es60G2:
        extractedChassis = new Es60G2();
        break;
      case EnclosureModel.Es102:
        extractedChassis = new Es102();
        break;
      case EnclosureModel.Es102G2:
        extractedChassis = new Es102G2();
        break;
      case EnclosureModel.Es24N:
      case EnclosureModel.F100:
      case EnclosureModel.F130:
      case EnclosureModel.F60:
        extractedChassis = new F60();
        break;
      case EnclosureModel.H10:
        extractedChassis = new H10();
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

        const slots = this.asArray(
          enclosureView.elements['Array Device Slot'],
        ) as [string, DashboardEnclosureSlot][];

        (slots).forEach((keyValue) => {
          const slotNumber = keyValue[0];
          const slotDetails = keyValue[1];
          this.setDiskHealthState(enclosureView.id, slotNumber, slotDetails, chassisView);
        });
        this.extractEnclosure(chassisView, enclosureView);
      });

    chassisView.load();
  }

  // Helper for createExtractedEnclosure
  extractEnclosure(enclosure: ChassisView, enclosureView: OldEnclosure): void {
    const canvas = (this.app.renderer.plugins as Record<string, CanvasExtract>).extract.canvas(enclosure.container);
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
    this.container?.destroy(true);
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

        const selectedSlot = !this.selectedSlot ? this.selectedEnclosure.elements['Array Device Slot']['1']
          : this.selectedSlot;
        this.labels = new VDevLabelsSvg(this.chassisView, this.app, this.selectedSlot.dev, this.theme);

        const evtData: unknown = {
          name: 'LabelDrives',
          data: {
            slotNumber: this.selectedSlotNumber,
            slotDetails: selectedSlot,
            enclosureId: this.selectedEnclosure.id,
          },
          sender: this,
        };

        this.labels.events$.next(evtData as LabelDrivesEvent);
        break;
      }
    }

    this.currentView = viewName;
    this.resizeView();
    this.cdr.markForCheck();
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
    const hsl = new TinyColor(css).toHsl();

    let opacity;
    if (extractedEnclosure) {
      opacity = hsl.l < 60 ? 0.35 : 0.75;
      extractedEnclosure.chassis.alpha = opacity;
    } else {
      opacity = hsl.l < 60 ? 0.25 : 0.75;
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
      const isEnabled: boolean = (
        typeof this.selectedEnclosure.elements['Array Device Slot'][parseInt(dt.id)].dev !== undefined
      );
      dt.enabled = !!isEnabled;
    });
  }

  // Visualization Colors
  setDisksDisabled(): void {
    this.chassisView.driveTrayObjects.forEach((dt) => {
      this.chassisView.events.next({
        name: 'ChangeDriveTrayColor',
        data: { id: dt.id, color: 'none' } as ChangeDriveTrayOptions,
      });
    });
  }

  // Visualization Colors
  setDisksHealthState(): void {
    const selectedEnclosure = this.selectedEnclosure;
    const slots: [string, DashboardEnclosureSlot][] = this.asArray(
      selectedEnclosure.elements['Array Device Slot'],
    ) as [string, DashboardEnclosureSlot][];

    (slots).forEach((keyValue) => {
      const slotNumber = keyValue[0];
      const slotDetails = keyValue[1];
      this.setDiskHealthState(selectedEnclosure.id, slotNumber, slotDetails);
    });
  }

  // Visualization Colors
  // Some data fetching of failed disk status strings
  setDiskHealthState(
    enclosureId: string,
    slotNumber: string,
    enclosureSlot: DashboardEnclosureSlot,
    chassisView: ChassisView = this.chassisView,
  ): void {
    let index = -1;

    chassisView.driveTrayObjects.forEach((dto: DriveTray, i: number) => {
      const result = (dto.id === slotNumber);
      if (result) {
        index = i;
      }
    });

    if (index === -1) {
      return;
    }

    chassisView.driveTrayObjects[index].enabled = true; //! !disk.enclosure.slot;

    // Health based on disk.status
    if (enclosureSlot.dev && enclosureSlot.pool_info?.disk_status) {
      switch (enclosureSlot.pool_info?.disk_status) {
        case EnclosureDiskStatus.Online:
          chassisView.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: slotNumber,
              color: this.theme.green,
              enclosure: enclosureId,
              slot: parseInt(slotNumber),
            },
          });
          break;
        case EnclosureDiskStatus.Faulted:
          chassisView.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: slotNumber,
              color: this.theme.red,
              enclosure: enclosureId,
              slot: parseInt(slotNumber),
            },
          });
          break;
        case EnclosureDiskStatus.Unavail:
          chassisView.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: slotNumber,
              color: '#999999',
              enclosure: enclosureId,
              slot: parseInt(slotNumber),
            },
          });
          break;
        default:
          chassisView.events.next({
            name: 'ChangeDriveTrayColor',
            data: {
              id: slotNumber,
              color: this.theme.yellow,
              enclosure: enclosureId,
              slot: parseInt(slotNumber),
            },
          });
          break;
      }
    }
  }

  // Sets visualization colors
  setDisksPoolState(): void {
    const selectedEnclosure = this.selectedEnclosure;
    this.setDisksDisabled();

    const paintSlots = (targetEnclosure: OldEnclosure): void => {
      const slots: [string, DashboardEnclosureSlot][] = this.asArray(
        targetEnclosure.elements['Array Device Slot'],
      ) as [string, DashboardEnclosureSlot][];

      (slots).forEach((keyValue) => {
        const slotNumber = parseInt(keyValue[0]);
        const slotDetails = keyValue[1];

        // Empty slot check
        if (
          slotNumber < this.chassisView.slotRange?.start
          || slotNumber > this.chassisView.slotRange?.end
          || !slotDetails.dev
        ) {
          return;
        }

        const poolIndex = this.selectedEnclosurePools.indexOf(slotDetails.pool_info?.pool_name);
        const driveColor = slotDetails.pool_info?.vdev_name
          ? this.theme[this.theme.accentColors[poolIndex] as keyof Theme]
          : '#999999';

        this.chassisView.events.next({
          name: 'ChangeDriveTrayColor',
          data: {
            id: slotNumber,
            color: driveColor,
            enclosure: targetEnclosure.id,
            slot: slotNumber,
          } as ChangeDriveTrayOptions,
        });
      });
    };

    paintSlots(selectedEnclosure);
  }

  // PIXI/Chassis trigger
  toggleHighlightMode(mode: string): void {
    const selectedSlot = this.selectedEnclosure.elements['Array Device Slot'][this.selectedSlotNumber];
    if (selectedSlot.pool_info?.disk_status === EnclosureDiskStatus.Unavail) { return; }

    this.labels.events$.next({
      name: mode === 'on' ? 'EnableHighlightMode' : 'DisableHighlightMode',
      sender: this,
    } as EnclosureEvent);
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
      const cyan = new TinyColor(this.theme.cyan);
      const animation = popmotion.keyframes({
        values: [
          { borderWidth: 0, borderColor: cyan.toRgbString() },
          { borderWidth: 30, borderColor: cyan.setAlpha(0).toRgbString() },
        ],
        duration: 1000,
        loop: Infinity,
      } as KeyframesProps).start(elementBorder);

      this.identifyBtnRef = { animation, originalState: startShadow, styler: elementBorder };
    }
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
  enclosureOverride(view: EnclosureLocation): void {
    if (view !== this.view) {
      this.clearDisk();
      this.loadEnclosure(this.selectedEnclosure, view, true);
    }
  }

  // Change enclosure name
  labelForm(): void {
    const enclosure = this.selectedEnclosure;
    const dialogConfig: SetEnclosureLabelDialogData = {
      currentLabel: enclosure.label || enclosure.name,
      defaultLabel: enclosure.name,
      enclosureId: enclosure.id,
    };

    this.matDialog.open(SetEnclosureLabelDialogComponent, { data: dialogConfig })
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
