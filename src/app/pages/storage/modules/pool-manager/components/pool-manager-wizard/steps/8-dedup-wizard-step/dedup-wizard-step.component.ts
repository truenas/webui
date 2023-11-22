import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-dedup-wizard-step',
  templateUrl: './dedup-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DedupWizardStepComponent {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;
  @Output() goToLastStep = new EventEmitter<void>();

  canChangeLayout = true;

  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

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
