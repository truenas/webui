import { Directive } from '@angular/core';
import { TrayConfig } from 'app/interfaces/enclosure-tray.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

@Directive()
export class BaseEnclosureDirective {
  driveTrays: TrayConfig[];

  constructor(
    protected enclosureStore: EnclosureStore,
  ) {
    this.enclosureStore.initiate();
  }

  selectTray(tray: TrayConfig): void {
    for (const driveTray of this.driveTrays) {
      if (driveTray.slot !== tray.slot) {
        driveTray.selected = false;
      }
    }
    tray.selected = true;
    this.enclosureStore.selectDisk(tray.diskName);
  }
}
