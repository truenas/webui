import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectMessages } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

@Component({
  selector: 'ix-message-list',
  templateUrl: './message-list.component.html',
  styleUrls: ['./message-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageListComponent {
  messages$ = this.store.select(selectMessages);

  constructor(private store: Store) {}
}
