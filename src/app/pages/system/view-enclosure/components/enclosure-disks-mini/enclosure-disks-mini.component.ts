import {
  ChangeDetectorRef, Component, ElementRef, ViewChild,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Point } from 'pixi.js';
import { EnclosureUi, EnclosureUiSlot } from 'app/interfaces/enclosure.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { Mini } from 'app/pages/system/view-enclosure/classes/hardware/mini';
import { MiniX } from 'app/pages/system/view-enclosure/classes/hardware/mini-x';
import { MiniXlPlus } from 'app/pages/system/view-enclosure/classes/hardware/mini-xl-plus';
import {
  EnclosureDisksComponent,
} from 'app/pages/system/view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { EnclosureStore } from 'app/pages/system/view-enclosure/stores/enclosure-store.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store/index';

// TODO: Fix change detection when the opportunity to test is there.
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
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
    return this.enclosureStore?.getPools(this.selectedEnclosure);
  }

  get totalDisks(): number {
    const allSlots: [string, EnclosureUiSlot][] = this.asArray(
      this.selectedEnclosure.elements['Array Device Slot'],
    ) as [string, EnclosureUiSlot][];

    return allSlots.map((keyValue: [string, EnclosureUiSlot]) => keyValue[1])
      .filter((slot: EnclosureUiSlot) => {
        return slot.dev !== null;
      }).length;
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

  /* findEnclosureSlotFromSlotNumber(slot: number): EnclosureUiSlot {
    const enclosureSlot: EnclosureSlot = this.selectedEnclosure.elements.find((enclosure: EnclosureSlot) => {
      return enclosure.slot === slot;
    });

    return enclosureSlot;
  } */

  createExtractedEnclosure(): void {
    // MINIs have no support for expansion shelves
    // therefore we will never need to create
    // any enclosure selection UI. Leave this
    // empty or the base class will throw errors
    console.error('Cannot create extracted enclosure for selector UI. MINI products do not support expansion shelves');
  }

  createEnclosure(enclosure: EnclosureUi = this.selectedEnclosure): void {
    if (!this.enclosureViews || !this.selectedEnclosure) {
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

  /* count(obj: Record<string, unknown> | unknown[]): number {
    return Object.keys(obj).length;
  } */

  stackPositions(log = false): Point[] {
    const result = this.chassisView.driveTrayObjects.map((dt) => dt.container.getGlobalPosition());

    if (log) {
      console.warn(result);
    }
    return result;
  }
}
