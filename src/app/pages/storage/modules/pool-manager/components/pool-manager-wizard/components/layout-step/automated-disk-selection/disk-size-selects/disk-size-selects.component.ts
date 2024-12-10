import {
  ChangeDetectionStrategy, Component, input, OnChanges, output,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { isEqual } from 'lodash-es';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
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
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxSelectComponent,
    TestOverrideDirective,
    IxCheckboxComponent,
    TranslateModule,
  ],
})
export class DiskSizeSelectsComponent implements OnChanges {
  readonly layout = input.required<CreateVdevLayout>();
  readonly type = input.required<VdevType>();
  readonly inventory = input.required<DetailsDisk[]>();
  readonly isStepActive = input(false);

  readonly disksSelected = output<DetailsDisk[]>();

  protected diskSizeAndTypeOptions$ = of<SelectOption[]>([]);

  protected sizeDisksMap: DiskTypeSizeMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };
  protected compareSizeAndTypeWith = isEqual;

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
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type())),
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
        value: [Number(size), DiskType.Hdd],
      }));

    const ssdOptions = Object.keys(this.sizeDisksMap[DiskType.Ssd])
      .map((size): SelectOption<SizeAndType> => ({
        label: `${buildNormalizedFileSize(Number(size))} (SSD)`,
        value: [Number(size), DiskType.Ssd],
      }));

    const nextOptions = [...hddOptions, ...ssdOptions].sort((a, b) => a.value[0] - b.value[0]);

    this.diskSizeAndTypeOptions$ = of(nextOptions);

    if (!nextOptions.some((option) => isEqual(option.value, this.form.controls.sizeAndType.value))) {
      setValueIfNotSame(this.form.controls.sizeAndType, [null, null]);
    }

    if (nextOptions.length === 1 && this.isStepActive()) {
      setValueIfNotSame(this.form.controls.sizeAndType, nextOptions[0].value);
    }
  }

  private emitUpdatesOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const suitableDisks = this.getSuitableDisks();
      this.disksSelected.emit(suitableDisks);
    });
  }

  private getSuitableDisks(): DetailsDisk[] {
    if (!this.selectedDiskSize) {
      return [];
    }

    if (!this.form.controls.treatDiskSizeAsMinimum.value) {
      return this.sizeDisksMap[this.selectedDiskType][this.selectedDiskSize];
    }

    return this.inventory().filter((disk) => disk.size >= this.selectedDiskSize);
  }
}
