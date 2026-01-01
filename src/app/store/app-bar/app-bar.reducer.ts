import { createReducer, on } from '@ngrx/store';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import {
  appBarOpened,
  appBarClosed,
  appBarMinimized,
  appBarAdded,
} from './app-bar.actions';

export type AppBarState = AppBarItem;

const appBarStorageKey = 'ix-app-bar-state';

function loadStateFromStorage(): AppBarItem[] {
  try {
    const stored = localStorage.getItem(appBarStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load app-bar state from localStorage:', error);
  }
  // 返回默认状态
  return [
    {
      status: 'open',
      name: 'Desktop',
      icon: iconMarker('mdi-monitor'),
      iconActive: iconMarker('mdi-monitor'),
      state: 'desktop',
    },
  ];
}

export const initialState: AppBarItem[] = loadStateFromStorage();

function updateItem(state: AppBarState[], stateId: string, changes: Partial<AppBarState>): AppBarState[] {
  return state.map((item) => (item.state === stateId ? { ...item, ...changes } : { ...item, status: 'minimized' as const }));
}

export const appBarReducer = createReducer(
  initialState,
  on(appBarOpened, (state, { item }) => {
    const itemExists = state.some((i) => i.state === item.state);
    if (itemExists) {
      return updateItem(state, item.state, { ...item, status: 'open' as const });
    }

    return [...state.map((i) => ({ ...i, status: 'minimized' as const })), { ...item, status: 'open' as const }];
  }),
  on(appBarClosed, (state, { stateName }) => state.filter((item) => item.state !== stateName)),
  on(appBarMinimized, (state, { stateName }) => updateItem(state, stateName, { status: 'minimized' as const })),
  on(appBarAdded, (state, { item }) => {
    const itemExists = state.some((i) => i.state === item.state);
    if (itemExists) {
      return state;
    }
    return [...state, item];
  }),
);
