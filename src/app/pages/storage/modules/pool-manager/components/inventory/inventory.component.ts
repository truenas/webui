import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import { DiskType } from 'app/enums/disk-type.enum';
import { PoolManagerWizardFormValue } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-value.interface';
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
  inventory: SizeDisksMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };
  formValue: PoolManagerWizardFormValue;
  DiskType = DiskType;

  constructor(
    private poolManagerStore: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.unusedDisks$.pipe(untilDestroyed(this)).subscribe((unusedDisks) => {
      this.sizeDisksMap = {
        [DiskType.Hdd]: getSizeDisksMap(unusedDisks.filter((disk) => disk.type === DiskType.Hdd)),
        [DiskType.Ssd]: getSizeDisksMap(unusedDisks.filter((disk) => disk.type === DiskType.Ssd)),
      };
      this.cdr.markForCheck();
    });

    this.poolManagerStore.formValue$.pipe(untilDestroyed(this)).subscribe((formValue) => {
      this.formValue = formValue;
      this.cdr.markForCheck();
      if (formValue) {
        this.updateInventory();
      }
    });
  }

  updateInventory(): void {
    const type = this.formValue.data.sizeAndType[1] as DiskType;
    const selectedSize = this.formValue.data.sizeAndType[0];
    const disksSelected = this.formValue.data.width * this.formValue.data.vdevsNumber;

    this.inventory[type] = {};

    Object.entries(this.sizeDisksMap[type]).forEach(([size, number]) => {
      const remainingCount = number > disksSelected ? number - disksSelected : 0;
      this.inventory[type][size] = size === selectedSize ? remainingCount : number;
    });
  }

  getFilesize(size: string): string {
    return filesize(Number(size), { standard: 'iec' });
  }
}
