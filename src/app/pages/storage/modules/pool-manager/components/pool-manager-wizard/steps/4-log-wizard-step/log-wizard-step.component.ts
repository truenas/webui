import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-log-wizard-step',
  templateUrl: './log-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogWizardStepComponent implements OnInit {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;
  @Output() goToLastStep = new EventEmitter<void>();

  canChangeLayout = true;

  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

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
