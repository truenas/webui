import {
  ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { FormGroup } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { DiskType } from 'app/enums/disk-type.enum';
import {
  CreateVdevLayout, VdevType, vdevTypeLabels,
} from 'app/enums/v-dev-type.enum';
// todo replace helptext with another solution
import helptext from 'app/helptext/storage/volumes/manager/manager';
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

  disknumError: string = null;
  disknumErrorMessage = helptext.manager_disknumErrorMessage;
  disknumErrorConfirmMessage = helptext.manager_disknumErrorConfirmMessage;
  disknumExtendConfirmMessage = helptext.manager_disknumExtendConfirmMessage;

  vdevtypeError: string = null;
  vdevtypeErrorMessage = helptext.manager_vdevtypeErrorMessage;

  stripeVdevTypeError: string = null;
  logVdevTypeWarning: string = null;
  firstDataVdevType: string;
  hasSavableErrors = false;
  vdevdisksError = false;
  hasVdevDiskSizeError = false;
  canDuplicate = false;
  firstDataVdevDisknum = 0;
  firstDataVdevDisksize: number;
  firstDataVdevDisktype: DiskType;

  constructor(
    private matDialog: MatDialog,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
    public translate: TranslateService,
  ) {}

  get errorsCount(): number {
    let result = 0;

    Object.keys(this.wizardRequiredStepsStateForm.controls).forEach((key) => {
      const control = this.wizardRequiredStepsStateForm.controls[key as PoolCreationWizardRequiredStep];
      if (!control.value && control.hasValidator(Validators.required)) {
        result += 1;
      }
    });

    [this.disknumError, this.vdevtypeError, this.stripeVdevTypeError, this.logVdevTypeWarning].forEach((error) => {
      if (error) {
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
      this.checkAndGenerateErrors();

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

  checkAndGenerateErrors(): void {
    this.nonEmptyTopologyCategories.forEach(([typologyCategoryType, typologyCategory], i) => {
      let dataVdevDisknum = 0;
      let dataVdevType: string;
      this.disknumError = null;
      this.vdevtypeError = null;
      this.vdevdisksError = false;
      this.stripeVdevTypeError = null;
      this.logVdevTypeWarning = null;
      this.hasVdevDiskSizeError = false;
      this.hasSavableErrors = false;

      if (typologyCategoryType === VdevType.Data) {
        if (i === 0) {
          this.firstDataVdevType = typologyCategory.layout;
          dataVdevType = typologyCategory.layout;

          if (typologyCategory.vdevs.length > 0) {
            this.firstDataVdevDisknum = typologyCategory.vdevs.length;
            this.firstDataVdevDisksize = typologyCategory.vdevs[0][0].size;
            this.firstDataVdevDisktype = typologyCategory.vdevs[0][0].type;
            this.canDuplicate = true;
          } else {
            this.firstDataVdevDisknum = 0;
            this.firstDataVdevDisksize = null;
            this.firstDataVdevDisktype = null;
            this.canDuplicate = false;
          }
        }

        if (typologyCategory.vdevs.length > 0) {
          dataVdevDisknum = typologyCategory.vdevs.length;
          dataVdevType = typologyCategory.layout;
        } else {
          dataVdevDisknum = 0;
        }

        if (dataVdevDisknum > 0) {
          if (dataVdevDisknum !== this.firstDataVdevDisknum && this.firstDataVdevType !== CreateVdevLayout.Stripe) {
            this.getDiskNumErrorMsg(dataVdevDisknum);
          }
          if (dataVdevType !== this.firstDataVdevType) {
            this.getVdevTypeErrorMsg(dataVdevType);
          }
        }
      }

      if (
        [VdevType.Dedup, VdevType.Log, VdevType.Special, VdevType.Data].includes(typologyCategoryType)
        && typologyCategory.vdevs.length >= 1 && typologyCategory.layout === CreateVdevLayout.Stripe
      ) {
        if (typologyCategoryType === VdevType.Log) {
          this.getLogVdevTypeWarningMsg();
        } else {
          this.getStripeVdevTypeErrorMsg(typologyCategoryType);
        }

        this.hasSavableErrors = true;
      }
    });
  }

  private getDiskNumErrorMsg(disks: number): void {
    this.disknumError = `${this.translate.instant(this.disknumErrorMessage)} ${this.translate.instant('First vdev has {n} disks, new vdev has {m}', { n: this.firstDataVdevDisknum, m: disks })}`;
  }

  private getVdevTypeErrorMsg(type: string): void {
    this.vdevtypeError = `${this.translate.instant(this.vdevtypeErrorMessage)} ${this.translate.instant('First vdev is a {vdevType}, new vdev is {newVdevType}', { vdevType: this.firstDataVdevType, newVdevType: type })}`;
  }

  private getStripeVdevTypeErrorMsg(group: string): void {
    const vdevType = group === 'special' ? 'metadata' : group;
    this.stripeVdevTypeError = this.translate.instant('A stripe {vdevType} vdev is highly discouraged and will result in data loss if it fails', { vdevType });
  }

  private getLogVdevTypeWarningMsg(): void {
    this.logVdevTypeWarning = this.translate.instant('A stripe log vdev may result in data loss if it fails combined with a power outage.');
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
