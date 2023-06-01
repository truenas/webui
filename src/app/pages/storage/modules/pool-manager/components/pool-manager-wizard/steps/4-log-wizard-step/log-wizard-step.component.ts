import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-log-wizard-step',
  templateUrl: './log-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogWizardStepComponent {
  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Log);

  protected allowedLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];
  constructor(
    private store: PoolManagerStore,
  ) {}
}
