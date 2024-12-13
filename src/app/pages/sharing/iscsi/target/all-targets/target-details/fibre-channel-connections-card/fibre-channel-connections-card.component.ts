import {
  Component, OnInit, ChangeDetectionStrategy, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { FibreChannelStatus } from 'app/interfaces/fibre-channel.interface';
import { ApiService } from 'app/services/websocket/api.service';

@Component({
  standalone: true,
  selector: 'ix-fibre-channel-connections-card',
  templateUrl: './fibre-channel-connections-card.component.html',
  styleUrls: ['./fibre-channel-connections-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardTitle,
    MatCardContent,
    MatCardHeader,
    TranslateModule,
  ],
})
export class FibreChannelConnectionsCardComponent implements OnInit {
  connections = input<FibreChannelStatus[]>([]);

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    console.info('init');
  }
}
