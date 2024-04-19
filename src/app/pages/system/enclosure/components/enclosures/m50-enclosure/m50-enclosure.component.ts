import {
  ChangeDetectionStrategy, Component, Input, TrackByFunction,
} from '@angular/core';
import { TrayConfig } from 'app/interfaces/enclosure-tray.interface';
import { EnclosureUi } from 'app/interfaces/enclosure.interface';
import { EnclosureStore } from 'app/pages/system/enclosure/services/enclosure.store';

/** Example of an enclosure view implemented using an svg template */
@Component({
  templateUrl: './m50-enclosure.component.svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50EnclosureComponent {
  @Input() enclosure: EnclosureUi;

  trackTraysBy: TrackByFunction<TrayConfig> = (index, tray) => tray.slot;

  driveTrays: TrayConfig[] = [
    {
      slot: 1,
      empty: true,

      selected: false,
    },
    {
      slot: 2,
      empty: true,
      selected: false,

    },
    {

      slot: 3,
      selected: false,
      empty: true,
    },
    {

      selected: false,
      slot: 4,
      empty: true,
    },
    {

      slot: 5,
      selected: false,
      empty: true,
    },
    {

      slot: 6,
      selected: false,
      empty: true,
    },
    {
      slot: 7,

      selected: false,
      empty: true,
    },
    {
      slot: 8,

      selected: false,
      empty: true,
    },
    {
      slot: 9,

      selected: false,
      empty: false,
    },
    {
      slot: 10,

      selected: false,
      empty: true,
    },
    {

      slot: 11,
      selected: false,
      empty: true,
    },
    {

      slot: 12,
      selected: false,
      empty: false,
    },
    {

      slot: 13,
      selected: false,
      empty: true,
    },
    {

      slot: 14,
      selected: false,
      empty: true,
    },
    {

      slot: 15,
      selected: false,
      empty: false,
    },
    {
      slot: 16,

      selected: false,
      empty: true,
    },
    {
      slot: 17,
      selected: false,

      empty: true,
    },
    {

      slot: 18,
      selected: false,
      empty: true,
    },
    {

      slot: 19,
      selected: false,
      empty: true,
    },
    {
      slot: 20,
      selected: false,

      empty: true,
    },
    {
      slot: 21,

      selected: false,
      empty: true,
    },
    {
      slot: 22,
      empty: true,
      selected: false,

    },
    {
      slot: 23,
      selected: false,

      empty: true,
    },
    {

      slot: 24,
      selected: false,
      empty: true,
    },
  ];

  idPrefix = 'tray';

  /** TODO: Replace 'driveTrays' with real data from webui.enclosure.dashboard response from disks
   * and enclosure drive trays data
   */

  getDriveTrayTransformation(tray: { slot: number; empty: boolean }): string {
    const xOffset = -0.001 + (((tray.slot - 1) % 4) * 125);
    const yOffset = 0 + (Math.floor((tray.slot - 1) / 4) * 33);
    return `translate(${xOffset} ${yOffset})`;
  }

  constructor(
    private enclosureStore: EnclosureStore,
  ) {
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
