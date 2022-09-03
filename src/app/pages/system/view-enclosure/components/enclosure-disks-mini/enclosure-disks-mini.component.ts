import {
  Component, ViewChild, ElementRef, ChangeDetectorRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { Point } from 'pixi.js';
import { Theme } from 'app/interfaces/theme.interface';
import { Mini } from 'app/pages/system/view-enclosure/classes/hardware/mini';
import { MiniX } from 'app/pages/system/view-enclosure/classes/hardware/mini-x';
import { MiniXlPlus } from 'app/pages/system/view-enclosure/classes/hardware/mini-xl-plus';
import { EnclosureMetadata } from 'app/pages/system/view-enclosure/classes/system-profiler';
import { EnclosureDisksComponent } from 'app/pages/system/view-enclosure/components/enclosure-disks/enclosure-disks.component';
import { WebSocketService } from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { DialogService } from 'app/services/dialog.service';
import { DiskTemperatureService } from 'app/services/disk-temperature.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store/index';

@Component({
  selector: 'ix-enclosure-disks-mini',
  templateUrl: './enclosure-disks-mini.component.html',
  styleUrls: ['../enclosure-disks/enclosure-disks.component.scss'],
})
export class EnclosureDisksMiniComponent extends EnclosureDisksComponent {
  @ViewChild('cardcontent', { static: true }) cardContent: ElementRef;

  temperatureScales = false;

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
    super(core, cdr, dialogService, translate, ws, store$, themeService, diskTemperatureService);
    this.pixiWidth = 320;// 960 * 0.6; // PIXI needs an explicit number. Make sure the template flex width matches this
    this.pixiHeight = 480;
  }

  createExtractedEnclosure(): void {
    // MINIs have no support for expansion shelves
    // therefore we will never need to create
    // any enclosure selection UI. Leave this
    // empty or the base class will throw errors
  }

  createEnclosure(enclosure: EnclosureMetadata = this.selectedEnclosure): void {
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

    this.setupEnclosureEvents();

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
    const result = this.enclosure.driveTrayObjects.map((dt) => dt.container.getGlobalPosition());

    if (log) {
      console.warn(result);
    }
    return result;
  }
}
