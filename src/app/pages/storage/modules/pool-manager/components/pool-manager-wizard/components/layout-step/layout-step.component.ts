import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnInit, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  PoolManagerStore,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { AutomatedDiskSelectionComponent } from './automated-disk-selection/automated-disk-selection.component';
import { CustomLayoutAppliedComponent } from './custom-layout-applied/custom-layout-applied.component';

@UntilDestroy()
@Component({
  selector: 'ix-layout-step',
  templateUrl: './layout-step.component.html',
  styleUrls: ['./layout-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AutomatedDiskSelectionComponent, CustomLayoutAppliedComponent],
})
export class LayoutStepComponent implements OnInit {
  private store = inject(PoolManagerStore);
  private cdr = inject(ChangeDetectorRef);

  readonly isStepActive = input<boolean>(false);
  readonly type = input.required<VDevType>();
  readonly description = input<string>();

  readonly canChangeLayout = input(false);
  readonly limitLayouts = input<CreateVdevLayout[]>([]);

  readonly inventory = input<DetailsDisk[]>([]);

  protected topologyCategory: PoolManagerTopologyCategory;

  ngOnInit(): void {
    this.connectToStore();
  }

  private connectToStore(): void {
    this.store.state$.pipe(untilDestroyed(this)).subscribe(({ topology }) => {
      this.topologyCategory = topology[this.type()];
      this.cdr.markForCheck();
    });
  }
}
