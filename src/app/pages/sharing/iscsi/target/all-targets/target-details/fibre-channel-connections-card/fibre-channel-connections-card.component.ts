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
  protected showEmptyMessage = computed<boolean>(() => {
    return this.connections()?.every((connection) => {
      return !connection?.A?.sessions?.length && !connection?.B?.sessions?.length;
    });
  });
}
