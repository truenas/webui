import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { generateOptionsRange } from 'app/helpers/options.helper';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { DiskSizeSelectsComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/automated-disk-selection/disk-size-selects/disk-size-selects.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import {
  hasDeepChanges,
  setValueIfNotSame,
  unsetControlIfNoMatchingOption,
} from 'app/pages/storage/modules/pool-manager/utils/form.utils';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';

@UntilDestroy()
@Component({
  selector: 'ix-normal-selection',
  templateUrl: './normal-selection.component.html',
  styleUrls: ['./normal-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DiskSizeSelectsComponent,
    IxSelectComponent,
    TestOverrideDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class NormalSelectionComponent implements OnInit, OnChanges {
  readonly type = input.required<VdevType>();
  readonly layout = input.required<CreateVdevLayout>();
  readonly isStepActive = input<boolean>();
  readonly inventory = input.required<DetailsDisk[]>();

  form = this.formBuilder.group({
    width: [{ value: null as number, disabled: true }, Validators.required],
    vdevsNumber: [{ value: null as number, disabled: true }, Validators.required],
  });

  protected widthOptions$ = of<SelectOption[]>([]);
  protected numberOptions$ = of<SelectOption[]>([]);

  private selectedDisks: DetailsDisk[] = [];

  constructor(
    private formBuilder: FormBuilder,
    protected store: PoolManagerStore,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (hasDeepChanges(changes, 'inventory') || hasDeepChanges(changes, 'layout')) {
      this.updateWidthOptions();
    }
  }

  ngOnInit(): void {
    this.updateControlOptionsOnChanges();
    this.updateStoreOnChanges();
    this.listenForResetEvents();
  }

  protected isNumberOfVdevsLimitedToOne = computed(() => {
    return this.type() === VdevType.Spare || this.type() === VdevType.Cache || this.type() === VdevType.Log;
  });

  protected onDisksSelected(disks: DetailsDisk[]): void {
    this.selectedDisks = disks;
    this.updateWidthOptions();
    this.updateDisabledStatuses();
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type())),
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

      this.store.setAutomaticTopologyCategory(this.type(), {
        width: values.width,
        vdevsNumber: this.isNumberOfVdevsLimitedToOne() ? 1 : values.vdevsNumber,
      });
    });
  }

  private updateWidthOptions(): void {
    const availableDisks = this.selectedDisks.length;
    if (!availableDisks) {
      return;
    }
    const minRequired = minDisksPerLayout[this.layout()];
    let nextOptions: Option[] = [];

    if (availableDisks && minRequired && availableDisks >= minRequired) {
      nextOptions = generateOptionsRange(minRequired, availableDisks);
    }

    this.widthOptions$ = of(nextOptions);

    unsetControlIfNoMatchingOption(this.form.controls.width, nextOptions);

    if (nextOptions.length === 1 && this.isStepActive()) {
      setValueIfNotSame(this.form.controls.width, Number(nextOptions[0].value));
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

    if (nextOptions.length === 1 && this.isStepActive()) {
      setValueIfNotSame(this.form.controls.vdevsNumber, Number(nextOptions[0].value));
    }
  }
}
