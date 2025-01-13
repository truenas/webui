import {
  Component, ChangeDetectionStrategy, input,
  computed,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';

@Component({
  standalone: true,
  selector: 'ix-fibre-channel-connections-card',
  templateUrl: './fibre-channel-connections-card.component.html',
  styleUrls: ['./fibre-channel-connections-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardExpandCollapseComponent,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
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
