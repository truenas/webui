import { AsyncPipe, KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnCheckboxLabelDirective, TnFormFieldComponent,
} from '@truenas/ui-components';
import { uniq } from 'lodash-es';
import {
  of, Observable, combineLatest, startWith,
} from 'rxjs';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { TnRadioGroupComponent } from 'app/modules/forms/ix-forms/components/tn-radio-group/tn-radio-group.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { ignoreTranslation } from 'app/modules/translate/translate.helper';
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
    AsyncPipe,
    ReactiveFormsModule,
    WarningComponent,
    TnFormFieldComponent,
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

  protected checkboxChanged(pool: string, event: boolean | Event): void {
    // TEMP (NAS-141021): library defect in the pinned @truenas/ui-components (0.3.26) — indexed
    // in the tn-migration playbook's "Known upstream defects" table. tn-checkbox emits a boolean
    // from its `change` output, but the inner <input>'s native `change` event also bubbles to the
    // host, and Ivy invokes a `(change)` binding for both the output and the DOM event — so the
    // handler fires a second time with an Event. Only act on the component's boolean emission.
    // Fixed upstream in 0.4.x, which calls `stopPropagation()` in `onCheckboxChange` (tn-radio
    // already did); drop this guard once the dependency range moves past 0.4.0.
    if (typeof event !== 'boolean') {
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
    ]).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(([allowExportedPools, allowNonUniqueSerialDisks]) => {
      this.store.setDiskWarningOptions({
        allowExportedPools,
        allowNonUniqueSerialDisks,
      });
    });
  }
}
