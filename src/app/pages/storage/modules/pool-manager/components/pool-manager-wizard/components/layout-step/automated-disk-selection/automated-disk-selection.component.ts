import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import _ from 'lodash';
import { distinctUntilChanged, of, take } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout, vdevLayoutOptions, VdevType } from 'app/enums/v-dev-type.enum';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { DiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/interfaces/disk-type-size-map.interface';
import { SizeAndType } from 'app/pages/storage/modules/pool-manager/interfaces/size-and-type.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { getDiskTypeSizeMap } from 'app/pages/storage/modules/pool-manager/utils/get-disk-type-size-map.utils';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

@UntilDestroy()
@Component({
  selector: 'ix-automated-disk-selection',
  templateUrl: './automated-disk-selection.component.html',
  styleUrls: ['./automated-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomatedDiskSelectionComponent implements OnInit, OnChanges {
  @Input() type: VdevType;
  @Input() inventory: UnusedDisk[] = [];
  @Input() canChangeLayout = false;
  @Input() limitLayouts: CreateVdevLayout[] = [];

  @Output() manualSelectionClicked = new EventEmitter<void>();

  form = this.formBuilder.group({
    layout: [CreateVdevLayout.Stripe, Validators.required],
    sizeAndType: [[null, null] as SizeAndType, Validators.required],
    width: [{ value: null as number, disabled: true }, Validators.required],
    treatDiskSizeAsMinimum: [{ value: false, disabled: true }],
    vdevsNumber: [{ value: null as number, disabled: true }, Validators.required],
  });

  protected compareSizeAndTypeWith = _.isEqual;

  protected vdevLayoutOptions$ = of<SelectOption<CreateVdevLayout>[]>([]);
  protected diskSizeAndTypeOptions$ = of<SelectOption[]>([]);
  protected widthOptions$ = of<SelectOption[]>([]);
  protected numberOptions$ = of<SelectOption[]>([]);

  private minDisks = minDisksPerLayout;
  private sizeDisksMap: DiskTypeSizeMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };

  constructor(
    private formBuilder: FormBuilder,
    protected poolManagerStore: PoolManagerStore,
  ) {}

  get selectedDiskSize(): number {
    return this.form.controls.sizeAndType.value?.[0];
  }

  get isSizeSelected(): boolean {
    return !!this.form.value.sizeAndType?.length
      && !!this.form.value.sizeAndType[0]
      && !!this.form.value.sizeAndType[1];
  }

  get isLayoutSelected(): boolean {
    return !!this.form.value.layout;
  }

  get isWidthSelected(): boolean {
    return !!this.form.value.width;
  }

  get selectedDiskType(): DiskType {
    return this.form.controls.sizeAndType.value?.[1];
  }

  ngOnInit(): void {
    this.initControls();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (
      changes.limitLayouts?.currentValue
      && !_.isEqual(changes.limitLayouts.currentValue, changes.limitLayouts.previousValue)
    ) {
      this.updateLayoutOptionsFromLimitedLayouts(changes.limitLayouts.currentValue);
    }
    if (
      changes.inventory?.currentValue
      && !_.isEqual(changes.inventory.currentValue, changes.inventory.previousValue)
    ) {
      this.updateDiskSizeOptions();
    }
  }

  updateLayoutOptionsFromLimitedLayouts(limitLayouts: CreateVdevLayout[]): void {
    this.vdevLayoutOptions$ = of(
      limitLayouts.map(
        (layout) => ({
          label: Object.keys(CreateVdevLayout)[Object.values(CreateVdevLayout).indexOf(layout)],
          value: layout,
        }),
      ),
    );
    const isChangeLayoutFalse = this.canChangeLayout !== null
      && this.canChangeLayout !== undefined
      && !this.canChangeLayout;
    const isValueSame = limitLayouts[0] === this.form.controls.layout.value;
    if (isChangeLayoutFalse && limitLayouts.length && !isValueSame) {
      this.form.controls.layout.setValue(limitLayouts[0]);
    }
    this.updateWidthOptions();
  }

  openManualDiskSelection(): void {
    this.manualSelectionClicked.emit();
  }

  /**
   * Dependency between selects as follows:
   * size -> layout -> width -> number
   */
  private initControls(): void {
    this.form.controls.layout.valueChanges.pipe(
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((layout) => {
      if (this.isSizeSelected && !!layout) {
        if (this.form.controls.width.disabled) {
          this.form.controls.width.enable();
        }
        if (this.form.controls.treatDiskSizeAsMinimum.disabled) {
          this.form.controls.treatDiskSizeAsMinimum.enable();
        }
        if (this.isWidthSelected && this.form.controls.vdevsNumber.disabled) {
          this.form.controls.vdevsNumber.enable();
        }
      }

      this.updateWidthOptions();
    });

    this.form.controls.sizeAndType.valueChanges.pipe(
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((sizeAndType) => {
      if (sizeAndType?.length && this.isLayoutSelected) {
        if (this.form.controls.width.disabled) {
          this.form.controls.width.enable();
        }
        if (this.form.controls.treatDiskSizeAsMinimum.disabled) {
          this.form.controls.treatDiskSizeAsMinimum.enable();
        }
        if (this.isWidthSelected && this.form.controls.vdevsNumber.disabled) {
          this.form.controls.vdevsNumber.enable();
        }
      }

      this.updateLayoutOptions();
    });

    this.form.controls.width.valueChanges.pipe(
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((width) => {
      if (this.isSizeSelected && this.isLayoutSelected && !!width && this.form.controls.vdevsNumber.disabled) {
        this.form.controls.vdevsNumber.enable();
      }
      this.updateNumberOptions();
    });

    this.form.controls.treatDiskSizeAsMinimum.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateWidthOptions();
    });

    this.form.valueChanges.pipe(
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.updateLayout();
    });
  }

  private updateLayout(): void {
    const values = this.form.value;
    this.poolManagerStore.setAutomaticTopologyCategory(this.type, {
      layout: values.layout,
      diskSize: this.selectedDiskSize,
      diskType: this.selectedDiskType,
      width: values.width,
      vdevsNumber: values.vdevsNumber,
      treatDiskSizeAsMinimum: values.treatDiskSizeAsMinimum,
    });
  }

  private updateLayoutOptions(): void {
    const layoutOptions = vdevLayoutOptions.filter((option) => {
      return this.inventory.length >= this.minDisks[option.value];
    });

    const isValueNull = this.form.controls.layout.value === null;
    if (!isValueNull && !layoutOptions.some((option) => option.value === this.form.controls.layout.value)) {
      this.form.controls.layout.setValue(null, { emitEvent: false });
    }
    this.poolManagerStore.getLayoutsForVdevType(this.type)
      .pipe(
        take(1),
        untilDestroyed(this),
      )
      .subscribe({
        next: (allowedVdevTypes) => {
          this.vdevLayoutOptions$ = of(layoutOptions.filter(
            (layout) => !!allowedVdevTypes.includes(layout.value),
          ));
          this.updateWidthOptions();
        },
      });
  }

  private updateDiskSizeOptions(): void {
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

    const options = [...hddOptions, ...ssdOptions].sort((a, b) => a.value[0] - b.value[0]);

    this.diskSizeAndTypeOptions$ = of(options);

    this.updateLayoutOptions();
  }

  private getNumberOfSuitableDisks(): number {
    if (!this.form.controls.treatDiskSizeAsMinimum.value) {
      return this.sizeDisksMap[this.selectedDiskType][this.selectedDiskSize]?.length;
    }

    return this.inventory.filter((disk) => disk.size >= this.selectedDiskSize).length;
  }

  private updateWidthOptions(): void {
    if (!this.selectedDiskType || !this.selectedDiskSize) {
      return;
    }
    const length = this.getNumberOfSuitableDisks();
    const minRequired = this.minDisks[this.form.controls.layout.value];
    let widthOptions: Option[];

    if (length && minRequired) {
      widthOptions = _.range(minRequired, length + 1).map((item) => ({
        label: `${item}`,
        value: item,
      }));
    } else {
      widthOptions = [];
    }

    const isValueNull = this.form.controls.width.value === null;
    if (!isValueNull && !widthOptions.some((option) => option.value === this.form.controls.width.value)) {
      this.form.controls.width.setValue(null, { emitEvent: false });
    }
    this.widthOptions$ = of(widthOptions);

    this.updateNumberOptions();
  }

  private updateNumberOptions(): void {
    if (!this.selectedDiskType || !this.selectedDiskSize) {
      return;
    }

    const width = this.form.controls.width.value;
    const length = this.getNumberOfSuitableDisks();
    let nextNumberOptions: SelectOption[] = [];

    if (width && length) {
      const maxNumber = Math.floor(length / width);
      nextNumberOptions = Array.from({ length: maxNumber }).map((value, index) => ({
        label: `${index + 1}`,
        value: index + 1,
      }));
    } else {
      nextNumberOptions = [];
    }

    const isValueNull = this.form.controls.vdevsNumber.value === null;
    if (!isValueNull && !nextNumberOptions.some((option) => option.value === this.form.controls.vdevsNumber.value)) {
      this.form.controls.vdevsNumber.setValue(null, { emitEvent: false });
    }

    this.numberOptions$ = of(nextNumberOptions);
  }
}
