import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit, output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { helptextManager } from 'app/helptext/storage/volumes/manager/manager';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataWizardStepComponent implements OnInit {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;

  readonly goToLastStep = output();

  canChangeLayout = true;

  protected readonly VdevType = VdevType;
  readonly helptext = helptextManager;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Special);
  protected allowedLayouts = [CreateVdevLayout.Mirror, CreateVdevLayout.Stripe];

  constructor(
    private addVdevsStore: AddVdevsStore,
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Special);
  }

  ngOnInit(): void {
    this.addVdevsStore.pool$.pipe(
      map((pool) => pool?.topology[VdevType.Special]),
      untilDestroyed(this),
    ).subscribe((metadataTopology) => {
      if (!metadataTopology?.length) {
        return;
      }
      // TODO: Similar code in poolTopologyToStoreTopology
      let type = metadataTopology[0].type;
      if (type === TopologyItemType.Disk && !metadataTopology[0].children.length) {
        type = TopologyItemType.Stripe;
      }
      this.allowedLayouts = [type] as unknown as CreateVdevLayout[];
      this.canChangeLayout = false;
      this.cdr.markForCheck();
    });
  }
}
