import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, output, inject,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { TranslateModule } from '@ngx-translate/core';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-spare-wizard-step',
  templateUrl: './spare-wizard-step.component.html',
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
export class SpareWizardStepComponent {
  private store = inject(PoolManagerStore);

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected readonly vDevType = VDevType;
  protected readonly helptext = helptextPoolCreation;

  protected readonly inventory$ = this.store.getInventoryForStep(VDevType.Spare);
  protected allowedLayouts = [CreateVdevLayout.Stripe];

  protected goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  protected resetStep(): void {
    this.store.resetStep(VDevType.Spare);
  }
}
