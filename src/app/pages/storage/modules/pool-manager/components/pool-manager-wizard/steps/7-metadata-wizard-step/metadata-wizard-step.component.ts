import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataWizardStepComponent {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;
  @Output() goToLastStep = new EventEmitter<void>();

  canChangeLayout = true;

  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Special);
  protected allowedLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];

  constructor(
    private store: PoolManagerStore,
  ) {}

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Special);
  }
}
