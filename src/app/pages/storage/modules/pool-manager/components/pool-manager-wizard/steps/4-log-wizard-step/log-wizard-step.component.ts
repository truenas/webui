import {
  ChangeDetectionStrategy, Component, computed, input, output, inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnStepperNextDirective,
  TnStepperPreviousDirective,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { resolveTopologyLayout } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

const logLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];

@Component({
  selector: 'ix-log-wizard-step',
  templateUrl: './log-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    LayoutStepComponent,
    FormActionsComponent,
    TnButtonComponent,
    TnStepperPreviousDirective,
    TnStepperNextDirective,
    TranslateModule,
  ],
})
export class LogWizardStepComponent {
  private store = inject(PoolManagerStore);
  private addVdevsStore = inject(AddVdevsStore);

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected readonly vDevType = VDevType;
  protected readonly helptext = helptextPoolCreation;

  protected readonly inventory = this.store.getInventoryForStep(VDevType.Log);

  // When adding to an existing pool that has log vdevs, new ones must use the same layout.
  private existingLayout = computed(() => resolveTopologyLayout(this.addVdevsStore.pool()?.topology[VDevType.Log]));
  protected allowedLayouts = computed(() => {
    const existingLayout = this.existingLayout();
    return existingLayout ? [existingLayout] : logLayouts;
  });

  protected canChangeLayout = computed(() => !this.existingLayout());

  protected goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  protected resetStep(): void {
    this.store.resetStep(VDevType.Log);
  }
}
