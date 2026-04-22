import { ChangeDetectionStrategy, Component, DestroyRef, computed, input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
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
  readonly limitLayouts = input<readonly CreateVdevLayout[]>([]);
  readonly minMirrorWidth = input<number>(2);

  readonly layoutControl = new FormControl(null as CreateVdevLayout | null, Validators.required);

  protected isDataVdev = computed(() => this.type() === VDevType.Data);

  protected requiresDataParity = computed(() => {
    const type = this.type();
    return type === VDevType.Special || type === VDevType.Dedup;
  });

  protected dataLayoutTooltip = computed(() => {
    if (this.isDataVdev()) {
      return this.translate.instant('Read only field: this Data VDEV\'s layout is locked to match the existing Data devices in the pool.');
    }

    return '';
  });

  /**
   * Explains the parity lock on special/dedup layout dropdowns. Rendered as a
   * mat-hint on the layout select so screen readers pick it up via the form
   * field's aria-describedby wiring.
   *   - No hint when the Stripe option is present (data has no redundancy, so
   *     there's no meaningful restriction to explain).
   *   - Exact-match copy when only one layout remains (pool already has vdevs
   *     in this category — we lock to that layout, not just its parity).
   *   - Parity-level copy otherwise (a 3-way mirror alongside RAIDZ2, etc.).
   */
  protected layoutRestrictionHint = computed(() => {
    if (!this.requiresDataParity()) {
      return '';
    }
    const layouts = this.limitLayouts();
    if (!layouts.length || layouts.includes(CreateVdevLayout.Stripe)) {
      return '';
    }
    if (layouts.length === 1) {
      return this.translate.instant(
        'Locked to this layout because the pool already has special or deduplication vdevs using it. dRAID layouts are not available for these vdev types.',
      );
    }
    return this.translate.instant(
      'Special and deduplication vdevs must tolerate at least as many drive failures as the data vdevs. dRAID layouts are not available for these vdev types.',
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
    // Start over wipes every category, so clear the control and let the
    // reactive parity-lock subscription re-apply the lock asynchronously if
    // data layout is still set. Reading limitLayouts here would observe the
    // pre-reset value (the store state update follows startOver$.next()).
    this.store.startOver$.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.layoutControl.setValue(null));

    // Reset-step only clears this category; re-apply the current lock so a
    // parity-locked step preserves its forced layout after the user resets it.
    this.store.resetStep$.pipe(
      filter((vdevType) => vdevType === this.type()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      const limitLayouts = this.limitLayouts();
      const hasSingleChoice = limitLayouts.length === 1;
      const shouldPreselect = !this.canChangeLayout() || hasSingleChoice;
      this.layoutControl.setValue(shouldPreselect ? limitLayouts[0] : null);
    });
  }

  private updateLayoutOptionsFromLimitedLayouts(limitLayouts: readonly CreateVdevLayout[]): void {
    const allowedLayouts = vdevLayoutOptions.filter((option) => limitLayouts.includes(option.value));
    this.vdevLayoutOptions$ = of(allowedLayouts);
    if (!limitLayouts.length) {
      return;
    }
    const cannotChangeLayout = this.canChangeLayout() === false;
    const hasSingleChoice = limitLayouts.length === 1;
    if (cannotChangeLayout || hasSingleChoice) {
      setValueIfNotSame(this.layoutControl, limitLayouts[0]);
      return;
    }
    // Data layout can change after the user picked a special/dedup layout
    // (e.g. data switches from RAIDZ1 to RAIDZ2 and our previous Stripe pick
    // is no longer permitted). Snap to the first still-valid option rather
    // than leaving the control on a stale selection that isn't in the menu.
    const currentValue = this.layoutControl.value;
    if (currentValue && !limitLayouts.includes(currentValue)) {
      setValueIfNotSame(this.layoutControl, limitLayouts[0]);
    }
  }
}
