import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  of, Observable, combineLatest, startWith,
} from 'rxjs';
import { DiskBus } from 'app/enums/disk-bus.enum';
import { Option } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasNonUniqueSerial, hasExportedPool } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

@UntilDestroy()
@Component({
  selector: 'ix-pool-warnings',
  templateUrl: './pool-warnings.component.html',
  styleUrls: ['./pool-warnings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolWarningsComponent implements OnInit {
  protected form = this.formBuilder.group({
    allowNonUniqueSerialDisks: [false],
    allowExportedPools: [[] as string[]],
  });

  exportedPoolsWarning = this.translate.instant(
    `The following disks have exported pools on them.
    Using those disks will make existing pools on them unable to be imported.
    You will lose any and all data in selected disks.`,
  );
  exportedPoolsTooltip = this.translate.instant(
    `Some of the disks are attached to the exported pools
    mentioned in this list. Checking a pool name means you want to
    allow reallocation of the disks attached to that pool.`,
  );

  nonUniqueSerialDisks: UnusedDisk[] = [];
  nonUniqueSerialDisksTooltip: string;

  disksWithExportedPools: UnusedDisk[] = [];
  exportedPoolsOptions$ = of<Option[]>([]);
  poolAndDisks = new Map<string, string[]>();

  allowNonUniqueSerialDisksOptions$: Observable<Option<boolean>[]> = of([
    { label: this.translate.instant('Allow'), value: true },
    { label: this.translate.instant('Don\'t Allow'), value: false },
  ]);

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private store: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.initUnsafeDisksWarnings();
    this.connectWarningsToStore();
  }

  checkboxChanged(event: MatCheckboxChange): void {
    let allowExportedPools = [...this.form.controls.allowExportedPools.value];

    if (event.checked) {
      allowExportedPools = [...allowExportedPools, event.source.value];
    } else {
      allowExportedPools = allowExportedPools.filter((pool) => pool !== event.source.value);
    }
    this.form.patchValue({ allowExportedPools });
  }

  private initUnsafeDisksWarnings(): void {
    this.store.allDisks$.pipe(untilDestroyed(this)).subscribe((allDisks) => {
      this.nonUniqueSerialDisks = allDisks.filter(hasNonUniqueSerial);
      this.disksWithExportedPools = allDisks.filter(hasExportedPool);

      this.setNonUniqueSerialDisksWarning();
      this.setExportedPoolOptions();
      this.cdr.markForCheck();
    });
  }

  private setNonUniqueSerialDisksWarning(): void {
    if (this.nonUniqueSerialDisks.every((disk) => disk.bus === DiskBus.Usb)) {
      this.nonUniqueSerialDisksTooltip = this.translate.instant(
        `Warning: There are {n} USB disks available that have non-unique serial numbers.
          USB controllers may report disk serial incorrectly, making such disks indistinguishable from each other.
          Adding such disks to a pool can result in lost data.`,
        { n: this.nonUniqueSerialDisks.length },
      );
      return;
    }

    this.nonUniqueSerialDisksTooltip = this.translate.instant(
      `Warning: There are {n} disks available that have non-unique serial numbers.
        Non-unique serial numbers can be caused by a cabling issue and
        adding such disks to a pool can result in lost data.`,
      { n: this.nonUniqueSerialDisks.length },
    );
  }

  private setExportedPoolOptions(): void {
    const exportedPools = this.disksWithExportedPools.map((disk) => disk.exported_zpool);
    const options = _.uniq(exportedPools).map((pool) => {
      this.poolAndDisks.set(pool, this.getDiskNamesByPool(pool));
      return { label: pool, value: pool };
    });
    this.exportedPoolsOptions$ = of(options);
  }

  private getDiskNamesByPool(pool: string): string[] {
    return this.disksWithExportedPools.filter((item) => item.exported_zpool === pool).map((item) => item.devname);
  }

  private connectWarningsToStore(): void {
    combineLatest([
      this.form.controls.allowExportedPools.valueChanges.pipe(startWith([])),
      this.form.controls.allowNonUniqueSerialDisks.valueChanges.pipe(startWith(false)),
    ]).pipe(untilDestroyed(this)).subscribe(([allowExportedPools, allowNonUniqueSerialDisks]) => {
      this.store.setDiskWarningOptions({
        allowExportedPools,
        allowNonUniqueSerialDisks,
      });
    });
  }
}
