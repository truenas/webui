import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, input, OnChanges, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnSelectComponent } from '@truenas/ui-components';
import { range } from 'lodash-es';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { generateOptionsRange } from 'app/helpers/options.helper';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { DiskSizeSelectsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  hasDeepChanges,
  setValueIfNotSame,
  unsetControlIfNoMatchingOption,
} from 'app/pages/storage/modules/pool-manager/utils/form.utils';

const parityDisksPerGroup = {
  [CreateVdevLayout.Draid1]: 1,
  [CreateVdevLayout.Draid2]: 2,
  [CreateVdevLayout.Draid3]: 3,
};

const maxDisksInDraidGroup = 255;

@Component({
  selector: 'ix-draid-selection',
  templateUrl: './draid-selection.component.html',
  styleUrls: ['./draid-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    DiskSizeSelectsComponent,
    TnFormFieldComponent,
    TnSelectComponent,
    TranslateModule,
  ],
})
export class DraidSelectionComponent implements OnInit, OnChanges {
  private formBuilder = inject(FormBuilder);
  private store = inject(PoolManagerStore);
  private destroyRef = inject(DestroyRef);

  protected readonly tnSelectLabels = tnSelectLabels;

  readonly type = input.required<VDevType>();
  readonly layout = input.required<CreateVdevLayout.Draid1 | CreateVdevLayout.Draid2 | CreateVdevLayout.Draid3>();
  readonly inventory = input<DetailsDisk[]>();
  readonly isStepActive = input<boolean>(false);

  readonly defaultDataDevicesPerGroup = 8;

  form = this.formBuilder.nonNullable.group({
    children: [null as number | null],
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
  private selectedDisks: DetailsDisk[] = [];

  readonly helptext = helptextPoolCreation;

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  get parityDevices(): number {
    return parityDisksPerGroup[this.layout()];
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (hasDeepChanges(changes, 'layout') || hasDeepChanges(changes, 'inventory')) {
      this.updateDataDevicesOptions();
      this.updateDisabledStatuses();
    }
  }

  ngOnInit(): void {
    this.updateControlOptionsOnChanges();
    this.updateStoreOnChanges();
    this.listenForResetEvents();
  }

  protected onDisksSelected(disks: DetailsDisk[]): void {
    this.selectedDisks = disks;
    this.updateDataDevicesOptions();
    this.updateChildrenOptions();
    this.updateDisabledStatuses();
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type())),
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.form.setValue({
          children: null,
          dataDevicesPerGroup: this.defaultDataDevicesPerGroup,
          spares: 0,
          vdevsNumber: 1,
        });

        // Restoring the declared defaults is only half a reset: they are starting values, not
        // necessarily *valid* ones. `tn-select` renders a value verbatim even when no option
        // matches it (`ix-select` used to blank exactly that state), so a reset that clears the
        // disk selection would otherwise leave every control showing its default over a
        // "No options" dropdown. Re-deriving the option lists here blanks whatever the current
        // disks don't support and keeps the defaults that they do.
        //
        // Done here rather than left to the disk-size child's own reset — which emits an empty
        // selection and re-enters through `onDisksSelected` — so the panel ends up consistent
        // whichever of the two reset subscribers the store notifies first.
        this.updateDataDevicesOptions();
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
    this.form.controls.dataDevicesPerGroup.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateSparesOptions();
    });

    this.form.controls.spares.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateChildrenOptions();
    });

    this.form.controls.children.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.updateVdevsNumberOptions();
    });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      const values = this.form.getRawValue();

      this.store.setAutomaticTopologyCategory(this.type(), {
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
      nextOptions = generateOptionsRange(2, maxPossibleGroups);
    }

    unsetControlIfNoMatchingOption(this.form.controls.dataDevicesPerGroup, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive()) {
      setValueIfNotSame(
        this.form.controls.dataDevicesPerGroup,
        Number(nextOptions[0].value),
      );
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

    if (!nextOptions.length) {
      // Nothing to fall back to — not even 0, which is only an option once the selected disks
      // can cover the parity and data devices. Blank the control rather than leaving its
      // declared default rendered over a "No options" dropdown, matching the sibling selects.
      unsetControlIfNoMatchingOption(this.form.controls.spares, nextOptions);
    } else if (!nextOptions.some((option) => option.value === this.form.controls.spares.value)) {
      setValueIfNotSame(
        this.form.controls.spares,
        0,
      );
    }

    this.sparesOptions$ = of(nextOptions);

    this.updateChildrenOptions();
  }

  private updateChildrenOptions(): void {
    const maxPossibleWidth = this.selectedDisks.length;
    const dataDevices = this.form.controls.dataDevicesPerGroup.value;
    const hotSpares = this.form.controls.spares.value;
    const groupSize = Math.min(dataDevices + this.parityDevices, maxDisksInDraidGroup);

    let nextOptions: Option[] = [];
    if ((groupSize + hotSpares) <= maxPossibleWidth && dataDevices) {
      nextOptions = range(groupSize + hotSpares, maxPossibleWidth + 1).map((noOfChildren) => {
        return {
          label: String(noOfChildren),
          value: noOfChildren,
        };
      });
    }

    unsetControlIfNoMatchingOption(this.form.controls.children, nextOptions);

    // Only default to the optimal width when there is one. With no disks selected
    // `maxPossibleWidth` is 0, and defaulting to it would leave a meaningless "Children: 0"
    // in the control — invisible with `ix-select` (which blanked a value that matched no
    // option) but rendered verbatim by `tn-select`. `unsetControlIfNoMatchingOption` above has
    // already blanked the control by then, so skipping the default leaves it empty.
    if (this.isStepActive() && maxPossibleWidth) {
      setValueIfNotSame(
        this.form.controls.children,
        maxPossibleWidth,
      );
    }

    this.widthOptions$ = of(nextOptions);
    this.updateVdevsNumberOptions();
  }

  private updateVdevsNumberOptions(): void {
    const width = Number(this.form.controls.children.value);
    let maxPossibleVdevs = 0;
    if (width > 0) {
      maxPossibleVdevs = Math.floor(this.selectedDisks.length / width);
    }

    let nextOptions: Option[] = [];
    if (maxPossibleVdevs > 0) {
      nextOptions = generateOptionsRange(1, maxPossibleVdevs);
    }

    unsetControlIfNoMatchingOption(this.form.controls.vdevsNumber, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive()) {
      setValueIfNotSame(
        this.form.controls.vdevsNumber,
        Number(nextOptions[0].value),
      );
    }

    this.vdevsNumberOptions$ = of(nextOptions);
  }
}
