import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';

@Component({
  selector: 'ix-disconnected-message',
  templateUrl: './disconnected-message.component.html',
  styleUrls: ['./disconnected-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DisconnectedMessageComponent {
  @Input() hasFailover: boolean;
}
