import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges,
} from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { merge, of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CreateVdevLayout, vdevLayoutOptions, VdevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasDeepChanges, setValueIfNotSame } from 'app/pages/storage/modules/pool-manager/utils/form.utils';
import { isDraidLayout } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';
import { DraidSelectionComponent } from './draid-selection/draid-selection.component';
import { NormalSelectionComponent } from './normal-selection/normal-selection.component';

@UntilDestroy()
@Component({
  selector: 'ix-automated-disk-selection',
  templateUrl: './automated-disk-selection.component.html',
  styleUrls: ['./automated-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxSelectComponent,
    TestOverrideDirective,
    ReactiveFormsModule,
    IxInputComponent,
    DraidSelectionComponent,
    NormalSelectionComponent,
    TranslateModule,
    CastPipe,
  ],
})
export class AutomatedDiskSelectionComponent implements OnChanges {
  readonly isStepActive = input<boolean>();
  readonly type = input<VdevType>();
  readonly inventory = input<DetailsDisk[]>([]);
  readonly canChangeLayout = input(false);
  readonly limitLayouts = input<CreateVdevLayout[]>([]);

  readonly layoutControl = new FormControl(null as CreateVdevLayout, Validators.required);

  protected isDataVdev = computed(() => {
    return this.type() === VdevType.Data;
  });

  protected dataLayoutTooltip = computed(() => {
    if (this.isDataVdev()) {
      return 'Read only field: The layout of this device has been preselected to match the layout of the existing Data devices in the pool';
    }

    return '';
  });

  protected vdevLayoutOptions$ = of<SelectOption<CreateVdevLayout>[]>([]);

  constructor(
    protected store: PoolManagerStore,
  ) {
    this.updateStoreOnChanges();
    this.listenForResetEvents();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (hasDeepChanges(changes, 'limitLayouts')) {
      this.updateLayoutOptionsFromLimitedLayouts(changes.limitLayouts.currentValue);
    }
  }

  protected get usesDraidLayout(): boolean {
    return isDraidLayout(this.layoutControl.value);
  }

  protected isMetadataVdev = computed(() => {
    return this.type() === VdevType.Special;
  });

  private updateStoreOnChanges(): void {
    this.store.isLoading$.pipe(filter((isLoading) => !isLoading), take(1), untilDestroyed(this)).subscribe({
      next: () => {
        if (
          (!this.canChangeLayout() && !this.isDataVdev())
          && (this.type() && this.limitLayouts().length)
        ) {
          this.store.setTopologyCategoryLayout(this.type(), this.limitLayouts()[0]);
        }
      },
    });
    this.layoutControl.valueChanges.pipe(untilDestroyed(this)).subscribe((layout) => {
      this.store.setTopologyCategoryLayout(this.type(), layout);
    });
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type())),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.layoutControl.setValue(this.canChangeLayout() ? null : this.limitLayouts()[0]);
      });
  }

  private updateLayoutOptionsFromLimitedLayouts(limitLayouts: CreateVdevLayout[]): void {
    const allowedLayouts = vdevLayoutOptions.filter((option) => limitLayouts.includes(option.value));
    this.vdevLayoutOptions$ = of(allowedLayouts);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    const cannotChangeLayout = this.canChangeLayout() === false;
    if (cannotChangeLayout && limitLayouts.length) {
      setValueIfNotSame(this.layoutControl, limitLayouts[0]);
    }
  }
}
