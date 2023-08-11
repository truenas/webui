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
import { of } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { generateOptionsRange } from 'app/helpers/options.helper';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
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
    this.setControlRelations();
    this.updateStoreOnChanges();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.layout) {
      this.updateWidthOptions();
    }
  }

  protected onDisksSelected(disks: UnusedDisk[]): void {
    this.selectedDisks = disks;
    this.updateWidthOptions();
  }

  private setControlRelations(): void {

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

  /**
   * Dependency between selects as follows:
   * size -> layout -> width -> number
   */
  private initControls(): void {
    // this.form.controls.layout.valueChanges.pipe(
    //   distinctUntilChanged(),
    //   untilDestroyed(this),
    // ).subscribe((layout) => {
    //   if (this.isSizeSelected && !!layout) {
    //     if (this.form.controls.width.disabled) {
    //       this.form.controls.width.enable();
    //     }
    //     if (this.isWidthSelected && this.form.controls.vdevsNumber.disabled) {
    //       this.form.controls.vdevsNumber.enable();
    //     }
    //   }
    // });
    //
    // this.form.controls.sizeAndType.valueChanges.pipe(
    //   distinctUntilChanged(),
    //   untilDestroyed(this),
    // ).subscribe((sizeAndType) => {
    //   if (sizeAndType?.length && this.isLayoutSelected) {
    //     if (this.form.controls.width.disabled) {
    //       this.form.controls.width.enable();
    //     }
    //     if (this.isWidthSelected && this.form.controls.vdevsNumber.disabled) {
    //       this.form.controls.vdevsNumber.enable();
    //     }
    //   }
    // });
    //
    // this.form.controls.width.valueChanges.pipe(
    //   distinctUntilChanged(),
    //   untilDestroyed(this),
    // ).subscribe((width) => {
    //   if (this.isSizeSelected && this.isLayoutSelected && !!width && this.form.controls.vdevsNumber.disabled) {
    //     this.form.controls.vdevsNumber.enable();
    //   }
    //   this.updateNumberOptions();
    // });
  }

  private updateWidthOptions(): void {
    const availableDisks = this.selectedDisks.length;
    if (!availableDisks) {
      return;
    }
    const minRequired = minDisksPerLayout[this.layout];
    let widthOptions: Option[];

    if (availableDisks && minRequired && availableDisks >= minRequired) {
      widthOptions = generateOptionsRange(minRequired, availableDisks);
    } else {
      widthOptions = [];
    }

    this.widthOptions$ = of(widthOptions);
    const isValueNull = this.form.controls.width.value === null;

    if (!isValueNull && !widthOptions.some((option) => option.value === this.form.controls.width.value)) {
      this.form.controls.width.setValue(null, { emitEvent: false });
    }

    if (widthOptions.length === 1 && this.isStepActive) {
      this.form.controls.width.setValue(+widthOptions[0].value, { emitEvent: false });
    }

    this.updateNumberOptions();
  }

  private updateNumberOptions(): void {
    const availableDisks = this.selectedDisks.length;
    if (!availableDisks) {
      return;
    }

    const width = this.form.controls.width.value;
    let nextNumberOptions: SelectOption[];

    if (width && availableDisks) {
      const maxNumber = Math.floor(availableDisks / width);
      nextNumberOptions = generateOptionsRange(1, maxNumber);
    } else {
      nextNumberOptions = [];
    }

    this.numberOptions$ = of(nextNumberOptions);
    const isValueNull = this.form.controls.vdevsNumber.value === null;

    if (!isValueNull && !nextNumberOptions.some((option) => option.value === this.form.controls.vdevsNumber.value)) {
      this.form.controls.vdevsNumber.setValue(null, { emitEvent: false });
    }

    if (nextNumberOptions.length === 1 && this.isStepActive) {
      this.form.controls.vdevsNumber.setValue(+nextNumberOptions[0].value, { emitEvent: false });
    }
  }
}
