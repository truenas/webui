import {
  ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs';
import { VdevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { PoolCreationSeverity } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-severity';
import { PoolCreationWizardRequiredStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import {
  PoolManagerState,
  PoolManagerStore,
  PoolManagerTopology, PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-review-wizard-step',
  templateUrl: './review-wizard-step.component.html',
  styleUrls: ['./review-wizard-step.component.scss'],
})
export class ReviewWizardStepComponent implements OnInit, OnChanges {
  @Input() isStepActive: boolean;
  @Output() createPool = new EventEmitter<void>();

  state: PoolManagerState;
  nonEmptyTopologyCategories: [VdevType, PoolManagerTopologyCategory][] = [];

  protected totalCapacity$ = this.store.totalUsableCapacity$;
  protected readonly vdevTypeLabels = vdevTypeLabels;
  protected readonly poolCreationSeverity = PoolCreationSeverity;

  poolCreationErrors$ = this.store.poolCreationErrors$;

  isCreateDisabled = false;

  constructor(
    private matDialog: MatDialog,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
    public translate: TranslateService,
  ) {}

  get hasVdevs(): boolean {
    return Object.keys(this.state.topology).some((type) => {
      return this.state.topology[type as VdevType].vdevs.length > 0;
    });
  }

  get limitToEnclosureName(): string {
    const limitToSingleEnclosure = this.state.enclosureSettings.limitToSingleEnclosure;
    if (limitToSingleEnclosure === null) {
      return undefined;
    }

    return this.state.enclosures.find((enclosure) => {
      return enclosure.number === this.state.enclosureSettings.limitToSingleEnclosure;
    }).name;
  }

  ngOnInit(): void {
    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.state = state;
      this.nonEmptyTopologyCategories = this.filterNonEmptyCategories(state.topology);
      this.cdr.markForCheck();
    });

    this.poolCreationErrors$.pipe(untilDestroyed(this)).subscribe((errors) => {
      this.isCreateDisabled = !!errors.filter((error) => error.severity === PoolCreationSeverity.Error).length;
    });
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isStepActive.currentValue && !changes.isStepActive.previousValue) {
      this.store.wizardRequiredStepsValidity$.pipe(take(1), untilDestroyed(this)).subscribe((steps) => {
        Object.keys(steps).forEach((step: PoolCreationWizardRequiredStep) => {
          const control = steps[step];
          if (!control.valid && control.required) {
            this.store.updateRequiredStepValidity(step, { valid: false });
          }
        });
      });
    }
  }

  onInspectVdevsPressed(): void {
    this.matDialog.open(InspectVdevsDialogComponent, {
      data: this.state.topology,
      panelClass: 'inspect-vdevs-dialog',
    });
  }

  private filterNonEmptyCategories(topology: PoolManagerTopology): [VdevType, PoolManagerTopologyCategory][] {
    return Object.keys(topology).reduce((acc, type) => {
      const category = topology[type as VdevType];
      if (category.vdevs.length > 0) {
        acc.push([type as VdevType, category]);
      }
      return acc;
    }, [] as [VdevType, PoolManagerTopologyCategory][]);
  }
}
