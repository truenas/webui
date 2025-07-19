import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MessageListComponent } from 'app/modules/websocket-debug-panel/components/message-list/message-list.component';
import { MockConfigListComponent } from 'app/modules/websocket-debug-panel/components/mock-config/mock-config-list/mock-config-list.component';

@Component({
  selector: 'ix-websocket-tab',
  standalone: true,
  imports: [MessageListComponent, MockConfigListComponent],
  templateUrl: './websocket-tab.component.html',
  styleUrls: ['./websocket-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSocketTabComponent {}
