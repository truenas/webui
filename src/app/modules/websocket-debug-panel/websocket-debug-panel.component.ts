import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, HostListener,
} from '@angular/core';
import { MatTabsModule } from '@angular/material/tabs';
import { Store } from '@ngrx/store';
import { DebugPanelToggleComponent } from './components/debug-panel-toggle/debug-panel-toggle.component';
import { WebSocketTabComponent } from './components/websocket-tab/websocket-tab.component';
import * as WebSocketDebugActions from './store/websocket-debug.actions';
import {
  selectIsPanelOpen, selectActiveTab, selectHasActiveMocks,
} from './store/websocket-debug.selectors';
import { WebSocketDebugPanelModule } from './websocket-debug-panel.module';

@Component({
  selector: 'ix-websocket-debug-panel',
  standalone: true,
  imports: [
    AsyncPipe,
    MatTabsModule,
    DebugPanelToggleComponent,
    WebSocketTabComponent,
    WebSocketDebugPanelModule,
  ],
  providers: [],
  templateUrl: './websocket-debug-panel.component.html',
  styleUrls: ['./websocket-debug-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebSocketDebugPanelComponent implements OnInit {
  readonly isPanelOpen$ = this.store$.select(selectIsPanelOpen);
  readonly activeTab$ = this.store$.select(selectActiveTab);
  readonly hasActiveMocks$ = this.store$.select(selectHasActiveMocks);

  protected panelWidth = 450;

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

  @HostListener('document:keydown', ['$event'])
  handleKeyboardShortcut(event: KeyboardEvent): void {
    if (event.ctrlKey && event.shiftKey && event.key === 'X') {
      event.preventDefault();
      this.togglePanel();
    }
  }

  onResizeStart(event: MouseEvent): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = this.panelWidth;

    const handleMouseMove = (moveEvent: MouseEvent): void => {
      const diff = startX - moveEvent.clientX;
      this.panelWidth = Math.max(350, Math.min(800, startWidth + diff));
      document.documentElement.style.setProperty('--debug-panel-width', `${this.panelWidth}px`);
    };

    const handleMouseUp = (): void => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }
}
