import {
  ChangeDetectionStrategy, Component, Input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { generateOptionsRange } from 'app/helpers/options.helper';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { unsetControlIfNoMatchingOption } from 'app/pages/storage/modules/pool-manager/utils/form.utils';

const parityDisksPerGroup = {
  [CreateVdevLayout.Draid1]: 1,
  [CreateVdevLayout.Draid2]: 2,
  [CreateVdevLayout.Draid3]: 3,
};

const maxDisksInDraidGroup = 255;

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
    children: [null as number],
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

  readonly helptext = helptext;

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
    this.listenForResetEvents();
  }

  ngOnChanges(): void {
    this.updateDataDevicesOptions();
    this.updateDisabledStatuses();
  }

  protected onDisksSelected(disks: UnusedDisk[]): void {
    this.selectedDisks = disks;
    this.updateDataDevicesOptions();
    this.updateChildrenOptions();
    this.updateDisabledStatuses();
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.form.setValue({
          children: null,
          dataDevicesPerGroup: this.defaultDataDevicesPerGroup,
          spares: 0,
          vdevsNumber: 1,
        });
      });
  }

  private updateDisabledStatuses(): void {
    const fields = ['dataDevicesPerGroup', 'children', 'spares', 'vdevsNumber'] as const;
    fields.forEach((field) => {
      if (this.selectedDisks.length) {
        this.form.controls[field].enable({ emitEvent: false });
      } else {
        this.form.controls[field].disable({ emitEvent: false });
      }
    });
  }

  private updateControlOptionsOnChanges(): void {
    this.form.controls.dataDevicesPerGroup.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateSparesOptions();
    });

    this.form.controls.spares.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateChildrenOptions();
    });

    this.form.controls.children.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateVdevsNumberOptions();
    });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const values = this.form.value;

      this.store.setAutomaticTopologyCategory(this.type, {
        width: values.children,
        draidDataDisks: values.dataDevicesPerGroup,
        draidSpareDisks: values.spares,
        vdevsNumber: values.vdevsNumber,
      });
    });
  }

  private updateDataDevicesOptions(): void {
    const maxPossibleGroups = this.selectedDisks.length - this.parityDevices;
    let nextOptions: Option[] = [];
    if (maxPossibleGroups) {
      nextOptions = generateOptionsRange(1, maxPossibleGroups);
    }

    unsetControlIfNoMatchingOption(this.form.controls.dataDevicesPerGroup, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.dataDevicesPerGroup.setValue(Number(nextOptions[0].value), { emitEvent: false });
    }

    this.dataDevicesPerGroupOptions$ = of(nextOptions);
    this.updateSparesOptions();
  }

  private updateSparesOptions(): void {
    const dataDevices = this.form.controls.dataDevicesPerGroup.value;
    const maxPossibleSpares = this.selectedDisks.length - dataDevices - this.parityDevices;
    let nextOptions: Option[] = [];
    if (maxPossibleSpares >= 0) {
      nextOptions = generateOptionsRange(0, maxPossibleSpares);
    }

    if (!nextOptions.some((option) => option.value === this.form.controls.spares.value)) {
      this.form.controls.spares.setValue(0, { emitEvent: false });
    }

    this.sparesOptions$ = of(nextOptions);

    this.updateChildrenOptions();
  }

  private updateChildrenOptions(): void {
    const maxPossibleWidth = this.selectedDisks.length;
    const dataDevices = this.form.controls.dataDevicesPerGroup.value;
    const hotSpares = this.form.controls.spares.value;
    const groupSize = Math.min(dataDevices + this.parityDevices, maxDisksInDraidGroup);
    const maxGroups = Math.floor((maxPossibleWidth - hotSpares) / groupSize);
    const optimalMaximum = maxGroups * groupSize + hotSpares;

    let nextOptions: Option[] = [];
    if ((groupSize + hotSpares) <= maxPossibleWidth && dataDevices) {
      nextOptions = _.range(1, maxGroups + 1).map((i) => {
        const disks = i * groupSize + hotSpares;
        return {
          label: String(disks),
          value: disks,
        };
      });

      if (maxPossibleWidth > optimalMaximum) {
        nextOptions.push({
          label: String(maxPossibleWidth),
          value: maxPossibleWidth,
        });
      }
    }

    unsetControlIfNoMatchingOption(this.form.controls.children, nextOptions);

    // TODO: Bug - this.form.controls.width.value is empty even if value is selected.
    if (this.isStepActive) {
      const hasOptimalOption = nextOptions.some((option) => option.value === optimalMaximum);
      if (nextOptions.length === 1) {
        // If there is one option, pick it.
        this.form.controls.children.setValue(Number(nextOptions[0].value), { emitEvent: false });
      } else if (hasOptimalOption) {
        // Or try to default to normal maximum number of groups and spares.
        this.form.controls.children.setValue(optimalMaximum, { emitEvent: false });
      }
    }

    this.widthOptions$ = of(nextOptions);
    this.updateVdevsNumberOptions();
  }

  private updateVdevsNumberOptions(): void {
    const width = this.form.controls.children.value;
    let maxPossibleVdevs = 0;
    if (width > 0) {
      maxPossibleVdevs = Math.floor(this.selectedDisks.length / width);
    }

    let nextOptions: Option[] = [];
    if (maxPossibleVdevs > 0) {
      nextOptions = generateOptionsRange(1, maxPossibleVdevs);
    }

    unsetControlIfNoMatchingOption(this.form.controls.vdevsNumber, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.vdevsNumber.setValue(Number(nextOptions[0].value), { emitEvent: false });
    }

    this.vdevsNumberOptions$ = of(nextOptions);
  }
}
