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
  sizeDisksMap: SizeDisksMap = { hdd: {}, ssd: {} };
  inventory: SizeDisksMap = { hdd: {}, ssd: {} };
  formValue: PoolManagerWizardFormValue;

  constructor(
    private poolManagerStore: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.unusedDisks$.pipe(untilDestroyed(this)).subscribe((unusedDisks) => {
      this.sizeDisksMap = {
        hdd: getSizeDisksMap(unusedDisks.filter((disk) => disk.type === DiskType.Hdd)),
        ssd: getSizeDisksMap(unusedDisks.filter((disk) => disk.type === DiskType.Ssd)),
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
    const isHdd = this.formValue.data.sizeAndType[1] === DiskType.Hdd;
    const selectedSize = this.formValue.data.sizeAndType[0];

    this.inventory = {
      hdd: !isHdd ? this.sizeDisksMap.hdd : {},
      ssd: isHdd ? this.sizeDisksMap.ssd : {},
    };

    Object.entries(isHdd ? this.sizeDisksMap.hdd : this.sizeDisksMap.ssd).forEach(([size, number]) => {
      if (isHdd) {
        this.inventory.hdd[size] = size === selectedSize ? number - this.formValue.data.vdevsNumber : number;
      } else {
        this.inventory.ssd[size] = size === selectedSize ? number - this.formValue.data.vdevsNumber : number;
      }
    });
  }

  getFilesize(size: string): string {
    return filesize(Number(size), { standard: 'iec' });
  }
}
