import {
  ChangeDetectionStrategy, Component, Input, output,
} from '@angular/core';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-spare-wizard-step',
  templateUrl: './spare-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpareWizardStepComponent {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;

  readonly goToLastStep = output();

  protected readonly VdevType = VdevType;
  readonly helptext = helptextManager;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Spare);
  protected allowedLayouts = [CreateVdevLayout.Stripe];

  constructor(
    private store: PoolManagerStore,
  ) {}

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Spare);
  }
}
