import { Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ManagerVdev } from 'app/interfaces/vdev-info.interface';

@UntilDestroy()
@Component({
  selector: 'ix-vdev-wrapper',
  templateUrl: './vdev-wrapper.component.html',
  styleUrls: ['./vdev-wrapper.component.scss'],
})
export class VdevWrapperComponent {
  @Input() enclosure: number;
  @Input() vdev: ManagerVdev;
  // @Input() swapondrive: number;
  // size: string;
  // rawSize = 0;
  // firstdisksize: number;
  // error: string;
  // diskSizeErrorMsg = helptext.vdev_diskSizeErrorMsg;
  // vdevTypeTooltip = helptext.vdev_type_tooltip;
  // vdevDisksError: boolean;
  // showDiskSizeError: boolean;
  // vdevTypeDisabled = false;
  // protected mindisks = {
  //   stripe: 1, mirror: 2, raidz: 3, raidz2: 4, raidz3: 5,
  // };
  // private tenMib = 10 * MiB;

  // constructor(private translate: TranslateService) {}

  // estimateSize(): void {
  //   this.error = null;
  //   this.firstdisksize = 0;
  //   let totalsize = 0;
  //   let stripeSize = 0;
  //   let smallestdisk = 0;
  //   let estimate = 0;
  //   const swapsize = this.swapondrive * GiB;
  //   this.showDiskSizeError = false;
  //   for (let i = 0; i < this.vdev.disks.length; i++) {
  //     const size = this.vdev.disks[i].real_capacity - swapsize;
  //     stripeSize += size;
  //     if (i === 0) {
  //       smallestdisk = size;
  //       this.firstdisksize = size;
  //     }
  //     if (size > smallestdisk + this.tenMib || size < smallestdisk - this.tenMib) {
  //       this.showDiskSizeError = true;
  //     }
  //     if (this.vdev.disks[i].real_capacity < smallestdisk) {
  //       smallestdisk = size;
  //     }
  //   }
  //   if (this.vdev.type === 'data') {
  //     if (this.vdev.disks.length > 0 && this.vdev.disks.length < this.mindisks[this.vdev.]) {
  //       this.error = this.translate.instant(
  //         'This type of VDEV requires at least {n, plural, one {# disk} other {# disks}}.',
  //         { n: this.mindisks[this.typeControl.value] },
  //       );
  //       this.vdevDisksError = true;
  //     } else {
  //       this.vdevDisksError = false;
  //     }
  //   }
  //   totalsize = smallestdisk * this.vdev.disks.length;

  //   if (this.vdev.type === 'mirror') {
  //     estimate = smallestdisk;
  //   } else if (this.vdev.type === 'raidz') {
  //     estimate = totalsize - smallestdisk;
  //   } else if (this.vdev.type === 'raidz2') {
  //     estimate = totalsize - 2 * smallestdisk;
  //   } else if (this.vdev.type === 'raidz3') {
  //     estimate = totalsize - 3 * smallestdisk;
  //   } else {
  //     estimate = stripeSize; // stripe
  //   }

  //   this.rawSize = estimate;
  //   this.size = filesize(estimate, { standard: 'iec' });
  // }
}
