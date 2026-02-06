import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, inject } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateService } from '@ngx-translate/core';
import { TnIconComponent, TnTooltipDirective, tnIconMarker } from '@truenas/ui-components';
import { v4 as uuidv4 } from 'uuid';
import { KiB } from 'app/constants/bytes.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';

@Component({
  selector: 'ix-interface-status-icon',
  templateUrl: './interface-status-icon.component.html',
  styleUrls: ['./interface-status-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatTooltipModule,
    TnIconComponent,
    TnTooltipDirective,
    NgClass,
  ],
})
export class InterfaceStatusIconComponent {
  private translate = inject(TranslateService);

  update = input<NetworkInterfaceUpdate>();

  protected elementId: string;
  private minRate = KiB;

  isLinkUp = computed(() => {
    return this.update()?.link_state === LinkState.Up;
  });

  tooltipText = computed(() => {
    if (!this.isLinkUp()) {
      return this.translate.instant('The network link is currently down.');
    }

    const sent = this.formatBytes(this.update()?.sent_bytes_rate || 0);
    const received = this.formatBytes(this.update()?.received_bytes_rate || 0);

    if (!sent || !received) {
      return this.translate.instant('N/A');
    }

    return this.translate.instant('Received: {received}/s Sent: {sent}/s', { sent, received });
  });

  statusIcon = computed<string>(() => {
    const update = this.update();
    const hasSent = update ? update.sent_bytes_rate > this.minRate : false;
    const hasReceived = update ? update.received_bytes_rate > this.minRate : false;

    if (!this.isLinkUp()) {
      return tnIconMarker('tn-network-upload-download-disabled');
    }

    switch (true) {
      case hasSent && hasReceived: return tnIconMarker('tn-network-upload-download-both');
      case hasSent: return tnIconMarker('tn-network-upload-download-up');
      case hasReceived: return tnIconMarker('tn-network-upload-download-down');
      default: return tnIconMarker('tn-network-upload-download');
    }
  });

  constructor() {
    this.elementId = `in-out${uuidv4()}`;
  }

  private formatBytes(bytes: number): string {
    return buildNormalizedFileSize(bytes * 8, 'b', 10);
  }
}
