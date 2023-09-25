import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { merge, of } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreateVdevLayout, vdevLayoutOptions, VdevType } from 'app/enums/v-dev-type.enum';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { hasDeepChanges, setValueIfNotSame } from 'app/pages/storage/modules/pool-manager/utils/form.utils';
import { isDraidLayout } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@UntilDestroy()
@Component({
  selector: 'ix-automated-disk-selection',
  templateUrl: './automated-disk-selection.component.html',
  styleUrls: ['./automated-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomatedDiskSelectionComponent implements OnChanges {
  @Input() isStepActive: boolean;
  @Input() type: VdevType;
  @Input() inventory: UnusedDisk[] = [];
  @Input() canChangeLayout = false;
  @Input() limitLayouts: CreateVdevLayout[] = [];

  readonly layoutControl = new FormControl(null as CreateVdevLayout, Validators.required);

  get isDataVdev(): boolean {
    return this.type === VdevType.Data;
  }

  get dataLayoutTooltip(): string {
    if (this.isDataVdev) {
      return 'Read only field: The layout of this device has been preselected to match the layout of the existing Data devices in the pool';
    }
  }

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

  private updateStoreOnChanges(): void {
    this.layoutControl.valueChanges.pipe(untilDestroyed(this)).subscribe((layout) => {
      this.store.setTopologyCategoryLayout(this.type, layout);
    });
  }

  private listenForResetEvents(): void {
    merge(
      this.store.startOver$,
      this.store.resetStep$.pipe(filter((vdevType) => vdevType === this.type)),
    )
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.layoutControl.setValue(this.canChangeLayout ? null : this.limitLayouts[0]);
      });
  }

  private updateLayoutOptionsFromLimitedLayouts(limitLayouts: CreateVdevLayout[]): void {
    const allowedLayouts = vdevLayoutOptions.filter((option) => limitLayouts.includes(option.value));
    this.vdevLayoutOptions$ = of(allowedLayouts);
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-boolean-literal-compare
    const cannotChangeLayout = this.canChangeLayout === false;
    if (cannotChangeLayout && limitLayouts.length) {
      setValueIfNotSame(this.layoutControl, limitLayouts[0]);
    }
  }
}
