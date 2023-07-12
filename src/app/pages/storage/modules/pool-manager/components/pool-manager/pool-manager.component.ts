import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { tap } from 'rxjs';
import { Pool } from 'app/interfaces/pool.interface';
import { AddVdevsStore } from 'app/pages/storage/modules/pool-manager/components/add-vdevs/store/add-vdevs-store.service';
import { PoolCreationWizardStep } from 'app/pages/storage/modules/pool-manager/enums/pool-creation-wizard-step.enum';

@UntilDestroy()
@Component({
  selector: 'ix-pool-manager',
  templateUrl: './pool-manager.component.html',
  styleUrls: ['./pool-manager.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolManagerComponent implements OnInit {
  protected hasConfigurationPreview = true;
  protected existingPool: Pool = null;

  constructor(
    private addVdevsStore: AddVdevsStore,
  ) { }

  ngOnInit(): void {
    this.addVdevsStore.pool$.pipe(
      tap((pool) => {
        this.existingPool = _.cloneDeep(pool);
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  onStepChanged(step: PoolCreationWizardStep): void {
    this.hasConfigurationPreview = step !== PoolCreationWizardStep.Review;
  }
}
