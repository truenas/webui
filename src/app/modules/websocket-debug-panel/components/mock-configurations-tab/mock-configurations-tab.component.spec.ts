import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockConfigListComponent } from 'app/modules/websocket-debug-panel/components/mock-config/mock-config-list/mock-config-list.component';
import { MockConfigurationsTabComponent } from './mock-configurations-tab.component';

describe('MockConfigurationsTabComponent', () => {
  let spectator: Spectator<MockConfigurationsTabComponent>;

  const createComponent = createComponentFactory({
    component: MockConfigurationsTabComponent,
    imports: [MockConfigListComponent],
    providers: [
      provideMockStore({
        initialState: {
          webSocketDebug: {
            messages: [],
            mockConfigs: [],
            isPanelOpen: false,
            activeTab: 'mock',
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

  it('should render mock config list component', () => {
    const mockConfigList = spectator.query(MockConfigListComponent);
    expect(mockConfigList).toBeTruthy();
  });
});
