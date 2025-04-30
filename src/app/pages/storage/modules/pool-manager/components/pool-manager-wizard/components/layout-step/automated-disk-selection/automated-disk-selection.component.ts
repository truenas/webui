import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges,
} from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { merge, of } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { CreateVdevLayout, vdevLayoutOptions, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestOverrideDirective } from 'app/modules/test-id/test-override/test-override.directive';
import { TranslateOptionsPipe } from 'app/modules/translate/translate-options/translate-options.pipe';
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
  imports: [
    IxSelectComponent,
    TestOverrideDirective,
    ReactiveFormsModule,
    IxInputComponent,
    DraidSelectionComponent,
    NormalSelectionComponent,
    TranslateModule,
    CastPipe,
    TranslateOptionsPipe,
  ],
})
export class AutomatedDiskSelectionComponent implements OnChanges {
  readonly isStepActive = input<boolean>(false);
  readonly type = input<VDevType>();
  readonly inventory = input<DetailsDisk[]>([]);
  readonly canChangeLayout = input(false);
  readonly limitLayouts = input<CreateVdevLayout[]>([]);

  readonly layoutControl = new FormControl(null as CreateVdevLayout | null, Validators.required);

  protected isDataVdev = computed(() => {
    return this.type() === VDevType.Data;
  });

  protected dataLayoutTooltip = computed(() => {
    if (this.isDataVdev()) {
      return this.translate.instant('Read only field: The layout of this device has been preselected to match the layout of the existing Data devices in the pool');
    }

    return '';
  });

  protected vdevLayoutOptions$ = of<SelectOption<CreateVdevLayout>[]>([]);

  constructor(
    protected store: PoolManagerStore,
    private translate: TranslateService,
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
    return !!this.layoutControl.value && isDraidLayout(this.layoutControl.value);
  }

  protected isMetadataVdev = computed(() => {
    return this.type() === VDevType.Special;
  });

  private updateStoreOnChanges(): void {
    this.store.isLoading$.pipe(filter((isLoading) => !isLoading), take(1), untilDestroyed(this)).subscribe({
      next: () => {
        const type = this.type();
        if (
          (!this.canChangeLayout() && !this.isDataVdev())
          && (type && this.limitLayouts().length)
        ) {
          this.store.setTopologyCategoryLayout(type, this.limitLayouts()[0]);
        }
      },
    });
    this.layoutControl.valueChanges.pipe(untilDestroyed(this)).subscribe((layout) => {
      if (!layout) {
        return;
      }
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
