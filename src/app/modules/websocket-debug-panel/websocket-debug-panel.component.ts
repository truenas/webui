import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as WebSocketDebugActions from './store/websocket-debug.actions';
import {
  selectIsPanelOpen, selectActiveTab, selectHasActiveMocks,
} from './store/websocket-debug.selectors';

@Component({
  selector: 'ix-websocket-debug-panel',
  templateUrl: './websocket-debug-panel.component.html',
  styleUrls: ['./websocket-debug-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSocketDebugPanelComponent implements OnInit {
  readonly isPanelOpen$ = this.store$.select(selectIsPanelOpen);
  readonly activeTab$ = this.store$.select(selectActiveTab);
  readonly hasActiveMocks$ = this.store$.select(selectHasActiveMocks);

  constructor(
    private store$: Store,
  ) {}

  ngOnInit(): void {
    // Load saved mock configs and restore panel state
    this.store$.dispatch(WebSocketDebugActions.loadMockConfigs());

    // Restore panel state from localStorage if available
    try {
      const savedState = localStorage.getItem('websocket-debug-panel-open');
      if (savedState) {
        const isOpen = JSON.parse(savedState) as boolean;
        this.store$.dispatch(WebSocketDebugActions.setPanelOpen({ isOpen }));
      }
    } catch (error) {
      console.error('Failed to restore panel state:', error);
    }
  }

  onTabChange(tab: string): void {
    this.store$.dispatch(WebSocketDebugActions.setActiveTab({ tab }));
  }

  togglePanel(): void {
    this.store$.dispatch(WebSocketDebugActions.togglePanel());
  }
}
