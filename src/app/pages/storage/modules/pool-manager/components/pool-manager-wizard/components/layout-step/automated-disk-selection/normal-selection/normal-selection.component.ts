import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { generateOptionsRange } from 'app/helpers/options.helper';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { unsetControlIfNoMatchingOption } from 'app/pages/storage/modules/pool-manager/utils/form.utils';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

@UntilDestroy()
@Component({
  selector: 'ix-normal-selection',
  templateUrl: './normal-selection.component.html',
  styleUrls: ['./normal-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NormalSelectionComponent implements OnInit, OnChanges {
  @Input() type: VdevType;
  @Input() layout: CreateVdevLayout;
  @Input() isStepActive: boolean;
  @Input() inventory: UnusedDisk[];

  // TODO: Consider moving to a service.
  @Output() manualSelectionClicked = new EventEmitter<void>();

  form = this.formBuilder.group({
    width: [{ value: null as number, disabled: true }, Validators.required],
    vdevsNumber: [{ value: null as number, disabled: true }, Validators.required],
  });

  protected widthOptions$ = of<SelectOption[]>([]);
  protected numberOptions$ = of<SelectOption[]>([]);

  private selectedDisks: UnusedDisk[] = [];

  constructor(
    private formBuilder: FormBuilder,
    private store: PoolManagerStore,
  ) {}

  openManualDiskSelection(): void {
    this.manualSelectionClicked.emit();
  }

  ngOnInit(): void {
    this.updateControlOptionsOnChanges();
    this.updateStoreOnChanges();
    this.listenForResetEvents();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.layout) {
      this.updateWidthOptions();
    }
  }

  get isSpareVdev(): boolean {
    return this.type === VdevType.Spare;
  }

  protected onDisksSelected(disks: UnusedDisk[]): void {
    this.selectedDisks = disks;
    this.updateWidthOptions();
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
          width: null,
          vdevsNumber: null,
        });
      });
  }

  private updateDisabledStatuses(): void {
    const fields = ['width', 'vdevsNumber'] as const;
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
      this.updateNumberOptions();
    });
  }

  private updateStoreOnChanges(): void {
    this.form.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      const values = this.form.value;

      this.store.setAutomaticTopologyCategory(this.type, {
        width: values.width,
        vdevsNumber: values.vdevsNumber,
      });
    });
  }

  private updateWidthOptions(): void {
    const availableDisks = this.selectedDisks.length;
    if (!availableDisks) {
      return;
    }
    const minRequired = minDisksPerLayout[this.layout];
    let nextOptions: Option[] = [];

    if (availableDisks && minRequired && availableDisks >= minRequired) {
      nextOptions = generateOptionsRange(minRequired, availableDisks);
    }

    this.widthOptions$ = of(nextOptions);

    unsetControlIfNoMatchingOption(this.form.controls.width, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.width.setValue(+nextOptions[0].value, { emitEvent: false });
    }

    this.updateNumberOptions();
  }

  private updateNumberOptions(): void {
    const availableDisks = this.selectedDisks.length;
    if (!availableDisks) {
      return;
    }

    const width = this.form.controls.width.value;
    let nextOptions: Option[] = [];

    if (width) {
      const maxNumber = Math.floor(availableDisks / width);
      nextOptions = generateOptionsRange(1, maxNumber);
    }

    this.numberOptions$ = of(nextOptions);

    unsetControlIfNoMatchingOption(this.form.controls.vdevsNumber, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive) {
      this.form.controls.vdevsNumber.setValue(+nextOptions[0].value, { emitEvent: false });
    }
  }
}
