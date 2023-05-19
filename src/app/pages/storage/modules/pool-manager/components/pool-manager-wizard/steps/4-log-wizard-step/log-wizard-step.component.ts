import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-log-wizard-step',
  templateUrl: './log-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogWizardStepComponent {
  protected readonly VdevType = VdevType;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Log);

  constructor(
    private store: PoolManagerStore,
  ) {}
}
