import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-cache-wizard-step',
  templateUrl: './cache-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CacheWizardStepComponent {
  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Spare);

  protected allowedLayouts = [CreateVdevLayout.Stripe];

  constructor(
    private store: PoolManagerStore,
  ) {}
}
