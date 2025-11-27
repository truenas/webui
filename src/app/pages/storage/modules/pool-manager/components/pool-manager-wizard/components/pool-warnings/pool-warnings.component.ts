import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxChange, MatCheckbox } from '@angular/material/checkbox';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import {
  of, Observable, combineLatest, startWith,
} from 'rxjs';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
import { getNonUniqueSerialDisksWarning } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasNonUniqueSerial, hasExportedPool, isSedCapable } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

@UntilDestroy()
@Component({
  selector: 'ix-pool-warnings',
  templateUrl: './pool-warnings.component.html',
  styleUrls: ['./pool-warnings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private formBuilder = inject(FormBuilder);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private store = inject(PoolManagerStore);
  private diskStore = inject(DiskStore);

  protected form = this.formBuilder.nonNullable.group({
    allowNonUniqueSerialDisks: [false],
    allowExportedPools: [[] as string[]],
  });

  exportedPoolsWarning = this.translate.instant(helptextPoolCreation.exportedDisksWarning);

  nonUniqueSerialDisks: DetailsDisk[] = [];
  nonUniqueSerialDisksTooltip: string;

  disksWithExportedPools: DetailsDisk[] = [];
  exportedPoolsOptions$ = of<Option[]>([]);
  poolAndDisks = new Map<string, string[]>();

  allowNonUniqueSerialDisksOptions$: Observable<Option<boolean>[]> = of([
    { label: this.translate.instant('Allow'), value: true },
    { label: this.translate.instant('Don\'t Allow'), value: false },
  ]);

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
    combineLatest([
      this.diskStore.selectableDisks$,
      this.store.encryptionType$,
    ]).pipe(untilDestroyed(this)).subscribe(([allDisks, encryptionType]) => {
      // Filter disks based on SED encryption requirement
      const filteredDisks = encryptionType === EncryptionType.Sed
        ? allDisks.filter(isSedCapable)
        : allDisks;

      this.nonUniqueSerialDisks = filteredDisks.filter(hasNonUniqueSerial);
      this.disksWithExportedPools = filteredDisks.filter(hasExportedPool);

      this.setNonUniqueSerialDisksWarning();
      this.setExportedPoolOptions();
      this.cdr.markForCheck();
    });
  }

  private setNonUniqueSerialDisksWarning(): void {
    this.nonUniqueSerialDisksTooltip = getNonUniqueSerialDisksWarning(this.nonUniqueSerialDisks, this.translate);
  }

  private setExportedPoolOptions(): void {
    const exportedPools = this.disksWithExportedPools
      .map((disk) => disk.exported_zpool)
      .filter((pool): pool is string => !!pool);
    const options = uniq(exportedPools).map((pool) => {
      this.poolAndDisks.set(pool, this.getDiskNamesByPool(pool));
      return { label: ignoreTranslation(pool), value: pool };
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
