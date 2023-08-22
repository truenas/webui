import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { merge, of, take } from 'rxjs';
import { filter } from 'rxjs/operators';
import { CreateVdevLayout, vdevLayoutOptions, VdevType } from 'app/enums/v-dev-type.enum';
import { SelectOption } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { minDisksPerLayout } from 'app/pages/storage/modules/pool-manager/utils/min-disks-per-layout.constant';
import { isDraidLayout } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

// TODO: Is this component useless?
@UntilDestroy()
@Component({
  selector: 'ix-automated-disk-selection',
  templateUrl: './automated-disk-selection.component.html',
  styleUrls: ['./automated-disk-selection.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomatedDiskSelectionComponent implements OnInit, OnChanges {
  @Input() isStepActive: boolean;
  @Input() type: VdevType;
  @Input() inventory: UnusedDisk[] = [];
  @Input() canChangeLayout = false;
  @Input() limitLayouts: CreateVdevLayout[] = [];

  @Output() manualSelectionClicked = new EventEmitter<void>();

  readonly layoutControl = new FormControl(null as CreateVdevLayout, Validators.required);

  protected vdevLayoutOptions$ = of<SelectOption<CreateVdevLayout>[]>([]);

  private minDisks = minDisksPerLayout;

  constructor(
    protected store: PoolManagerStore,
  ) {}

  protected get usesDraidLayout(): boolean {
    return isDraidLayout(this.layoutControl.value);
  }

  ngOnInit(): void {
    this.updateStoreOnChanges();
    this.listenForResetEvents();
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
        this.layoutControl.setValue(null);
      });
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (
      changes.limitLayouts?.currentValue
      && !_.isEqual(changes.limitLayouts.currentValue, changes.limitLayouts.previousValue)
    ) {
      this.updateLayoutOptionsFromLimitedLayouts(changes.limitLayouts.currentValue);
    }
  }

  private updateLayoutOptionsFromLimitedLayouts(limitLayouts: CreateVdevLayout[]): void {
    const allowedLayouts = vdevLayoutOptions.filter((option) => limitLayouts.includes(option.value));
    this.vdevLayoutOptions$ = of(allowedLayouts);
    const isChangeLayoutFalse = this.canChangeLayout !== null
      && this.canChangeLayout !== undefined
      && !this.canChangeLayout;
    const isValueSame = limitLayouts[0] === this.layoutControl.value;
    if (isChangeLayoutFalse && limitLayouts.length && !isValueSame) {
      this.layoutControl.setValue(limitLayouts[0]);
    }
  }

  private updateLayoutOptions(): void {
    // TODO: Do something about it
    const layoutOptions = vdevLayoutOptions.filter((option) => {
      return this.inventory.length >= this.minDisks[option.value];
    });

    const isValueNull = this.layoutControl.value === null;
    if (!isValueNull && !layoutOptions.some((option) => option.value === this.layoutControl.value)) {
      this.layoutControl.setValue(null, { emitEvent: false });
    }
    this.store.getLayoutsForVdevType(this.type)
      .pipe(
        take(1),
        untilDestroyed(this),
      )
      .subscribe({
        next: (allowedVdevTypes) => {
          this.vdevLayoutOptions$ = of(layoutOptions.filter(
            (layout) => !!allowedVdevTypes.includes(layout.value),
          ));
        },
      });
  }
}
