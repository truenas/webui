import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
  protected readonly VdevType = VdevType;
  readonly helptext = helptext;

  protected readonly inventory$ = this.store.getInventoryForStep(VdevType.Spare);

  protected allowedLayouts: CreateVdevLayout[] = [];

  constructor(
    private store: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.store.select((state) => state.topology[VdevType.Data].layout).pipe(untilDestroyed(this)).subscribe({
      next: (dataLayout: CreateVdevLayout) => {
        this.allowedLayouts = [dataLayout];
      },
    });
  }
}
