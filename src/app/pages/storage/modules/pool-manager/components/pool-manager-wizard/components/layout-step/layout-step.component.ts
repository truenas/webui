import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
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
  standalone: true,
  imports: [AutomatedDiskSelectionComponent, CustomLayoutAppliedComponent],
})
export class LayoutStepComponent implements OnInit {
  readonly isStepActive = input<boolean>();
  readonly type = input.required<VdevType>();
  readonly description = input<string>();

  readonly canChangeLayout = input(false);
  readonly limitLayouts = input<CreateVdevLayout[]>();

  readonly inventory = input<DetailsDisk[]>();

  protected topologyCategory: PoolManagerTopologyCategory;

  constructor(
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

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
