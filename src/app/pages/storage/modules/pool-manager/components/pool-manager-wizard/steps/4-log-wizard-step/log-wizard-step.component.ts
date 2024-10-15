import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatStepperPrevious, MatStepperNext } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { map } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { LayoutStepComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/components/layout-step/layout-step.component';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-log-wizard-step',
  templateUrl: './log-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    LayoutStepComponent,
    FormActionsComponent,
    MatButton,
    MatStepperPrevious,
    TestDirective,
    MatStepperNext,
    TranslateModule,
    AsyncPipe,
  ],
})
export class LogWizardStepComponent implements OnInit {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;

  readonly goToLastStep = output();

  canChangeLayout = true;

  protected readonly VdevType = VdevType;
  readonly helptext = helptextManager;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Log);
  protected allowedLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];
  constructor(
    private store: PoolManagerStore,
    private addVdevsStore: AddVdevsStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.addVdevsStore.pool$.pipe(
      map((pool) => pool?.topology[VdevType.Log]),
      untilDestroyed(this),
    ).subscribe({
      next: (logTopology) => {
        if (!logTopology?.length) {
          return;
        }
        let type = logTopology[0].type;
        if (type === TopologyItemType.Disk && !logTopology[0].children.length) {
          type = TopologyItemType.Stripe;
        }
        this.allowedLayouts = [type] as unknown as CreateVdevLayout[];
        this.canChangeLayout = false;
        this.cdr.markForCheck();
      },
    });
  }

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Log);
  }
}
