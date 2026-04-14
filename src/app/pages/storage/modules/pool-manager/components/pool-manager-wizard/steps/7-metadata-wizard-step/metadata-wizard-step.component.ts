import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, input, OnInit, output, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { existingVdevLayout, nonDraidLayouts } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    LayoutStepComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
    AsyncPipe,
  ],
})
export class MetadataWizardStepComponent implements OnInit {
  private addVdevsStore = inject(AddVdevsStore);
  private store = inject(PoolManagerStore);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected canChangeLayout = true;

  protected readonly vDevType = VDevType;
  readonly helptext = helptextPoolCreation;

  protected readonly inventory$ = this.store.getInventoryForStep(VDevType.Special);
  protected allowedLayouts: CreateVdevLayout[] = [...nonDraidLayouts];

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VDevType.Special);
  }

  ngOnInit(): void {
    this.addVdevsStore.pool$.pipe(
      map((pool) => existingVdevLayout(pool?.topology[VDevType.Special])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((layout) => {
      if (!layout) {
        return;
      }
      this.allowedLayouts = [layout];
      this.canChangeLayout = false;
      this.cdr.markForCheck();
    });
  }
}
