import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnCheckboxLabelDirective, TnFormFieldComponent, TnRadioComponent,
  TnRadioGroupComponent,
} from '@truenas/ui-components';
import { uniq } from 'lodash-es';
import { combineLatest, startWith } from 'rxjs';
import { translated } from 'app/helpers/translated.helper';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { isTnCheckboxChange } from 'app/modules/forms/ix-forms/utils/tn-checkbox-change.utils';
import { getNonUniqueSerialDisksWarning } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/pool-warnings/get-non-unique-serial-disks';
import { EncryptionType } from 'app/pages/storage/modules/pool-manager/enums/encryption-type.enum';
import { DiskStore } from 'app/pages/storage/modules/pool-manager/store/disk.store';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasNonUniqueSerial, hasExportedPool, isSedCapable } from 'app/pages/storage/modules/pool-manager/utils/disk.utils';

@Component({
  selector: 'ix-pool-warnings',
  templateUrl: './pool-warnings.component.html',
  styleUrls: ['./pool-warnings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    WarningComponent,
    TnFormFieldComponent,
    TnRadioComponent,
    TnRadioGroupComponent,
    IxLabelComponent,
    TnCheckboxComponent,
    TnCheckboxLabelDirective,
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
  private destroyRef = inject(DestroyRef);

  protected form = this.formBuilder.nonNullable.group({
    allowNonUniqueSerialDisks: [false],
    allowExportedPools: [[] as string[]],
  });

  // The key, not the resolved string — the template pipes it, so it re-translates on a language
  // switch instead of freezing at construction time.
  protected readonly exportedPoolsWarning = helptextPoolCreation.exportedDisksWarning;

  nonUniqueSerialDisks: DetailsDisk[] = [];
  nonUniqueSerialDisksTooltip: string;

  disksWithExportedPools: DetailsDisk[] = [];
  poolAndDisks = new Map<string, string[]>();

  // `translated`, not a plain field: the labels are composed in TypeScript rather than
  // piped in the template, so `instant()` alone would freeze them in whatever language was
  // active when the component was constructed.
  protected readonly allowNonUniqueSerialDisksOptions = translated<Option<boolean>[]>(
    (translate) => [
      { label: translate.instant('Allow'), value: true },
      { label: translate.instant('Don\'t Allow'), value: false },
    ],
  );

  ngOnInit(): void {
    this.initUnsafeDisksWarnings();
    this.connectWarningsToStore();
  }

  protected checkboxChanged(pool: string, event: boolean | Event): void {
    // Only act on the component's boolean emission — see the helper for why the handler is
    // invoked a second time with a DOM Event.
    if (!isTnCheckboxChange(event)) {
      return;
    }

    let allowExportedPools = [...this.form.controls.allowExportedPools.value];

    if (event) {
      allowExportedPools = [...allowExportedPools, pool];
    } else {
      allowExportedPools = allowExportedPools.filter((item) => item !== pool);
    }
    this.form.patchValue({ allowExportedPools });
  }

  private initUnsafeDisksWarnings(): void {
    combineLatest([
      this.diskStore.selectableDisks$,
      this.store.encryptionType$,
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([allDisks, encryptionType]) => {
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
    this.poolAndDisks.clear();
    const exportedPools = this.disksWithExportedPools
      .map((disk) => disk.exported_zpool)
      .filter((pool): pool is string => !!pool);
    uniq(exportedPools).forEach((pool) => {
      this.poolAndDisks.set(pool, this.getDiskNamesByPool(pool));
    });
    this.pruneAllowedExportedPools();
  }

  /**
   * Drops allowances for pools that no longer have a checkbox. The disk list is re-filtered
   * whenever the encryption type changes (SED keeps only SED-capable disks), so a pool the user
   * allowed can disappear from the form — and without this the store would keep being told to
   * allow a pool the user can neither see nor uncheck.
   */
  private pruneAllowedExportedPools(): void {
    const allowedPools = this.form.controls.allowExportedPools.value;
    const survivingPools = allowedPools.filter((pool) => this.poolAndDisks.has(pool));

    // Guarded so an unchanged list doesn't push a redundant update to the store.
    if (survivingPools.length !== allowedPools.length) {
      this.form.controls.allowExportedPools.setValue(survivingPools);
    }
  }

  private getDiskNamesByPool(pool: string): string[] {
    return this.disksWithExportedPools.filter((item) => item.exported_zpool === pool).map((item) => item.devname);
  }

  private connectWarningsToStore(): void {
    combineLatest([
      this.form.controls.allowExportedPools.valueChanges.pipe(startWith([])),
      this.form.controls.allowNonUniqueSerialDisks.valueChanges.pipe(startWith(false)),
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([allowExportedPools, allowNonUniqueSerialDisks]) => {
      this.store.setDiskWarningOptions({
        allowExportedPools,
        allowNonUniqueSerialDisks,
      });
    });
  }
}
