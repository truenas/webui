import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MessageListComponent } from 'app/modules/websocket-debug-panel/components/message-list/message-list.component';
import { WebSocketTabComponent } from './websocket-tab.component';

describe('WebSocketTabComponent', () => {
  let spectator: Spectator<WebSocketTabComponent>;

  const createComponent = createComponentFactory({
    component: WebSocketTabComponent,
    imports: [MessageListComponent],
    providers: [
      provideMockStore({
        initialState: {
          webSocketDebug: {
            messages: [],
            mockConfigs: [],
            isPanelOpen: false,
            activeTab: 'websocket',
            messageLimit: 15,
            hasActiveMocks: false,
          },
        },
      }),
    ],
    shallow: true,
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should render message list component', () => {
    const messageList = spectator.query(MessageListComponent);
    expect(messageList).toBeTruthy();
  });
});
