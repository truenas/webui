import {
  ChangeDetectionStrategy, Component, Input, OnChanges, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import filesize from 'filesize';
import { timer } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { LinkState } from 'app/enums/network-interface.enum';
import { NetworkInterfaceUpdate } from 'app/interfaces/reporting.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@UntilDestroy()
@Component({
  selector: 'ix-interface-status-icon',
  templateUrl: './interface-status-icon.component.html',
  styleUrls: ['./interface-status-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    return this.translate.instant('Sent: {sent} Received: {received}', {
      sent: filesize(this.update.sent_bytes, { standard: 'iec' }),
      received: filesize(this.update.received_bytes, { standard: 'iec' }),
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

    targetIconEl.classList.add('active');

    timer(2000).pipe(untilDestroyed(this)).subscribe(() => {
      targetIconEl.classList.remove('active');
    });
  }
}
