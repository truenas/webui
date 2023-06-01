import { ChangeDetectionStrategy, Component } from '@angular/core';
import { map } from 'rxjs/operators';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-data-wizard-step',
  templateUrl: './data-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataWizardStepComponent {
  protected readonly VdevType = VdevType;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Data);
  protected readonly hasDataVdevs$ = this.store.topology$.pipe(
    map((topology) => topology[VdevType.Data].vdevs.length > 0),
  );
  protected allowedLayouts = Object.values(CreateVdevLayout);

  readonly helptext = helptext;

  constructor(
    private store: PoolManagerStore,
  ) {}
}
