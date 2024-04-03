import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { poolManagerElements } from 'app/pages/storage/modules/pool-manager/components/pool-manager/pool-manager.elements';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager',
  templateUrl: './pool-manager.component.html',
  styleUrls: ['./pool-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerComponent {
  protected hasConfigurationPreview = true;
  protected readonly searchableElements = poolManagerElements;

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }
}
