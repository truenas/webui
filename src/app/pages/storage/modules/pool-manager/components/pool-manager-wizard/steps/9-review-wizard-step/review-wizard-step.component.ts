import {
  ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { VdevType, vdevTypeLabels } from 'app/enums/v-dev-type.enum';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import {
  InspectVdevsDialogComponent,
} from 'app/pages/storage/modules/pool-manager/components/inspect-vdevs-dialog/inspect-vdevs-dialog.component';
import { PoolCreationWizardRequiredStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';
import { PoolManagerWizardRequiredFormPartState } from 'app/pages/storage/modules/pool-manager/interfaces/pool-manager-wizard-form-state.interface';
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
  @Input() wizardRequiredStepsStateForm: FormGroup<PoolManagerWizardRequiredFormPartState>;
  @Output() createPool = new EventEmitter<void>();

  state: PoolManagerState;
  nonEmptyTopologyCategories: [VdevType, PoolManagerTopologyCategory][] = [];

  protected totalCapacity$ = this.store.totalUsableCapacity$;
  protected readonly vdevTypeLabels = vdevTypeLabels;

  constructor(
    private matDialog: MatDialog,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  get totalWarnings(): number {
    let result = 0;

    Object.keys(this.wizardRequiredStepsStateForm.controls).forEach((key) => {
      const control = this.wizardRequiredStepsStateForm.controls[key as PoolCreationWizardRequiredStep];
      if (!control.value && control.hasValidator(Validators.required)) {
        result += 1;
      }
    });

    return result;
  }

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
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.isStepActive.currentValue && !changes.isStepActive.previousValue) {
      Object.keys(this.wizardRequiredStepsStateForm.controls).forEach((key) => {
        const control = this.wizardRequiredStepsStateForm.controls[key as PoolCreationWizardRequiredStep];
        if (!control.value && control.hasValidator(Validators.required)) {
          control.patchValue(false);
        }
      });
      this.wizardRequiredStepsStateForm.updateValueAndValidity();
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
