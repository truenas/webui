import { tnIconMarker } from '@truenas/ui-components';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import {
  appBarClosed,
  appBarMinimized,
} from 'app/store/app-bar/app-bar.actions';
import { appBarReducer } from 'app/store/app-bar/app-bar.reducer';

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
