import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnCardComponent } from '@truenas/ui-components';
import { FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';

@Component({
  selector: 'ix-fibre-channel-connections-card',
  templateUrl: './fibre-channel-connections-card.component.html',
  styleUrls: ['./fibre-channel-connections-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    CardExpandCollapseComponent,
    TranslateModule,
  ],
})
export class FibreChannelConnectionsCardComponent {
  connections = input<FibreChannelStatus[]>([]);
  // Only for the "ports exist but none have sessions" case — the template's
  // @empty branch owns the no-connections-at-all message, so gate on length
  // to avoid rendering both ([].every() is true).
  protected showEmptyMessage = computed<boolean>(() => {
    const connections = this.connections() ?? [];
    return connections.length > 0 && connections.every((connection) => {
      return !connection?.A?.sessions?.length && !connection?.B?.sessions?.length;
    });
  });
}
