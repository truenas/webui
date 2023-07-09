import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager',
  templateUrl: './pool-manager.component.html',
  styleUrls: ['./pool-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerComponent {
  @Input() isAddingVdevs = false;
  protected hasConfigurationPreview = true;

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }
}
