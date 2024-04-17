import { ChangeDetectionStrategy, Component, TrackByFunction } from '@angular/core';

interface TrayConfig {
  highlight: boolean;
  slot: number;
  empty: boolean;
  selected: boolean;
}

@Component({
  templateUrl: './m50-enclosure.component.svg',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class M50EnclosureComponent {
  emptyTrayDrawInstructions = 'M150.7,78.5v30.475H269.33V78.5Zm35.549,26.012a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,186.249,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,186.249,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,186.249,92.714Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,186.249,87.028ZM196,104.512a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,196,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,196,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,196,92.714Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,196,87.028Zm10.576,17.484a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,206.576,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,206.576,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,206.576,92.714Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,206.576,87.028Zm8.925,17.484a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,215.5,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,215.5,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,215.5,92.714Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,215.5,87.028Zm9.751,17.484a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,225.252,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,225.252,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,225.252,92.714Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.205,2.205,0,0,1,225.252,87.028Zm10.576,17.484a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,235.828,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,235.828,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,235.828,92.714Zm0-5.685A2.231,2.231,0,1,1,238.06,84.8,2.244,2.244,0,0,1,235.828,87.028Zm9.353,17.484a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,245.182,104.512Zm0-6.113a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,245.182,98.4Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,245.182,92.714Zm0-5.685a2.231,2.231,0,1,1,2.231-2.231A2.244,2.244,0,0,1,245.182,87.028Z';

  trackTraysBy: TrackByFunction<TrayConfig> = (index, tray) => tray.slot;

  nonEmptyTrayDrawInstructions = 'M150.7,79.8v29.711H268.138v-6.847l-13.2.092V105.2H162.682V83.682h92.251v3.24h13.388V79.8Z';

  driveTrayTransformation = 'translate(119.457 30.476) rotate(180)';

  idPrefix = 'tray';

  /** TODO: Replace 'driveTrays' with real data from webui.enclosure.dashboard response from disks
   * and enclosure drive trays data
   */
  driveTrays: TrayConfig[] = [
    {
      slot: 1,
      empty: true,
      highlight: false,
      selected: false,
    },
    {
      slot: 2,
      empty: true,
      selected: false,
      highlight: false,
    },
    {
      highlight: false,
      slot: 3,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      selected: false,
      slot: 4,
      empty: true,
    },
    {
      highlight: false,
      slot: 5,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 6,
      selected: false,
      empty: true,
    },
    {
      slot: 7,
      highlight: false,
      selected: false,
      empty: true,
    },
    {
      slot: 8,
      highlight: false,
      selected: false,
      empty: true,
    },
    {
      slot: 9,
      highlight: false,
      selected: false,
      empty: false,
    },
    {
      slot: 10,
      highlight: false,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 11,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 12,
      selected: false,
      empty: false,
    },
    {
      highlight: false,
      slot: 13,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 14,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 15,
      selected: false,
      empty: false,
    },
    {
      slot: 16,
      highlight: false,
      selected: false,
      empty: true,
    },
    {
      slot: 17,
      selected: false,
      highlight: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 18,
      selected: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 19,
      selected: false,
      empty: true,
    },
    {
      slot: 20,
      selected: false,
      highlight: false,
      empty: true,
    },
    {
      slot: 21,
      highlight: false,
      selected: false,
      empty: true,
    },
    {
      slot: 22,
      empty: true,
      selected: false,
      highlight: false,
    },
    {
      slot: 23,
      selected: false,
      highlight: false,
      empty: true,
    },
    {
      highlight: false,
      slot: 24,
      selected: false,
      empty: true,
    },
  ];

  getDriveTrayTransformation(tray: { slot: number; empty: boolean }): string {
    const xOffset = -0.001 + (((tray.slot - 1) % 4) * 125);
    const yOffset = 0 + (Math.floor((tray.slot - 1) / 4) * 33);
    return `translate(${xOffset} ${yOffset})`;
  }

  selectTray(tray: TrayConfig): void {
    for (const driveTray of this.driveTrays) {
      if (driveTray.slot !== tray.slot) {
        driveTray.selected = false;
      }
    }
    tray.selected = true;
  }
}
