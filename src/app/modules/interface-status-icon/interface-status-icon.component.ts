import {
  ChangeDetectionStrategy, Component, ViewChild,
  computed,
  effect,
  input,
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

@UntilDestroy()
@Component({
  selector: 'ix-interface-status-icon',
  templateUrl: './interface-status-icon.component.html',
  styleUrls: ['./interface-status-icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatTooltipModule,
    IxIconComponent,
  ],
})
export class InterfaceStatusIconComponent {
  update = input<NetworkInterfaceUpdate>();
  @ViewChild('stateIcon') stateIcon: IxIconComponent;

  protected elementId: string;
  private minRate = KiB;

  isLinkUp = computed(() => {
    return this.update()?.link_state === LinkState.Up;
  });

  tooltipText = computed(() => {
    const sent = this.formatBytes(this.update()?.sent_bytes_rate);
    const received = this.formatBytes(this.update()?.received_bytes_rate);

    if (!sent || !received) {
      return this.translate.instant('N/A');
    }

    return this.translate.instant('Received: {received}/s Sent: {sent}/s', { sent, received });
  });

  constructor(
    private translate: TranslateService,
  ) {
    this.elementId = `in-out${UUID.UUID()}`;

    effect(() => {
      if (this.update()?.sent_bytes_rate > this.minRate) {
        this.updateStateInfoIcon('sent');
      }

      if (this.update()?.received_bytes_rate > this.minRate) {
        this.updateStateInfoIcon('received');
      }
    });
  }

  private formatBytes(bytes: number): string {
    return buildNormalizedFileSize(bytes * 8, 'b', 10);
  }

  updateStateInfoIcon(type: 'sent' | 'received'): void {
    if (!this.stateIcon?._elementRef?.nativeElement) {
      return;
    }
    const [inIcon, outIcon] = this.stateIcon._elementRef.nativeElement.querySelectorAll('.arrow');
    const targetIconEl = type === 'sent' ? inIcon : outIcon;
    if (!targetIconEl) {
      console.error('Failed to find target icon element.');
      return;
    }

    targetIconEl.classList.add('active');

    timer(2000).pipe(untilDestroyed(this)).subscribe(() => {
      targetIconEl.classList.remove('active');
    });
  }
}
