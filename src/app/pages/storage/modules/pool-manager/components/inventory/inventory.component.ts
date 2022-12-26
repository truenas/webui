import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
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
  sizeDisksMap: SizeDisksMap = {};
  formValue: PoolManagerWizardFormValue;

  constructor(
    private poolManagerStore: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.unusedDisks$.pipe(untilDestroyed(this)).subscribe((unusedDisks) => {
      this.sizeDisksMap = getSizeDisksMap(unusedDisks);
      this.cdr.markForCheck();
    });

    this.poolManagerStore.formValue$.pipe(untilDestroyed(this)).subscribe((formValue) => {
      this.formValue = formValue;
      this.cdr.markForCheck();
    });
  }

  get inventory(): SizeDisksMap {
    const filterdSizeDisksMap: SizeDisksMap = {};
    Object.entries(this.sizeDisksMap).forEach(([size, number]) => {
      if (size === this.formValue.data.size) {
        filterdSizeDisksMap[size] = number - this.formValue.data.number;
      } else {
        filterdSizeDisksMap[size] = number;
      }
    });
    return filterdSizeDisksMap;
  }

  getFilesize(size: string): string {
    return filesize(Number(size), { standard: 'iec' });
  }
}
