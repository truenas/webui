import {
  ChangeDetectorRef, Component, ElementRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Point } from 'pixi.js';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { EnclosureSlot, EnclosureView } from 'app/interfaces/enclosure.interface';
import { Theme } from 'app/interfaces/theme.interface';
import { Mini } from 'app/pages/system/view-enclosure/classes/hardware/mini';
import { MiniX } from 'app/pages/system/view-enclosure/classes/hardware/mini-x';
import { MiniXlPlus } from 'app/pages/system/view-enclosure/classes/hardware/mini-xl-plus';
import {
  EnclosureDisksComponent,
} from 'app/pages/system/view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { EnclosureStore } from 'app/pages/system/view-enclosure/stores/enclosure-store.service';
import { DialogService } from 'app/services/dialog.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store/index';

@Component({
  selector: 'ix-enclosure-disks-mini',
  templateUrl: './enclosure-disks-mini.component.html',
  styleUrls: ['../enclosure-disks/enclosure-disks.component.scss'],
})
export class EnclosureDisksMiniComponent extends EnclosureDisksComponent {
  @ViewChild('cardcontent', { static: true }) cardContent: ElementRef;

  temperatureScales = false;
  emptySlotView = this.defaultView;

  get enclosurePools(): string[] {
    return this.selectedEnclosureView?.pools;
  }

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
    super(
      cdr,
      dialogService,
      translate,
      ws,
      store$,
      themeService,
      diskTemperatureService,
      matDialog,
      enclosureStore,
    );
    this.pixiWidth = 320;// 960 * 0.6; // PIXI needs an explicit number. Make sure the template flex width matches this
    this.pixiHeight = 480;
  }

  findEnclosureSlotFromSlotNumber(slot: number): EnclosureSlot {
    const enclosureSlot: EnclosureSlot = this.selectedEnclosureView.slots.find((enclosure: EnclosureSlot) => {
      return enclosure.slot === slot;
    });

    return enclosureSlot;
  }

  rawCapacity(view: EnclosureView): number {
    if (!view) {
      return undefined;
    }
    let capacity = 0;
    view.slots.forEach((slot: EnclosureSlot) => {
      if (slot.vdev && slot.topologyCategory === VdevType.Data) {
        capacity += slot.disk.size;
      }
    });
    return capacity;
  }

  createExtractedEnclosure(): void {
    // MINIs have no support for expansion shelves
    // therefore we will never need to create
    // any enclosure selection UI. Leave this
    // empty or the base class will throw errors
    console.error('Cannot create extracted enclosure for selector UI. MINI products do not support expansion shelves');
  }

  createEnclosure(enclosure: EnclosureView = this.selectedEnclosureView): void {
    if (!this.enclosureViews || !this.selectedEnclosureView) {
      console.warn('CANNOT CREATE MINI ENCLOSURE');
      return;
    }

    switch (enclosure.model) {
      case 'FREENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E+':
        this.chassis = new Mini();
        break;
      case 'FREENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X+':
        this.chassis = new MiniX();
        break;
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        this.chassis = new MiniXlPlus();
        break;
      default:
        this.controllerEvent$.next({
          name: 'Error',
          data: {
            name: 'Unsupported Hardware',
            message: 'This chassis has an unknown or missing model value. METHOD: createEnclosure',
          },
        });
        this.aborted = true;
        break;
    }

    if (this.aborted) {
      return;
    }

    this.setupChassisViewEvents();

    // Slight adjustment to align with external html elements
    this.container.setTransform(0);
  }

  // TODO: Helps with template type checking. To be removed when 'strict' checks are enabled.
  themeKey(key: string): keyof Theme {
    return key as keyof Theme;
  }

  count(obj: Record<string, unknown> | unknown[]): number {
    return Object.keys(obj).length;
  }

  stackPositions(log = false): Point[] {
    const result = this.chassisView.driveTrayObjects.map((dt) => dt.container.getGlobalPosition());

    if (log) {
      console.warn(result);
    }
    return result;
  }
}
