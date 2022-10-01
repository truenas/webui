import {
  Component, Input, AfterContentInit, OnChanges, SimpleChanges, ViewChild, ElementRef, OnDestroy, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  Application, Container,
} from 'pixi.js';
import {
  tween, styler, value, keyframes, ColdSubscription,
} from 'popmotion';
import { ValueReaction } from 'popmotion/lib/reactions/value';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { ThemeUtils } from 'app/core/classes/theme-utils/theme-utils';
import { EnclosureSlotStatus } from 'app/enums/enclosure-slot-status.enum';
import { EnclosureElement, EnclosureElementsGroup } from 'app/interfaces/enclosure.interface';
import { CoreEvent } from 'app/interfaces/events';
import { EnclosureLabelChangedEvent } from 'app/interfaces/events/enclosure-events.interface';
import { LabelDrivesEvent } from 'app/interfaces/events/label-drives-event.interface';
import { MediaChangeEvent } from 'app/interfaces/events/media-change-event.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { DialogFormConfiguration } from 'app/modules/entity/entity-dialog/dialog-form-configuration.interface';
import { EntityDialogComponent } from 'app/modules/entity/entity-dialog/entity-dialog.component';
import { RelationAction } from 'app/modules/entity/entity-form/models/relation-action.enum';
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
import { M50 } from 'app/pages/system/view-enclosure/classes/hardware/m50';
import { R10 } from 'app/pages/system/view-enclosure/classes/hardware/r10';
import { R20 } from 'app/pages/system/view-enclosure/classes/hardware/r20';
import { R20A } from 'app/pages/system/view-enclosure/classes/hardware/r20a';
import { R20B } from 'app/pages/system/view-enclosure/classes/hardware/r20b';
import { R40 } from 'app/pages/system/view-enclosure/classes/hardware/r40';
import { R50 } from 'app/pages/system/view-enclosure/classes/hardware/r50';
import { R50B } from 'app/pages/system/view-enclosure/classes/hardware/r50b';
import {
  SystemProfiler, EnclosureMetadata, EnclosureDisk, VDevMetadata,
} from 'app/pages/system/view-enclosure/classes/system-profiler';
import { VDevLabelsSvg } from 'app/pages/system/view-enclosure/classes/v-dev-labels-svg';
import { ViewConfig } from 'app/pages/system/view-enclosure/interfaces/view.config';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { DiskTemperatureService, Temperature } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectTheme } from 'app/store/preferences/preferences.selectors';

export enum EnclosureLocation {
  Front = 'front',
  Rear = 'rear',
  Internal = 'internal',
}

export interface DiskFailure {
  disk: string;
  enclosure: number;
  slot: number;
  location: EnclosureLocation;
  reasons?: string[];
}

@UntilDestroy()
@Component({
  selector: 'ix-enclosure-disks',
  templateUrl: './enclosure-disks.component.html',
  styleUrls: ['./enclosure-disks.component.scss'],
})
export class EnclosureDisksComponent implements AfterContentInit, OnChanges, OnDestroy {
  showCaption = true;
  protected pendingDialog: EntityDialogComponent;
  protected aborted = false;

  mqAlias: string;
  @ViewChild('visualizer', { static: true }) visualizer: ElementRef;
  @ViewChild('disksoverview', { static: true }) overview: ElementRef;
  @ViewChild('diskdetails', { static: false }) details: ElementRef;
  @ViewChild('domLabels', { static: false }) domLabels: ElementRef;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('system-profiler') system: SystemProfiler;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('selected-enclosure') selectedEnclosure: EnclosureMetadata;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('current-tab') currentTab: ViewConfig;
  // eslint-disable-next-line @angular-eslint/no-input-rename
  @Input('controller-events') controllerEvent$: Subject<CoreEvent>;

  app: Application;
  private resources = PIXI.loader.resources;
  container: Container;
  failedDisks: DiskFailure[] = [];
  subenclosure: { poolKeys: Record<string, number> }; // Declare rear and internal enclosure visualizations here

  chassis: Chassis;
  view: string = EnclosureLocation.Front;
  get enclosure(): ChassisView {
    if (!this.chassis) return null;

    return this.view === 'rear' ? this.chassis.rear : this.chassis.front;
  }

  private _expanders: EnclosureElement[] | EnclosureElementsGroup[] = [];
  get expanders(): (EnclosureElement | EnclosureElementsGroup)[] {
    if (!this.system.platform.includes('MINI') && this.system.enclosures && this.selectedEnclosure.disks[0]) {
      const enclosureNumber = Number(this.selectedEnclosure.disks[0].enclosure.number);
      return this.system.getEnclosureExpanders(enclosureNumber);
    }
    return this._expanders;
  }

  get unhealthyPools(): Pool[] {
    const sickPools = this.getUnhealthyPools();
    return sickPools;
  }

  private _selectedVdev: VDevMetadata;
  get selectedVdev(): VDevMetadata {
    return this._selectedVdev;
  }
  set selectedVdev(value) {
    this._selectedVdev = value;
    const disks = value && value.disks ? Object.keys(this.selectedVdev.disks) : null;

    // Sort the disks by slot number
    if (disks && disks.length > 1) {
      disks.sort((a, b) => value.slots[a] - value.slots[b]);
    }
    this.selectedVdevDisks = disks;
  }

  get enclosurePools(): string[] {
    const selectedEnclosure = this.getSelectedEnclosure();
    return Object.keys(selectedEnclosure.poolKeys);
  }

  selectedVdevDisks: string[];
  selectedDisk: EnclosureDisk;

  theme: Theme;
  protected themeUtils: ThemeUtils;
  currentView: string; // pools || status || expanders || details
  exitingView: string; // pools || status || expanders || details
  temperatures?: Temperature;
  private defaultView = 'pools';
  private labels: VDevLabelsSvg;
  private identifyBtnRef: {
    animation: ColdSubscription;
    originalState: string;
    styler: ValueReaction;
  };
  protected pixiWidth = 960;
  protected pixiHeight = 304;

  readonly EnclosureLocation = EnclosureLocation;

  constructor(
    protected core: CoreService,
    public cdr: ChangeDetectorRef,
    public dialogService: DialogService,
    protected translate: TranslateService,
    protected ws: WebSocketService,
    protected store$: Store<AppState>,
    protected themeService: ThemeService,
    protected diskTemperatureService: DiskTemperatureService,
  ) {
    this.themeUtils = new ThemeUtils();
    this.diskTemperatureService.listenForTemperatureUpdates();

    core.register({ observerClass: this, eventName: 'DiskTemperatures' }).pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      const chassisView = this.view === 'rear' ? this.chassis.rear : this.chassis.front;
      if (!this.chassis || !chassisView || !chassisView.driveTrayObjects) { return; }

      const clone: Temperature = { ...evt.data };
      clone.values = {};
      clone.keys = [];

      chassisView.driveTrayObjects.forEach((dt) => {
        const disk = this.findDiskBySlotNumber(parseInt(dt.id));
        if (disk) {
          clone.keys.push(disk.name);
          clone.values[disk.name] = evt.data.values[disk.name];
        }
      });

      this.temperatures = clone;
    });
    core.emit({ name: 'DiskTemperaturesSubscribe', sender: this });

    core.register({ observerClass: this, eventName: 'MediaChange' }).pipe(untilDestroyed(this)).subscribe((evt: MediaChangeEvent) => {
      this.mqAlias = evt.data.mqAlias;
      this.resizeView();
    });

    this.store$.select(selectTheme).pipe(
      filter(Boolean),
      map(() => this.themeService.currentTheme()),
      untilDestroyed(this),
    ).subscribe((theme: Theme) => {
      this.theme = theme;
      this.setCurrentView(this.currentView);
      if (this.labels && this.labels.events$) {
        this.labels.events$.next({ name: 'ThemeChanged', data: theme, sender: this });
      }
      this.optimizeChassisOpacity();
    });
  }

  clearDisk(): void {
    this.setCurrentView(this.defaultView);
  }

  ngAfterContentInit(): void {
    this.controllerEvent$.pipe(untilDestroyed(this)).subscribe((evt: CoreEvent) => {
      switch (evt.name) {
        case 'CanvasExtract':
          this.createExtractedEnclosure(evt.data);
          break;
        case 'EnclosureLabelChanged':
          if (this.pendingDialog !== undefined) {
            this.pendingDialog.loader.close();
            this.pendingDialog.dialogRef.close();
          }
          break;
        case 'PoolsChanged':
          this.setDisksEnabledState();
          this.setCurrentView(this.defaultView);
          break;
      }
    });

    this.pixiInit();

    // Listen for DOM changes to avoid race conditions with animations
    const callback = (mutationList: MutationRecord[]): void => {
      mutationList.forEach((mutation) => {
        switch (mutation.type) {
          case 'childList':
            /* One or more children have been added to and/or removed
               from the tree; see mutation.addedNodes and
               mutation.removedNodes */
            const element = mutation.addedNodes?.[0] as HTMLElement;
            if (
              !element
              || !element.classList
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
          case 'attributes':
            /* An attribute value changed on the element in
               mutation.target; the attribute name is in
               mutation.attributeName and its previous value is in
               mutation.oldValue */

            const diskName: boolean = (mutation.target as HTMLElement).classList.contains('disk-name');

            if (diskName && this.currentView === 'details' && this.exitingView === 'details') {
              this.update('stage-right'); // View has changed so we launch transition animations
              this.update('stage-left'); // View has changed so we launch transition animations
              this.labels.events$.next({ name: 'OverlayReady', data: { vdev: this.selectedVdev, overlay: this.domLabels }, sender: this });
            }
            break;
        }
      });
    };

    const observerOptions = {
      childList: true,
      attributes: true,
      subtree: true, // Omit or set to false to observe only changes to the parent node.
    };

    const domChanges = new MutationObserver(callback);
    domChanges.observe(this.overview.nativeElement, observerOptions);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.selectedEnclosure) {
      // Enabled subenclosure functionality
      this.loadEnclosure(
        changes.selectedEnclosure.currentValue,
        EnclosureLocation.Front,
        !changes.selectedEnclosure.firstChange,
      );
    }
  }

  ngOnDestroy(): void {
    this.core.emit({ name: 'DiskTemperaturesUnsubscribe', sender: this });
    this.core.unregister({ observerClass: this });
    this.destroyAllEnclosures();
    this.app.stage.destroy(true);
    this.app.destroy(true);
  }

  loadEnclosure(enclosure: EnclosureMetadata, view?: string, update?: boolean): void {
    if (this.selectedDisk) {
      this.selectedDisk = null;
      this.clearDisk();
    }

    this.destroyEnclosure();

    if (view) {
      this.view = view;
    }

    if (this.system && this.selectedEnclosure) {
      this.getDiskFailures();
    }

    if (this.enclosure) {
      this.exitingView = this.currentView;
      this.currentView = this.defaultView;
      if (this.exitingView === 'details') {
        this.labels.exit();
        if (this.identifyBtnRef) {
          this.toggleSlotStatus(true);
          this.radiate(true);
        }
        this.exit('stage-left');
        this.exit('stage-right');
      } else if (this.exitingView === 'expanders') {
        this.exit('full-stage');
      }

      if (update) {
        this.createEnclosure(enclosure);
      }
    }
  }

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

  createEnclosure(profile: EnclosureMetadata = this.selectedEnclosure): void {
    if (this.currentView === 'details') {
      this.clearDisk();
    }
    const enclosure = this.system.enclosures[profile.enclosureKey];
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
      case 'M Series':
        const rearChassis = !!this.system.rearIndex;
        this.chassis = new M50(rearChassis);
        break;
      case 'X Series':
      case 'ES12':
        this.chassis = new Es12();
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

    this.setupEnclosureEvents();
  }

  setupEnclosureEvents(): void {
    this.enclosure.events.pipe(untilDestroyed(this)).subscribe((evt) => {
      switch (evt.name) {
        case 'Ready':
          this.container.addChild(this.enclosure.container);
          this.enclosure.container.name = this.enclosure.model;
          this.enclosure.container.width = this.enclosure.container.width / 2;
          this.enclosure.container.height = this.enclosure.container.height / 2;

          this.enclosure.container.x = this.pixiWidth / 2 - this.enclosure.container.width / 2;
          this.enclosure.container.y = this.pixiHeight / 2 - this.enclosure.container.height / 2;

          this.setDisksEnabledState();
          this.setCurrentView(this.defaultView);

          this.optimizeChassisOpacity();

          break;
        case 'DriveSelected':
          if (this.identifyBtnRef) {
            this.toggleSlotStatus(true);
            this.radiate(true);
          }

          const disk = this.findDiskBySlotNumber(parseInt(evt.data.id));
          if (disk === this.selectedDisk) { break; } // Don't trigger any changes if the same disk is selected

          if (evt.data.enabled) {
            this.selectedDisk = disk;
            this.setCurrentView('details');
          }
          break;
      }
    });

    if (!this.resources[this.enclosure.model]) {
      this.enclosure.load();
    } else {
      this.onImport();
    }
  }

  createExtractedEnclosure(profile: EnclosureMetadata): void {
    const rawEnclosure = this.system.enclosures[profile.enclosureKey];
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
      case 'M Series':
        extractedChassis = new M50();
        break;
      case 'X Series':
      case 'ES12':
        extractedChassis = new Es12();
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

    const enclosure: ChassisView = extractedChassis.front;

    enclosure.events.pipe(untilDestroyed(this)).subscribe((evt) => {
      switch (evt.name) {
        case 'Ready':
          this.container.addChild(enclosure.container);
          enclosure.container.name = enclosure.model + '_for_extraction';
          enclosure.container.width = enclosure.container.width / 2;
          enclosure.container.height = enclosure.container.height / 2;

          enclosure.container.x = this.pixiWidth / 2 - enclosure.container.width / 2;
          enclosure.container.y = this.pixiHeight / 2 - enclosure.container.height / 2;

          this.optimizeChassisOpacity(enclosure);

          profile.disks.forEach((disk) => {
            this.setDiskHealthState(disk, enclosure);
          });
          this.extractEnclosure(enclosure, profile);

          break;
      }
    });

    enclosure.load();
  }

  extractEnclosure(enclosure: ChassisView, profile: EnclosureMetadata): void {
    const canvas = this.app.renderer.plugins.extract.canvas(enclosure.container);
    this.controllerEvent$.next({ name: 'EnclosureCanvas', data: { canvas, profile }, sender: this });
    this.container.removeChild(enclosure.container);
  }

  destroyEnclosure(): void {
    if (!this.enclosure) { return; }
    this.container.removeChild(this.enclosure.container);
    this.enclosure.destroy();
  }

  destroyAllEnclosures(): void {
    if (this.enclosure) {
      // Clear out assets
      this.enclosure.destroy();
    }
    this.container.destroy(true);
    PIXI.loader.resources = {};
  }

  makeDriveTray(): DriveTray {
    const dt = this.enclosure.makeDriveTray();
    return dt;
  }

  onImport(): void {
    const sprite = PIXI.Sprite.from(this.enclosure.loader.resources.m50.texture.baseTexture);
    sprite.x = 0;
    sprite.y = 0;
    sprite.name = this.enclosure.model + '_sprite';
    sprite.alpha = 0.1;
    this.container.addChild(sprite);

    const dt = this.enclosure.makeDriveTray();
    this.container.addChild(dt.container);
    this.setCurrentView(this.defaultView);
  }

  setCurrentView(opt: string): void {
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

    switch (opt) {
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
      case 'details':
        this.container.alpha = 1;
        this.setDisksDisabled();

        this.setDisksPoolState();
        const vdev = this.system.getVdevInfo(this.selectedDisk.devname);
        this.selectedVdev = vdev;

        this.labels = new VDevLabelsSvg(this.enclosure, this.app, this.selectedDisk, this.theme);

        this.labels.events$.next({ name: 'LabelDrives', data: vdev, sender: this } as LabelDrivesEvent);

        break;
    }

    this.currentView = opt;
    this.resizeView();
  }

  update(className: string): void { // stage-left or stage-right or expanders
    const sideStage = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className);
    const html = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className + ' .content');
    const el = styler(html, {});

    const x = (sideStage.offsetWidth * 0.5) - (el.get('width') * 0.5);
    const y = sideStage.offsetTop + (sideStage.offsetHeight * 0.5) - (el.get('height') * 0.5);
    html.style.left = x.toString() + 'px';
    html.style.top = y.toString() + 'px';
  }

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

    const sideStage = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className);
    const html = this.overview.nativeElement.querySelector('.' + this.currentView + '.' + className + ' .content');
    const el = styler(html, {});

    const x = (sideStage.offsetWidth * 0.5) - (el.get('width') * 0.5);
    const y = sideStage.offsetTop + (sideStage.offsetHeight * 0.5) - (el.get('height') * 0.5);
    html.style.left = x.toString() + 'px';
    html.style.top = y.toString() + 'px';

    tween({
      from: { scale: 0, opacity: 0 },
      to: { scale: 1, opacity: 1 },
      duration: 360,
    }).start({
      update: (valuesUpdate: { scale: number; opacity: number }) => { el.set(valuesUpdate); },
      complete: () => {
        if (this.currentView === 'details') {
          this.labels.events$.next({ name: 'OverlayReady', data: { vdev: this.selectedVdev, overlay: this.domLabels }, sender: this });
        }
      },
    });
  }

  exit(className: string): void { // stage-left or stage-right or full-stage
    const html = this.overview.nativeElement.querySelector('.' + className + '.' + this.exitingView);
    const el = styler(html, {});
    let duration = 360;

    // x is the position relative to it's starting point.
    const width = el.get('width');
    const startX = 0;
    let endX = className === 'stage-left' ? width * -1 : width;
    if (className === 'full-stage') {
      endX = startX;
      duration = 10;
    }

    // Move stage left
    tween({
      from: { opacity: 1, x: 0 },
      to: {
        opacity: 0,
        x: endX,
      },
      duration,
    }).start({
      update: (valuesUpdate: { opacity: number; x: number }) => { el.set(valuesUpdate); },
      complete: () => {
        if (this.exitingView === 'details' && this.currentView !== 'details') {
          this.selectedDisk = null;
          this.labels = null;
          this.selectedVdev = null;
        }
        this.exitingView = null;
        el.set({ x: 0 });
      },
    });
  }

  optimizeChassisOpacity(extractedEnclosure?: ChassisView): void {
    const css = document.documentElement.style.getPropertyValue('--contrast-darkest');
    const hsl = this.themeUtils.hslToArray(css);

    let opacity;
    if (extractedEnclosure) {
      opacity = hsl[2] < 60 ? 0.35 : 0.75;
      extractedEnclosure.chassis.alpha = opacity;
    } else {
      opacity = hsl[2] < 60 ? 0.25 : 0.75;
      this.chassis.front.setChassisOpacity(opacity);

      if (this.chassis.rear) {
        this.chassis.rear.setChassisOpacity(opacity);
      }
    }
  }

  setDisksEnabledState(enclosure?: ChassisView): void {
    if (!enclosure) { enclosure = this.enclosure; }
    enclosure.driveTrayObjects.forEach((dt) => {
      const disk = this.findDiskBySlotNumber(Number(dt.id));
      dt.enabled = !!disk;
    });
  }

  setDisksDisabled(): void {
    this.enclosure.driveTrayObjects.forEach((dt) => {
      this.enclosure.events.next({ name: 'ChangeDriveTrayColor', data: { id: dt.id, color: 'none' } });
    });
  }

  setDisksHealthState(): void {
    const selectedEnclosure = this.getSelectedEnclosure();

    selectedEnclosure.disks.forEach((disk) => {
      this.setDiskHealthState(disk);
    });
  }

  setDiskHealthState(disk: EnclosureDisk, enclosure: ChassisView = this.enclosure): void {
    let index = -1;

    enclosure.driveTrayObjects.forEach((dto: DriveTray, i: number) => {
      const result = (dto.id === disk.enclosure.slot.toString());
      if (result) {
        index = i;
      }
    });

    if (index === -1) {
      return;
    }

    enclosure.driveTrayObjects[index].enabled = !!disk.enclosure.slot;

    let failed = false;

    // Health based on disk.status
    if (disk && disk.status) {
      switch (disk.status) {
        case 'ONLINE':
          enclosure.events.next({ name: 'ChangeDriveTrayColor', data: { id: disk.enclosure.slot, color: this.theme.green } });
          break;
        case 'FAULT':
          failed = true;
          break;
        case 'AVAILABLE':
          enclosure.events.next({ name: 'ChangeDriveTrayColor', data: { id: disk.enclosure.slot, color: '#999999' } });
          break;
        default:
          enclosure.events.next({ name: 'ChangeDriveTrayColor', data: { id: disk.enclosure.slot, color: this.theme.yellow } });
          break;
      }
    }

    // Also check slot status
    const elements: EnclosureElement[] = this.system.rearIndex && disk.enclosure.number === this.system.rearIndex
      ? this.system.enclosures[disk.enclosure.number].elements as any[]
      : this.system.enclosures[disk.enclosure.number].elements[0].elements;
    const slot = elements.find((element) => element.slot === disk.enclosure.slot);

    if (!failed && slot.fault) {
      failed = true;
    }

    if (failed) {
      enclosure.events.next({ name: 'ChangeDriveTrayColor', data: { id: disk.enclosure.slot, color: this.theme.red } });
    }
  }

  getUnhealthyPools(): Pool[] {
    const sickPools: Pool[] = [];
    this.system.pools.forEach((pool: Pool, index: number) => {
      const healthy = pool.healthy;
      const inCurrentEnclosure = index === this.selectedEnclosure.poolKeys[pool.name];
      if (!healthy && inCurrentEnclosure) {
        sickPools.push(pool);
      }
    });
    return sickPools;
  }

  getDiskFailures(): void {
    const failedDisks: DiskFailure[] = [];
    const selectedEnclosure = this.getSelectedEnclosure();

    const analyze = (disk: EnclosureDisk): void => {
      let failed = false;
      const reasons = [];

      // Health based on disk.status
      if (disk && disk.status && disk.status === 'FAULT') {
        failed = true;
        reasons.push("Disk Status is 'FAULT'");
      }

      // Also check slot status
      const elements: EnclosureElement[] = this.system.rearIndex && disk.enclosure.number === this.system.rearIndex
        ? this.system.enclosures[disk.enclosure.number].elements as any[]
        : this.system.enclosures[disk.enclosure.number].elements[0].elements;
      const slot = elements.find((element) => element.slot === disk.enclosure.slot);

      if (!failed && slot.fault) {
        failed = true;
      }

      if (failed) {
        const location = this.subenclosure && disk.enclosure.number === this.system.rearIndex
          ? EnclosureLocation.Rear
          : EnclosureLocation.Front;
        const failure: DiskFailure = {
          disk: disk.name, enclosure: disk.enclosure.number, slot: disk.enclosure.slot, location,
        };
        failedDisks.push(failure);
      }
    };

    if (this.subenclosure) {
      // If this is a head unit with rear bays, treat both enclosures as single unit
      this.system.profile[this.system.headIndex].disks.forEach((disk) => {
        analyze(disk);
      });

      this.system.profile[this.system.rearIndex].disks.forEach((disk) => {
        analyze(disk);
      });
    } else {
      selectedEnclosure.disks.forEach((disk) => {
        analyze(disk);
      });
    }

    this.failedDisks = failedDisks;
  }

  getSelectedEnclosure(): EnclosureMetadata {
    return this.view === EnclosureLocation.Rear && this.system.rearIndex
      ? this.system.profile[this.system.rearIndex]
      : this.selectedEnclosure;
  }

  setDisksPoolState(): void {
    const selectedEnclosure: EnclosureMetadata = this.getSelectedEnclosure();
    this.setDisksDisabled();

    selectedEnclosure.disks.forEach((disk): void => {
      if (
        disk.enclosure.slot < this.enclosure.slotRange.start
        || disk.enclosure.slot > this.enclosure.slotRange.end
      ) {
        return;
      }

      if (!disk.vdev) {
        this.enclosure.events.next({ name: 'ChangeDriveTrayColor', data: { id: disk.enclosure.slot, color: '#999999' } });
        return;
      }

      const pIndex = disk.vdev.poolIndex;

      this.enclosure.events.next({
        name: 'ChangeDriveTrayColor',
        data: { id: disk.enclosure.slot, color: this.theme[this.theme.accentColors[pIndex] as keyof Theme] },
      });
    });
  }

  converter(size: number): string {
    const gb = size / 1024 / 1024 / 1024;
    if (gb > 1000) {
      const tb = gb / 1024;
      return tb.toFixed(2) + ' TB';
    }
    return gb.toFixed(2) + ' GB';
  }

  findDiskBySlotNumber(slot: number): EnclosureDisk {
    const selectedEnclosure = this.getSelectedEnclosure();
    return selectedEnclosure.disks.find((disk) => {
      return disk.enclosure.slot === slot;
    });
  }

  toggleHighlightMode(mode: string): void {
    if (this.selectedDisk.status === 'AVAILABLE') { return; }

    this.labels.events$.next({
      name: mode === 'on' ? 'EnableHighlightMode' : 'DisableHighlightMode',
      sender: this,
    });
  }

  highlightPath(devname: string): void {
    // show the svg path
    this.labels.events$.next({
      name: 'HighlightDisk',
      data: { devname, overlay: this.domLabels },
      sender: this,
    });
  }

  unhighlightPath(devname: string): void {
    // show the svg path
    this.labels.events$.next({
      name: 'UnhighlightDisk',
      data: { devname, overlay: this.domLabels },
      sender: this,
    });
  }

  toggleSlotStatus(kill?: boolean): void {
    const selectedEnclosure = this.getSelectedEnclosure();
    const enclosureId = this.system.enclosures[selectedEnclosure.enclosureKey].id;
    const slot = this.selectedDisk.enclosure.slot;
    const status = !this.identifyBtnRef && !kill ? EnclosureSlotStatus.Identify : EnclosureSlotStatus.Clear;

    this.ws.call('enclosure.set_slot_status', [enclosureId, slot, status])
      .pipe(untilDestroyed(this))
      .subscribe(() => {});

    this.radiate();
  }

  radiate(kill?: boolean): void {
    // Animation
    if (this.identifyBtnRef) {
      // kill the animation
      this.identifyBtnRef.animation.seek(0);
      (this.identifyBtnRef.animation.stop as any)(this.identifyBtnRef.styler);
      this.identifyBtnRef = null;
    } else if (!this.identifyBtnRef && !kill) {
      const btn = styler(this.details.nativeElement.querySelector('#identify-btn'), {});
      const startShadow = btn.get('box-shadow');

      const elementBorder = value(
        { borderColor: '', borderWidth: 0 },
        ({ borderColor, borderWidth }: { borderColor: string; borderWidth: number }) => btn.set({
          boxShadow: `0 0 0 ${borderWidth}px ${borderColor}`,
        }),
      );

      // Convert color to rgb value
      const cc = this.hexToRgb(this.theme.cyan);
      const animation = keyframes({
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

  hexToRgb(str: string): { hex: string; rgb: number[] } {
    const spl = str.split('#');
    let hex = spl[1];
    if (hex.length === 3) {
      hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    let value = '';
    const rgb = [];
    for (let i = 0; i < 6; i++) {
      const mod = i % 2;
      const even = 0;
      value += hex[i];
      if (mod !== even) {
        rgb.push(parseInt(value, 16));
        value = '';
      }
    }
    return {
      hex,
      rgb,
    };
  }

  onResize(): void {
    this.resizeView();
  }

  resizeView(): void {
    // Layout helper code goes in here...
    const visualizer = this.overview.nativeElement.querySelector('#visualizer');
    visualizer.classList.add('resized');
  }

  enclosureOverride(view: string): void {
    if (view !== this.view) {
      this.selectedDisk = null;
      this.clearDisk();
      this.loadEnclosure(this.selectedEnclosure, view, true);
    }
  }

  setEnclosureLabel(value?: string): void {
    const enclosure = this.system.enclosures[this.selectedEnclosure.enclosureKey];
    if (!value) {
      value = enclosure.name;
    }

    this.ws.call('enclosure.update', [enclosure.id, { label: value }])
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.core.emit({
          name: 'EnclosureLabelChanged',
          sender: this,
          data: { index: this.selectedEnclosure.enclosureKey, id: enclosure.id, label: value },
        } as EnclosureLabelChangedEvent);
      });
  }

  labelForm(): void {
    const obj = this.system.enclosures[this.selectedEnclosure.enclosureKey];
    const currentLabel = obj.label !== obj.name ? obj.label : this.selectedEnclosure.model;
    const conf: DialogFormConfiguration = {
      title: this.translate.instant('Change Enclosure Label'),
      fieldConfig: [
        {
          type: 'input',
          inputType: 'text',
          value: currentLabel,
          name: 'label',
          required: false,
          placeholder: 'Enclosure Label',
          relation: [
            {
              action: RelationAction.Disable,
              when: [{
                name: 'reset',
                value: true,
              }],
            },
          ],
        },
        {
          type: 'checkbox',
          value: false,
          name: 'reset',
          placeholder: 'Reset to default',
        },
      ],
      saveButtonText: this.translate.instant('SAVE'),
      customSubmit: (entityDialog: EntityDialogComponent) => {
        this.pendingDialog = entityDialog;
        entityDialog.loader.open();
        this.setEnclosureLabel(entityDialog.formValue.label);
      },
    };

    this.dialogService.dialogForm(conf);
  }
}
