import {
  ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-metadata-wizard-step',
  templateUrl: './metadata-wizard-step.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MetadataWizardStepComponent implements OnInit {
  @Output() goToLastStep = new EventEmitter<void>();
  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Special);
  protected readonly hasDataVdevs$ = this.store.topology$.pipe(
    map((topology) => topology[VdevType.Data].vdevs.length > 0),
  );
  protected allowedLayouts: CreateVdevLayout[] = [];

  constructor(
    private store: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.store.select((state) => state.topology[VdevType.Data].layout)?.pipe(untilDestroyed(this)).subscribe({
      next: (dataLayout: CreateVdevLayout) => {
        this.allowedLayouts = [dataLayout];
      },
    });
  }

  goToReviewStep(): void {
    this.goToLastStep.emit();
  }
}
