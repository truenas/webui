import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { CreateVdevLayout, TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import {
  AddVdevsStore,
} from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { parseDraidVdevName } from 'app/pages/storage/modules/pool-manager/utils/topology.utils';

@UntilDestroy()
@Component({
  selector: 'ix-data-wizard-step',
  templateUrl: './data-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataWizardStepComponent implements OnInit {
  @Input() isStepActive: boolean;
  @Input() stepWarning: string | null;
  @Output() goToLastStep = new EventEmitter<void>();

  protected readonly VdevType = VdevType;
  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Data);
  protected allowedLayouts = Object.values(CreateVdevLayout);
  readonly helptext = helptext;
  canChangeLayout = true;

  constructor(
    private store: PoolManagerStore,
    private addVdevsStore: AddVdevsStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.addVdevsStore.pool$.pipe(
      map((pool) => pool?.topology[VdevType.Data]),
      untilDestroyed(this),
    ).subscribe((dataTopology) => {
      if (!dataTopology?.length) {
        return;
      }
      // TODO: Similar code in poolTopologyToStoreTopology
      let type = dataTopology[0].type;
      if (type === TopologyItemType.Disk && !dataTopology[0].children.length) {
        type = TopologyItemType.Stripe;
      } else if (type === TopologyItemType.Draid) {
        const parsedVdevName = parseDraidVdevName(dataTopology[0].name);
        type = parsedVdevName.layout as unknown as TopologyItemType;
      }
      this.allowedLayouts = [type] as unknown as CreateVdevLayout[];
      this.canChangeLayout = false;
      this.cdr.markForCheck();
    });
  }

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }

  resetStep(): void {
    this.store.resetStep(VdevType.Data);
  }
}
