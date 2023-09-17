import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CreateVdevLayout, VdevType } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  PoolManagerStore,
  PoolManagerTopologyCategory,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

@UntilDestroy()
@Component({
  selector: 'ix-layout-step',
  templateUrl: './layout-step.component.html',
  styleUrls: ['./layout-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutStepComponent implements OnInit {
  @Input() isStepActive: boolean;
  @Input() type: VdevType;
  @Input() description: string;

  @Input() canChangeLayout = false;
  @Input() limitLayouts: CreateVdevLayout[];

  @Input() inventory: UnusedDisk[];

  protected topologyCategory: PoolManagerTopologyCategory;

  get isVdevsLimitedToOne(): boolean {
    return this.type === VdevType.Spare || this.type === VdevType.Cache || this.type === VdevType.Log;
  }

  constructor(
    private store: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.connectToStore();
  }

  private connectToStore(): void {
    this.store.state$.pipe(untilDestroyed(this)).subscribe(({ topology }) => {
      this.topologyCategory = topology[this.type];
      this.cdr.markForCheck();
    });
  }
}
