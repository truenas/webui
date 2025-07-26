import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MessageListComponent } from 'app/modules/websocket-debug-panel/components/message-list/message-list.component';

@Component({
  selector: 'ix-websocket-tab',
  standalone: true,
  imports: [MessageListComponent],
  templateUrl: './websocket-tab.component.html',
  styleUrls: ['./websocket-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSocketTabComponent {}
