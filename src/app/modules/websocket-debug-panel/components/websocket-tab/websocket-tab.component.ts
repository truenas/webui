import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-websocket-tab',
  templateUrl: './websocket-tab.component.html',
  styleUrls: ['./websocket-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSocketTabComponent {}
