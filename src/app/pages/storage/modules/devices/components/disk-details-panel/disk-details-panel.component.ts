import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { Disk, isTopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-details-panel',
  templateUrl: './disk-details-panel.component.html',
  styleUrls: ['./disk-details-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiskDetailsPanelComponent implements OnInit {
  @Input() topologyItem: TopologyItem;
  @Input() topologyParentItem: TopologyItem;
  @Input() disk: Disk;
  @Input() poolId: number;
  @Input() topologyCategory: VdevType;
  @Input() hasTopLevelRaidz: boolean;

  @Output() closeMobileDetails: EventEmitter<void> = new EventEmitter<void>();

  get title(): string {
    if (isTopologyDisk(this.topologyItem)) {
      return this.topologyItem.disk || this.topologyItem.guid;
    }

    return this.topologyItem.type;
  }

  get isTopologyDisk(): boolean {
    return isTopologyDisk(this.topologyItem);
  }

  get hasTopologyItemDisk(): boolean {
    if (isTopologyDisk(this.topologyItem)) {
      return this.topologyItem.disk !== null;
    }

    return false;
  }

  constructor(
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.ws.call('pool.query', [[['id', '=', this.poolId]]]).pipe(untilDestroyed(this)).subscribe();
  }

  onCloseMobileDetails(): void {
    this.closeMobileDetails.emit();
  }
}
