import { ChangeDetectionStrategy, Component } from '@angular/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataWizardStepComponent {
  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Spare);

  constructor(
    private store: PoolManagerStore,
  ) {}
}
