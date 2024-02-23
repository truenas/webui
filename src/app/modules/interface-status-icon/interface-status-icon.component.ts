import { NgIf } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Input, OnChanges, ViewChild,
} from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import { timer } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';

@UntilDestroy()
@Component({
  selector: 'ix-interface-status-icon',
  templateUrl: './interface-status-icon.component.html',
  styleUrls: ['./interface-status-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    NgIf,
    MatTooltipModule,
    IxIconModule,
  ],
})
export class InterfaceStatusIconComponent implements OnChanges {
  @Input() update: NetworkInterfaceUpdate;
  @ViewChild('stateIcon') stateIcon: IxIconComponent;

  readonly LinkState = LinkState;

  protected elementId: string;
  private minRate = KiB;

  constructor(
    private translate: TranslateService,
  ) {
    this.elementId = `in-out${UUID.UUID()}`;
  }

  get tooltipText(): string {
    const handleBytesResult = (bytes: number): string => {
      if (bytes !== undefined && bytes !== null) {
        return buildNormalizedFileSize(bytes * 8, 'b', 10);
      }

      return this.translate.instant('N/A');
    };

    return this.translate.instant('Sent: {sent} Received: {received}', {
      sent: handleBytesResult(this.update.sent_bytes_rate),
      received: handleBytesResult(this.update.received_bytes_rate),
    });
  }

  ngOnChanges(): void {
    if (this.update?.sent_bytes_rate > this.minRate) {
      this.updateStateInfoIcon('sent');
    }

    if (this.update?.received_bytes_rate > this.minRate) {
      this.updateStateInfoIcon('received');
    }
  }

  updateStateInfoIcon(type: 'sent' | 'received'): void {
    if (!this.stateIcon) {
      return;
    }
    const arrowIcons = this.stateIcon._elementRef.nativeElement.querySelectorAll('.arrow');
    const targetIconEl = type === 'sent' ? arrowIcons[0] : arrowIcons[1];
    if (!targetIconEl) {
      return;
    }

    targetIconEl.classList.add('active');

    timer(2000).pipe(untilDestroyed(this)).subscribe(() => {
      targetIconEl.classList.remove('active');
    });
  }
}
