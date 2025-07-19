import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { selectMockConfigs } from 'app/modules/websocket-debug-panel/store/websocket-debug.selectors';

@Component({
  selector: 'ix-mock-config-list',
  templateUrl: './mock-config-list.component.html',
  styleUrls: ['./mock-config-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MockConfigListComponent {
  mockConfigs$ = this.store.select(selectMockConfigs);

  constructor(private store: Store) {}
}
