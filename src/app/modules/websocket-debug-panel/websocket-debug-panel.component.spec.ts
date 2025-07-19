import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { WebSocketDebugPanelComponent } from './websocket-debug-panel.component';

describe('WebSocketDebugPanelComponent', () => {
  let spectator: Spectator<WebSocketDebugPanelComponent>;
  const createComponent = createComponentFactory({
    component: WebSocketDebugPanelComponent,
    providers: [
      provideMockStore({
        initialState: {
          webSocketDebug: {
            isPanelOpen: false,
            activeTab: 'websocket',
            messages: [],
            mockConfigs: [],
            messageLimit: 15,
          },
        },
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });
});
