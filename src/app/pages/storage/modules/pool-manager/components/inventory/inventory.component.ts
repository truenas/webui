import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import { filter, switchMap } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

@UntilDestroy()
@Component({
  selector: 'ix-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InventoryComponent implements OnInit {
  protected sizeDisksMap: DiskTypeSizeMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };
  protected readonly DiskType = DiskType;
  protected hideCard = false;

  protected isLoading$ = this.poolManagerStore.isLoading$;

  constructor(
    public poolManagerStore: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isLoading$.pipe(
      filter((isLoading) => isLoading !== undefined && !isLoading),
      switchMap(() => this.poolManagerStore.inventory$),
    ).pipe(untilDestroyed(this))
      .subscribe((unusedDisks) => {
        this.sizeDisksMap = getDiskTypeSizeMap(unusedDisks);
        this.hideCard = !Object.keys(this.sizeDisksMap.HDD).length && !Object.keys(this.sizeDisksMap.SSD).length;
        this.cdr.markForCheck();
      });
  }

  getFilesize(size: string): string {
    return filesize(Number(size), { standard: 'iec' });
  }
}
