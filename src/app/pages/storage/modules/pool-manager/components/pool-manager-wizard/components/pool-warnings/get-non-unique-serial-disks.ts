import { TranslateService } from '@ngx-translate/core';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';

export function getNonUniqueSerialDisksWarning(
  nonUniqueSerialDisks: DetailsDisk[],
  translate: TranslateService,
): string {
  if (nonUniqueSerialDisks.every((disk) => disk.bus === DiskBus.Usb)) {
    return translate.instant(
      'Warning: There are {n} USB disks available that have non-unique serial numbers. USB controllers may report disk serial incorrectly, making such disks indistinguishable from each other. Adding such disks to a pool can result in lost data.',
      { n: nonUniqueSerialDisks.length },
    );
  }

  return translate.instant(
    'Warning: There are {n} disks available that have non-unique serial numbers. Non-unique serial numbers can be caused by a cabling issue and adding such disks to a pool can result in lost data.',
    { n: nonUniqueSerialDisks.length },
  );
}
