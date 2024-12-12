import {
  ChangeDetectionStrategy, Component,
  input, output, computed,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatMenuTrigger, MatMenu, MatMenuItem } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { DeviceNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { BootPoolActionEvent, BootPoolActionType } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';

@Component({
  selector: 'ix-bootenv-node-item',
  templateUrl: './bootenv-node-item.component.html',
  styleUrls: ['./bootenv-node-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    MatTooltip,
    MatIconButton,
    TestDirective,
    MatMenuTrigger,
    MatMenu,
    RequiresRolesDirective,
    MatMenuItem,
    TranslateModule,
  ],
})
export class BootenvNodeItemComponent {
  readonly node = input.required<DeviceNestedDataNode>();
  readonly poolInstance = input.required<PoolInstance>();
  readonly oneDisk = input<boolean>();

  readonly invokeAction = output<BootPoolActionEvent>();

  readonly requiredRoles = [Role.FullAdmin];

  protected readonly topologyItem = computed(() => this.node() as TopologyItem);

  protected readonly ownName = computed(() => {
    if (!this.topologyItem()) {
      return '';
    }
    if (this.topologyItem().name) {
      return this.topologyItem().name;
    }
    return this.topologyItem().path;
  });

  protected readonly isMirror = computed(() => {
    return Boolean(this.topologyItem().type === TopologyItemType.Mirror && this.topologyItem().path);
  });

  protected readonly isDisk = computed(() => {
    return Boolean(this.topologyItem().type === TopologyItemType.Disk && this.topologyItem().path);
  });

  protected readonly statusColor = computed(() => {
    switch (this.topologyItem().status as (PoolStatus | TopologyItemStatus)) {
      case PoolStatus.Faulted:
        return 'var(--red)';
      case PoolStatus.Offline:
        return 'var(--alt-bg2)';
      default:
        return '';
    }
  });

  protected readonly errors = computed(() => {
    let errors = 0;
    const stats = this.topologyItem().stats;
    if (stats) {
      errors = (stats?.checksum_errors || 0) + (stats?.read_errors || 0) + (stats?.write_errors || 0);
    }
    return this.translate.instant('{n, plural, =0 {No Errors} one {# Error} other {# Errors}}', { n: errors });
  });

  constructor(private translate: TranslateService) {}

  detach(): void {
    this.invokeAction.emit({
      action: BootPoolActionType.Detach,
      node: this.topologyItem(),
    });
  }

  attach(): void {
    this.invokeAction.emit({
      action: BootPoolActionType.Attach,
      node: this.topologyItem(),
    });
  }

  replace(): void {
    this.invokeAction.emit({
      action: BootPoolActionType.Replace,
      node: this.topologyItem(),
    });
  }
}
