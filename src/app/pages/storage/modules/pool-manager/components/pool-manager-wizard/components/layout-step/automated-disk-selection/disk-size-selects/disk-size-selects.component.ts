import { ChangeDetectionStrategy, Component, DestroyRef, input, OnChanges, output, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnCheckboxComponent, TnFormFieldComponent, TnSelectComponent } from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import { merge } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { SizeAndType } from 'app/pages/storage/modules/pool-manager/interfaces/size-and-type.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasDeepChanges, setValueIfNotSame } from 'app/pages/storage/modules/pool-manager/utils/form.utils';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

@Component({
  selector: 'ix-disk-size-dropdowns',
  templateUrl: './disk-size-selects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class DiskSizeSelectsComponent implements OnChanges {
  private formBuilder = inject(FormBuilder);
  private store = inject(PoolManagerStore);
  private destroyRef = inject(DestroyRef);

  protected readonly tnSelectLabels = tnSelectLabels;

  readonly layout = input.required<CreateVdevLayout>();
  readonly type = input.required<VDevType>();
  readonly inventory = input.required<DetailsDisk[]>();
  readonly isStepActive = input(false);

  readonly disksSelected = output<DetailsDisk[]>();

  protected diskSizeAndTypeOptions = signal<SelectOption<SizeAndType>[]>([]);

  protected sizeDisksMap: DiskTypeSizeMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };
  protected compareSizeAndTypeWith = isEqual;

  protected canSelectLargerDisk = signal(false);

  // `null` — not an empty object — is the "nothing picked" value: tn-select only shows its
  // placeholder for a null value, and renders `String(value)` for anything else.
  protected form = this.formBuilder.nonNullable.group({
    sizeAndType: [null as SizeAndType | null, Validators.required],
    treatDiskSizeAsMinimum: [false],
  });

  constructor() {
    this.setControlRelations();
    this.updateStoreOnChanges();
    this.emitUpdatesOnChanges();
    this.listenForResetEvents();
  }

  // `null`, not `undefined`, for "nothing picked": the store holds `null` in an untouched
  // topology category and flags a category as changed on any non-deep-equal update, so
  // `undefined` here would reorder `categorySequence` on every inventory change.
  get selectedDiskSize(): number | null {
    return this.form.controls.sizeAndType.value?.size ?? null;
  }

  get selectedDiskType(): DiskType | null {
    return this.form.controls.sizeAndType.value?.type ?? null;
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (hasDeepChanges(changes, 'inventory') || hasDeepChanges(changes, 'layout')) {
      this.updateOptions();
    }
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type())),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.setValue({
          sizeAndType: null,
          treatDiskSizeAsMinimum: false,
        });
      });
  }

  private setControlRelations(): void {
    this.form.controls.sizeAndType
      .valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const canSelectLargerDisk = this.selectedDiskSize
          && this.inventory().some((disk) => disk.size > this.selectedDiskSize);

        this.canSelectLargerDisk.set(canSelectLargerDisk);
      });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const values = this.form.value;

      this.store.setTopologyCategoryDiskSizes(this.type(), {
        diskSize: this.selectedDiskSize,
        diskType: this.selectedDiskType,
        treatDiskSizeAsMinimum: values.treatDiskSizeAsMinimum,
      });
    });
  }

  private updateOptions(): void {
    this.sizeDisksMap = getDiskTypeSizeMap(this.inventory());

    const hddOptions = Object.keys(this.sizeDisksMap[DiskType.Hdd])
      .map((size): SelectOption<SizeAndType> => ({
        label: `${buildNormalizedFileSize(Number(size))} (HDD)`,
        value: { size: Number(size), type: DiskType.Hdd },
      }));

    const ssdOptions = Object.keys(this.sizeDisksMap[DiskType.Ssd])
      .map((size): SelectOption<SizeAndType> => ({
        label: `${buildNormalizedFileSize(Number(size))} (SSD)`,
        value: { size: Number(size), type: DiskType.Ssd },
      }));

    const nextOptions = [...hddOptions, ...ssdOptions].sort((a, b) => a.value.size - b.value.size);

    this.diskSizeAndTypeOptions.set(nextOptions);

    if (!nextOptions.some((option) => isEqual(option.value, this.form.controls.sizeAndType.value))) {
      // Unconditional (not `setValueIfNotSame`): the emission is load-bearing. It pushes
      // the freshly rebuilt size -> disks map downstream, so the store regenerates this
      // category's vdevs against the current disk objects. Without it the store's
      // identity check against `allowedDisks` sees stale objects and resets the step.
      //
      // It stays load-bearing when the value is *already* `null`, so do not add a
      // "only if something was picked" guard to skip the apparent no-op: every category
      // re-emits on an inventory change, and dropping the null ones makes
      // `unsetting-on-fewer-disks.spec.ts`'s "does not reset category if after changing
      // disks constraints there are still enough disks" case lose its Data topology.
      this.form.controls.sizeAndType.setValue(null);
    }

    if (nextOptions.length === 1 && this.isStepActive()) {
      setValueIfNotSame(this.form.controls.sizeAndType, nextOptions[0].value);
    }
  }

  private emitUpdatesOnChanges(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const suitableDisks = this.getSuitableDisks();
      this.disksSelected.emit(suitableDisks);
    });
  }

  private getSuitableDisks(): DetailsDisk[] {
    const selectedDiskSize = this.selectedDiskSize;
    const selectedDiskType = this.selectedDiskType;

    if (!selectedDiskSize || !selectedDiskType) {
      return [];
    }

    if (!this.form.controls.treatDiskSizeAsMinimum.value) {
      return this.sizeDisksMap[selectedDiskType][selectedDiskSize];
    }

    return this.inventory().filter((disk) => disk.size >= selectedDiskSize && disk.type === selectedDiskType);
  }
}
