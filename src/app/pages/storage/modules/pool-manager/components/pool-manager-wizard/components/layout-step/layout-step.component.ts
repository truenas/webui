import {
  ChangeDetectionStrategy, Component, computed, input, inject,
} from '@angular/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { CreateVdevLayout, VDevType } from 'app/enums/v-dev-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  PoolManagerStore,
} from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';
import { AutomatedDiskSelectionComponent } from './automated-disk-selection/automated-disk-selection.component';
import { CustomLayoutAppliedComponent } from './custom-layout-applied/custom-layout-applied.component';

@Component({
  selector: 'ix-layout-step',
  templateUrl: './layout-step.component.html',
  styleUrls: ['./layout-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TnTestIdDirective, AutomatedDiskSelectionComponent, CustomLayoutAppliedComponent],
})
export class LayoutStepComponent {
  private store = inject(PoolManagerStore);

  readonly isStepActive = input<boolean>(false);
  readonly type = input.required<VDevType>();
  readonly description = input<string>();

  readonly canChangeLayout = input(false);
  readonly limitLayouts = input<readonly CreateVdevLayout[]>([]);
  /** Mirror width floor; propagated to NormalSelectionComponent so parity-locked steps disallow weaker mirrors. */
  readonly minMirrorWidth = input<number>(2);

  readonly inventory = input<DetailsDisk[]>([]);

  protected topologyCategory = computed(() => this.store.topology()[this.type()]);
}
