import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ix-disconnected-message',
  templateUrl: './disconnected-message.component.html',
  styleUrls: ['./disconnected-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class DisconnectedMessageComponent {}
