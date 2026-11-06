import {
  ChangeDetectionStrategy, Component, input, output, inject,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnStepperNextDirective,
  TnStepperPreviousDirective,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { helptextPoolCreation } from 'app/helptext/storage/volumes/pool-creation/pool-creation';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { parityLock } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
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
export class MetadataWizardStepComponent {
  private addVdevsStore = inject(AddVdevsStore);
  private store = inject(PoolManagerStore);

  readonly isStepActive = input<boolean>(false);
  readonly stepWarning = input<string | null>();

  readonly goToLastStep = output();

  protected readonly vDevType = VDevType;
  protected readonly helptext = helptextPoolCreation;

  protected readonly inventory = this.store.getInventoryForStep(VDevType.Special);
  protected readonly parityLock = parityLock(this.addVdevsStore.pool, this.store.topology);

  protected goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  protected resetStep(): void {
    this.store.resetStep(VDevType.Special);
  }
}
