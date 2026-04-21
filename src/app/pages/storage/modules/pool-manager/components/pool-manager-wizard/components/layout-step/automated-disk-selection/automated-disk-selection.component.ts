import { ChangeDetectionStrategy, Component, DestroyRef, computed, input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
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
  protected store = inject(PoolManagerStore);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly isStepActive = input<boolean>(false);
  readonly type = input<VDevType>();
  readonly inventory = input<DetailsDisk[]>([]);
  readonly canChangeLayout = input(false);
  readonly limitLayouts = input<CreateVdevLayout[]>([]);

  readonly layoutControl = new FormControl(null as CreateVdevLayout | null, Validators.required);

  protected isDataVdev = computed(() => {
    return this.type() === VDevType.Data;
  });

  protected isMetadataVdev = computed(() => {
    return this.type() === VDevType.Special;
  });

  protected isDedupVdev = computed(() => {
    return this.type() === VDevType.Dedup;
  });

  protected requiresDataParity = computed(() => {
    return this.isMetadataVdev() || this.isDedupVdev();
  });

  protected dataLayoutTooltip = computed(() => {
    if (this.isDataVdev()) {
      return this.translate.instant('Read only field: The layout of this device has been preselected to match the layout of the existing Data devices in the pool');
    }

    return '';
  });

  protected layoutRestrictionHint = computed(() => {
    if (!this.requiresDataParity()) {
      return '';
    }

    return this.translate.instant(
      'Special and deduplication vdevs must use the same layout as the data vdevs so the pool keeps consistent redundancy. dRAID layouts are not available for these vdev types.',
    );
  });

  protected vdevLayoutOptions$ = of<SelectOption<CreateVdevLayout>[]>([]);

  constructor() {
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

  private updateStoreOnChanges(): void {
    this.store.isLoading$
      .pipe(filter((isLoading) => !isLoading), take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
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
    this.layoutControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((layout) => {
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
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const limitLayouts = this.limitLayouts();
        const hasSingleChoice = limitLayouts.length === 1;
        const shouldPreselect = !this.canChangeLayout() || hasSingleChoice;
        this.layoutControl.setValue(shouldPreselect ? limitLayouts[0] : null);
      });
  }

  private updateLayoutOptionsFromLimitedLayouts(limitLayouts: CreateVdevLayout[]): void {
    const allowedLayouts = vdevLayoutOptions.filter((option) => limitLayouts.includes(option.value));
    this.vdevLayoutOptions$ = of(allowedLayouts);
    if (!limitLayouts.length) {
      return;
    }
    const cannotChangeLayout = this.canChangeLayout() === false;
    const hasSingleChoice = limitLayouts.length === 1;
    if (cannotChangeLayout || hasSingleChoice) {
      setValueIfNotSame(this.layoutControl, limitLayouts[0]);
    }
  }
}
