import { StepperSelectionEvent } from '@angular/cdk/stepper';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewChild,
} from '@angular/core';
import { MatStepper } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest, map } from 'rxjs';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { SystemGeneralService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager-wizard',
  templateUrl: './pool-manager-wizard.component.html',
  styleUrls: ['./pool-manager-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerWizardComponent implements OnInit {
  @ViewChild('stepper') stepper: MatStepper;
  isLoading$ = this.store.isLoading$;

  hasEnclosureStep$ = combineLatest([
    this.store.hasMultipleEnclosures$,
    this.systemService.isEnterprise$,
  ]);

  isCurrentFormValid = false;
  hasDataVdevs = false;

  constructor(
    private store: PoolManagerStore,
    private systemService: SystemGeneralService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.store.initialize();
  }

  stepChanged({ selectedIndex }: StepperSelectionEvent): void {
    if (selectedIndex === 2) {
      this.store.topology$.pipe(map((topology) => topology[VdevType.Data].vdevs.length > 0))
        .pipe(untilDestroyed(this))
        .subscribe((result) => {
          this.hasDataVdevs = result;
          this.stepValidityChanged(result);
        });
    }
  }

  goToLastStep(): void {
    this.stepper.selectedIndex = this.stepper.steps.length - 1;
    this.cdr.markForCheck();
  }

  stepValidityChanged(isValid: boolean): void {
    this.isCurrentFormValid = isValid;
  }

  createPool(): void { }
}
