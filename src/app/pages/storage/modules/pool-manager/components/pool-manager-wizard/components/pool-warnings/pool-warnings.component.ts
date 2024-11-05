import { KeyValuePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import {
  of, Observable, combineLatest, startWith,
} from 'rxjs';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { getNonUniqueSerialDisksWarning } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasNonUniqueSerial, hasExportedPool } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

@UntilDestroy()
@Component({
  selector: 'ix-pool-warnings',
  templateUrl: './pool-warnings.component.html',
  styleUrls: ['./pool-warnings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    WarningComponent,
    IxRadioGroupComponent,
    IxLabelComponent,
    MatCheckbox,
    TestDirective,
    TranslateModule,
    KeyValuePipe,
  ],
})
export class PoolWarningsComponent implements OnInit {
  protected form = this.formBuilder.group({
    allowNonUniqueSerialDisks: [false],
    allowExportedPools: [[] as string[]],
  });

  exportedPoolsWarning = this.translate.instant(helptextManager.manager_exportedDisksWarning);

  nonUniqueSerialDisks: DetailsDisk[] = [];
  nonUniqueSerialDisksTooltip: string;

  disksWithExportedPools: DetailsDisk[] = [];
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
    private diskStore: DiskStore,
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
    this.diskStore.selectableDisks$.pipe(untilDestroyed(this)).subscribe((allDisks) => {
      this.nonUniqueSerialDisks = allDisks.filter(hasNonUniqueSerial);
      this.disksWithExportedPools = allDisks.filter(hasExportedPool);

      this.setNonUniqueSerialDisksWarning();
      this.setExportedPoolOptions();
      this.cdr.markForCheck();
    });
  }

  private setNonUniqueSerialDisksWarning(): void {
    this.nonUniqueSerialDisksTooltip = getNonUniqueSerialDisksWarning(this.nonUniqueSerialDisks, this.translate);
  }

  private setExportedPoolOptions(): void {
    const exportedPools = this.disksWithExportedPools.map((disk) => disk.exported_zpool);
    const options = uniq(exportedPools).map((pool) => {
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
