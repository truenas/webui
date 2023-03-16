import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { ManagerDisk } from 'app/pages/storage/components/manager/manager-disk.interface';

@Component({
  selector: 'ix-manual-selection-vdev',
  templateUrl: './manual-selection-vdev.component.html',
  styleUrls: ['./manual-selection-vdev.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManualSelectionVdevComponent implements OnChanges {
  @Input() vdev: ManagerVdev;
  enclosuresDisks = new Map<number, ManagerDisk[]>();

  get spansEnclosures(): boolean {
    if (!this.vdev.disks.length) {
      return false;
    }
    const enclosure = this.vdev.disks[0].enclosure;
    return this.vdev.disks.some(
      (disk) => disk.enclosure.number !== enclosure.number,
    );
  }
  constructor(public ixFormatter: IxFormatterService) {}

  ngOnChanges(): void {
    this.enclosuresDisks = new Map();
    for (const disk of this.vdev?.disks) {
      let enclosure = this.enclosuresDisks.get(disk.enclosure.number);
      if (!enclosure) {
        enclosure = [];
      }
      this.enclosuresDisks.set(disk.enclosure.number, [...enclosure, disk]);
    }
    if (this.enclosuresDisks.size === 0) {
      this.enclosuresDisks.set(0, []);
    }
  }
}
