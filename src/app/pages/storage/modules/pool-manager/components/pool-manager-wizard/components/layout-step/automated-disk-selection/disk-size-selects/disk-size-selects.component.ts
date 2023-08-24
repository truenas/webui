import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import _, { isEqual } from 'lodash';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { SizeAndType } from 'app/pages/storage/modules/pool-manager/interfaces/size-and-type.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasDeepChanges, setValueIfNotSame } from 'app/pages/storage/modules/pool-manager/utils/form.utils';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';

@UntilDestroy()
@Component({
  selector: 'ix-disk-size-dropdowns',
  templateUrl: './disk-size-selects.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskSizeSelectsComponent implements OnChanges {
  @Input({ required: true }) layout: CreateVdevLayout;
  @Input({ required: true }) type: VdevType;
  @Input({ required: true }) inventory: UnusedDisk[];
  @Input() isStepActive = false;
  @Output() disksSelected = new EventEmitter<UnusedDisk[]>();

  protected diskSizeAndTypeOptions$ = of<SelectOption[]>([]);

  protected sizeDisksMap: DiskTypeSizeMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };
  protected compareSizeAndTypeWith = _.isEqual;

  protected form = this.formBuilder.group({
    sizeAndType: [[null, null] as SizeAndType, Validators.required],
    treatDiskSizeAsMinimum: [{ value: false, disabled: true }],
  });

  constructor(
    private formBuilder: FormBuilder,
    private store: PoolManagerStore,
  ) {
    this.setControlRelations();
    this.updateStoreOnChanges();
    this.emitUpdatesOnChanges();
    this.listenForResetEvents();
  }

  get selectedDiskSize(): number {
    return this.form.controls.sizeAndType.value?.[0];
  }

  get selectedDiskType(): DiskType {
    return this.form.controls.sizeAndType.value?.[1];
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (hasDeepChanges(changes, 'inventory') || hasDeepChanges(changes, 'layout')) {
      this.updateOptions();
    }
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.form.setValue({
          sizeAndType: [null, null],
          treatDiskSizeAsMinimum: false,
        });
      });
  }

  private setControlRelations(): void {
    this.form.controls.sizeAndType
      .valueChanges
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.form.controls.treatDiskSizeAsMinimum.enable();
      });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const values = this.form.value;

      this.store.setTopologyCategoryDiskSizes(this.type, {
        diskSize: this.selectedDiskSize,
        diskType: this.selectedDiskType,
        treatDiskSizeAsMinimum: values.treatDiskSizeAsMinimum,
      });
    });
  }

  private updateOptions(): void {
    this.sizeDisksMap = getDiskTypeSizeMap(this.inventory);

    const hddOptions = Object.keys(this.sizeDisksMap[DiskType.Hdd])
      .map((size): SelectOption<SizeAndType> => ({
        label: `${filesize(Number(size), { standard: 'iec' })} (HDD)`,
        value: [Number(size), DiskType.Hdd],
      }));

    const ssdOptions = Object.keys(this.sizeDisksMap[DiskType.Ssd])
      .map((size): SelectOption<SizeAndType> => ({
        label: `${filesize(Number(size), { standard: 'iec' })} (SSD)`,
        value: [Number(size), DiskType.Ssd],
      }));

    const nextOptions = [...hddOptions, ...ssdOptions].sort((a, b) => a.value[0] - b.value[0]);

    this.diskSizeAndTypeOptions$ = of(nextOptions);

    if (!nextOptions.some((option) => isEqual(option.value, this.form.controls.sizeAndType.value))) {
      setValueIfNotSame(this.form.controls.sizeAndType, [null, null]);
    }

    if (nextOptions.length === 1 && this.isStepActive) {
      setValueIfNotSame(this.form.controls.sizeAndType, nextOptions[0].value);
    }
  }

  private emitUpdatesOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const suitableDisks = this.getSuitableDisks();
      this.disksSelected.emit(suitableDisks);
    });
  }

  private getSuitableDisks(): UnusedDisk[] {
    if (!this.selectedDiskSize) {
      return [];
    }

    if (!this.form.controls.treatDiskSizeAsMinimum.value) {
      return this.sizeDisksMap[this.selectedDiskType][this.selectedDiskSize];
    }

    return this.inventory.filter((disk) => disk.size >= this.selectedDiskSize);
  }
}
