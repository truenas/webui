import {
  ChangeDetectionStrategy, Component, Input, Output, EventEmitter,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { DeviceNestedDataNode } from 'app/interfaces/device-nested-data-node.interface';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { TopologyItem } from 'app/interfaces/storage.interface';
import { BootPoolActionEvent, BootPoolActionType } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';

@Component({
  selector: 'ix-bootenv-node-item',
  templateUrl: './bootenv-node-item.component.html',
  styleUrls: ['./bootenv-node-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BootenvNodeItemComponent {
  @Input() node: DeviceNestedDataNode;
  @Input() poolInstance: PoolInstance;
  @Input() oneDisk: boolean;
  @Output() invokeAction = new EventEmitter<BootPoolActionEvent>();

  get ownName(): string {
    if (!this.topologyItem) {
      return;
    }
    if (this.topologyItem.name) {
      return this.topologyItem.name;
    }
    return this.topologyItem.path;
  }

  get topologyItem(): TopologyItem {
    return this.node as TopologyItem;
  }

  get isMirror(): boolean {
    return Boolean(this.topologyItem.type === TopologyItemType.Mirror && this.topologyItem.path);
  }

  get isDisk(): boolean {
    return Boolean(this.topologyItem.type === TopologyItemType.Disk && this.topologyItem.path);
  }

  get statusColor(): string {
    switch (this.topologyItem.status as (PoolStatus | TopologyItemStatus)) {
      case PoolStatus.Faulted:
        return 'var(--red)';
      case PoolStatus.Offline:
        return 'var(--alt-bg2)';
      default:
        return '';
    }
  }

  get errors(): string {
    let errors = 0;
    if (this.topologyItem.stats) {
      const stats = this.topologyItem.stats;
      errors = stats?.checksum_errors + stats?.read_errors + stats?.write_errors;
    }
    return this.translate.instant('{n, plural, =0 {No Errors} one {# Error} other {# Errors}}', { n: errors });
  }

  constructor(private translate: TranslateService) {}

  detach(): void {
    this.invokeAction.emit({
      action: BootPoolActionType.Detach,
      node: this.topologyItem,
    });
  }

  attach(): void {
    this.invokeAction.emit({
      action: BootPoolActionType.Attach,
      node: this.topologyItem,
    });
  }

  replace(): void {
    this.invokeAction.emit({
      action: BootPoolActionType.Replace,
      node: this.topologyItem,
    });
  }
}
