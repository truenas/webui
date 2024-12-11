import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';

@Component({
  selector: 'ix-fibre-channel-port-card',
  styleUrls: ['./fibre-channel-port-card.component.scss'],
  templateUrl: './fibre-channel-port-card.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatCardContent,
  ],
})
export class FibreChannelPortCardComponent {
  readonly port = input.required<FibreChannelPort>();
}
