import { KeyValue } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import { filter, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
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

  protected isLoading$ = this.poolManagerStore.isLoading$;
  protected hasDisks$ = this.poolManagerStore.inventory$.pipe(
    map((unusedDisks) => unusedDisks.length),
  );

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
        this.cdr.markForCheck();
      });
  }

  getFilesize(size: string): string {
    return filesize(Number(size), { standard: 'iec' });
  }

  orderBySize(a: KeyValue<string, UnusedDisk[]>, b: KeyValue<string, UnusedDisk[]>): number {
    return Number(a.key) - Number(b.key);
  }
}
