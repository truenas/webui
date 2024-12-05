import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-dedup-wizard-step',
  templateUrl: './dedup-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
export class DedupWizardStepComponent {
  readonly isStepActive = input<boolean>();
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  canChangeLayout = true;

  protected readonly VdevType = VdevType;
  readonly helptext = helptextManager;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Dedup);
  protected allowedLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];

  constructor(
    private store: PoolManagerStore,
  ) {}

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Dedup);
  }
}
