import {
  ChangeDetectionStrategy, Component, EventEmitter, Output,
} from '@angular/core';
import { map } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-log-wizard-step',
  templateUrl: './log-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogWizardStepComponent {
  @Output() goToLastStep = new EventEmitter<void>();
  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Log);
  protected readonly hasDataVdevs$ = this.store.topology$.pipe(
    map((topology) => topology[VdevType.Data].vdevs.length > 0),
  );
  protected allowedLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];
  constructor(
    private store: PoolManagerStore,
  ) {}

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }
}
