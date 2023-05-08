import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import { DiskType } from 'app/enums/disk-type.enum';
import { SizeDisksMap } from 'app/pages/storage/modules/pool-manager/interfaces/size-disks-map.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
import { getSizeDisksMap } from 'app/pages/storage/modules/pool-manager/utils/pool-manager.utils';

@UntilDestroy()
@Component({
  selector: 'ix-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit {
  sizeDisksMap: SizeDisksMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };
  DiskType = DiskType;

  constructor(
    private poolManagerStore: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.usableUnusedDisks$.pipe(untilDestroyed(this)).subscribe((unusedDisks) => {
      this.sizeDisksMap = {
        [DiskType.Hdd]: getSizeDisksMap(unusedDisks.filter((disk) => disk.type === DiskType.Hdd)),
        [DiskType.Ssd]: getSizeDisksMap(unusedDisks.filter((disk) => disk.type === DiskType.Ssd)),
      };
      this.cdr.markForCheck();
    });
  }

  getFilesize(size: string): string {
    return filesize(Number(size), { standard: 'iec' });
  }
}
