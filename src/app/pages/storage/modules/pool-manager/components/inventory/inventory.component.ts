import { KeyValue, AsyncPipe, KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import {
  MatCard, MatCardHeader, MatCardTitle, MatCardContent,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

@UntilDestroy()
@Component({
  selector: 'ix-inventory',
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    IxIconComponent,
    TranslateModule,
    AsyncPipe,
    KeyValuePipe,
  ],
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
    return buildNormalizedFileSize(Number(size));
  }

  orderBySize(a: KeyValue<string, DetailsDisk[]>, b: KeyValue<string, DetailsDisk[]>): number {
    return Number(a.key) - Number(b.key);
  }
}
