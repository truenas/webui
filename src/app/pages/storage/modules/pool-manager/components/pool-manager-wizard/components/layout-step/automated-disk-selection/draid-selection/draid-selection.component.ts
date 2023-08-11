import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { generateOptionsRange } from 'app/helpers/options.helper';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { SizeAndType } from 'app/pages/storage/modules/pool-manager/interfaces/size-and-type.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

const parityDisksPerGroup = {
  [CreateVdevLayout.Draid1]: 1,
  [CreateVdevLayout.Draid2]: 2,
  [CreateVdevLayout.Draid3]: 3,
};

@UntilDestroy()
@Component({
  selector: 'ix-draid-selection',
  templateUrl: './draid-selection.component.html',
  styleUrls: ['./draid-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DraidSelectionComponent implements OnInit, OnChanges {
  @Input() type: VdevType;
  @Input() layout: CreateVdevLayout.Draid1 | CreateVdevLayout.Draid2 | CreateVdevLayout.Draid3;
  @Input() inventory: UnusedDisk[];
  @Input() isStepActive: boolean;

  readonly defaultDataDevicesPerGroup = 8;

  form = this.formBuilder.group({
    // TODO: Do I need it in the form?
    sizeAndType: [[null, null] as SizeAndType, Validators.required],
    treatDiskSizeAsMinimum: [{ value: false, disabled: true }],

    width: [null as number],
    dataDevicesPerGroup: [this.defaultDataDevicesPerGroup],
    spares: [0],

    vdevsNumber: [1],
  });

  protected dataDevicesPerGroupOptions$ = of<SelectOption[]>([]);
  protected sparesOptions$ = of<SelectOption[]>([]);
  protected vdevsNumberOptions$ = of<SelectOption[]>([]);
  protected widthOptions$ = of<SelectOption[]>([]);

  /**
   * Total number of disks to work with.
   */
  private selectedDisks: UnusedDisk[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private store: PoolManagerStore,
  ) {}

  get parityDevices(): number {
    return parityDisksPerGroup[this.layout];
  }

  ngOnInit(): void {
    this.updateControlOptionsOnChanges();
    this.updateStoreOnChanges();
  }

  ngOnChanges(): void {
    this.updateWidth();
    this.updateDisabledStatuses();
  }

  protected onDisksSelected(disks: UnusedDisk[]): void {
    this.selectedDisks = disks;
    this.updateDataDevicesPerGroupOptions();
    this.updateDisabledStatuses();
  }

  private updateDisabledStatuses(): void {
    const fields = ['dataDevicesPerGroup', 'width', 'spares', 'vdevsNumber'] as const;
    fields.forEach((field) => {
      if (this.selectedDisks.length) {
        this.form.controls[field].enable({ emitEvent: false });
      } else {
        this.form.controls[field].disable({ emitEvent: false });
      }
    });
  }

  private updateControlOptionsOnChanges(): void {
    this.form.controls.width.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateDataDevicesPerGroupOptions();
    });

    this.form.controls.dataDevicesPerGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateSparesOptions();
    });

    this.form.controls.spares.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateVdevsNumberOptions();
    });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const values = this.form.value;

      this.store.setAutomaticTopologyCategory(this.type, {
        width: values.width,
        draidDataDisks: values.dataDevicesPerGroup,
        draidSpareDisks: values.spares,
        vdevsNumber: values.vdevsNumber,
      });
    });
  }

  private updateWidth(): void {
    const maxPossibleWidth = this.selectedDisks.length;
    const minDisks = minDisksPerLayout[this.layout];

    let nextOptions: Option[] = [];
    if (maxPossibleWidth > minDisks) {
      nextOptions = generateOptionsRange(minDisks, maxPossibleWidth);
    }

    // TODO: Same code?
    if (!nextOptions.some((option) => option.value === this.form.controls.width.value)) {
      this.form.controls.width.setValue(null, { emitEvent: false });
    }

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.width.setValue(Number(nextOptions[0].value), { emitEvent: false });
    }

    this.widthOptions$ = of(nextOptions);
    this.updateDataDevicesPerGroupOptions();
    this.updateVdevsNumberOptions();
  }

  private updateDataDevicesPerGroupOptions(): void {
    const width = this.form.controls.width.value;
    const maxPossibleGroups = width - this.parityDevices;
    let nextOptions: Option[] = [];
    if (maxPossibleGroups) {
      nextOptions = generateOptionsRange(1, maxPossibleGroups);
    }

    // TODO: Same code?
    if (!nextOptions.some((option) => option.value === this.form.controls.dataDevicesPerGroup.value)) {
      this.form.controls.dataDevicesPerGroup.setValue(null, { emitEvent: false });
    }

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.dataDevicesPerGroup.setValue(Number(nextOptions[0].value), { emitEvent: false });
    }

    this.dataDevicesPerGroupOptions$ = of(nextOptions);
    this.updateSparesOptions();
  }

  private updateSparesOptions(): void {
    const width = this.form.controls.width.value;
    const dataDevicesPerGroup = this.form.controls.dataDevicesPerGroup.value;
    const maxPossibleSpares = width - dataDevicesPerGroup - this.parityDevices;
    let nextOptions: Option[] = [];
    if (maxPossibleSpares >= 0) {
      nextOptions = generateOptionsRange(0, maxPossibleSpares);
    }

    // TODO: Same code
    if (!nextOptions.some((option) => option.value === this.form.controls.spares.value)) {
      this.form.controls.spares.setValue(0, { emitEvent: false });
    }

    this.sparesOptions$ = of(nextOptions);

    this.updateVdevsNumberOptions();
  }

  private updateVdevsNumberOptions(): void {
    const width = this.form.controls.width.value;
    let maxPossibleVdevs = 0;
    if (width > 0) {
      maxPossibleVdevs = Math.floor(this.selectedDisks.length / width);
    }

    let nextOptions: Option[] = [];
    if (maxPossibleVdevs > 0) {
      nextOptions = generateOptionsRange(1, maxPossibleVdevs);
    }

    // TODO: Same code
    if (!nextOptions.some((option) => option.value === this.form.controls.vdevsNumber.value)) {
      this.form.controls.vdevsNumber.setValue(null, { emitEvent: false });
    }

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.vdevsNumber.setValue(Number(nextOptions[0].value), { emitEvent: false });
    }

    this.vdevsNumberOptions$ = of(nextOptions);
  }
}
