import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import filesize from 'filesize';
import { KiB } from 'app/constants/bytes.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import { TableService } from 'app/modules/entity/table/table.service';

@Component({
  selector: 'ix-interface-status-icon',
  templateUrl: './interface-status-icon.component.html',
  styleUrls: ['./interface-status-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfaceStatusIconComponent implements OnChanges {
  @Input() update: NetworkInterfaceUpdate;

  readonly LinkState = LinkState;

  protected elementId: string;
  private minRate = KiB;

  constructor(
    private translate: TranslateService,
    private tableService: TableService,
  ) {
    this.elementId = `in-out${UUID.UUID()}`;
  }

  get tooltipText(): string {
    return this.translate.instant('Sent: {sent} Received: {received}', {
      sent: filesize(this.update.sent_bytes, { standard: 'iec' }),
      received: filesize(this.update.received_bytes, { standard: 'iec' }),
    });
  }

  ngOnChanges(): void {
    if (this.update?.sent_bytes_rate > this.minRate) {
      this.tableService.updateStateInfoIcon(this.elementId, 'sent');
    }

    if (this.update?.received_bytes_rate > this.minRate) {
      this.tableService.updateStateInfoIcon(this.elementId, 'received');
    }
  }
}
