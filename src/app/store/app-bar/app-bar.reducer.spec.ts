import { tnIconMarker } from '@truenas/ui-components';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import {
  appBarAdded,
  appBarClosed,
  appBarMinimized,
  appBarOpened,
} from 'app/store/app-bar/app-bar.actions';
import { appBarReducer, sanitizeAppBarState } from 'app/store/app-bar/app-bar.reducer';

describe('appBarReducer', () => {
  const desktopItem: AppBarItem = {
    status: 'minimized',
    name: 'Desktop',
    icon: tnIconMarker('monitor', 'mdi'),
    iconActive: tnIconMarker('monitor', 'mdi'),
    state: 'desktop',
  };

  const otherItem: AppBarItem = {
    status: 'open',
    name: 'Other App',
    icon: 'other-icon',
    iconActive: 'other-icon',
    state: 'other-app',
  };

  const harborAssistantItem: AppBarItem = {
    status: 'open',
    name: 'Harbor Assistant',
    icon: 'app-desktop-harbor-assistant',
    iconActive: 'app-desktop-harbor-assistant-active',
    state: 'harbor-assistant',
  };

  it('removes Harbor Assistant from restored app-bar state', () => {
    const state = sanitizeAppBarState([desktopItem, harborAssistantItem]);

    expect(state).toHaveLength(1);
    expect(state[0].state).toBe('desktop');
    expect(state[0].status).toBe('open');
  });

  it('ignores attempts to add Harbor Assistant to the app bar', () => {
    const state = appBarReducer([desktopItem], appBarAdded({ item: harborAssistantItem }));

    expect(state.map((item) => item.state)).not.toContain('harbor-assistant');
  });

  it('ignores attempts to open Harbor Assistant from stale app-bar state', () => {
    const state = appBarReducer([desktopItem], appBarOpened({ item: harborAssistantItem }));

    expect(state.map((item) => item.state)).not.toContain('harbor-assistant');
  });

  it('should set desktop status to open when the last other app is closed', () => {
    const initialState: AppBarItem[] = [desktopItem, otherItem];
    const action = appBarClosed({ stateName: 'other-app' });
    const state = appBarReducer(initialState, action);

    expect(state).toHaveLength(1);
    expect(state[0].state).toBe('desktop');
    expect(state[0].status).toBe('open');
  });

  it('should set desktop status to open when an app is closed, even if other apps remain', () => {
    const anotherItem: AppBarItem = {
      status: 'minimized',
      name: 'Another App',
      icon: 'another-icon',
      iconActive: 'another-icon',
      state: 'another-app',
    };
    const initialState: AppBarItem[] = [desktopItem, otherItem, anotherItem];
    const action = appBarClosed({ stateName: 'other-app' });
    const state = appBarReducer(initialState, action);

    expect(state).toHaveLength(2);
    expect(state.find((i) => i.state === 'desktop')?.status).toBe('open');
  });

  it('should set desktop status to open when an app is minimized', () => {
    const initialState: AppBarItem[] = [desktopItem, otherItem];
    const action = appBarMinimized({ stateName: 'other-app' });
    const state = appBarReducer(initialState, action);

    expect(state.find((i) => i.state === 'desktop')?.status).toBe('open');
    expect(state.find((i) => i.state === 'other-app')?.status).toBe('minimized');
  });
});
