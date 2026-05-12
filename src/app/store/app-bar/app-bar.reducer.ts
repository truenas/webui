import { createReducer, on } from '@ngrx/store';
import { AppBarItem } from 'app/interfaces/app-bar.interface';
import {
  appBarOpened,
  appBarClosed,
  appBarMinimized,
  appBarAdded,
} from './app-bar.actions';

export type AppBarState = AppBarItem;

const appBarStorageKey = 'ix-app-bar-state';
const hiddenAppBarStates = new Set(['harbor-assistant']);

function defaultAppBarState(): AppBarItem[] {
  return [
    {
      status: 'open',
      name: 'Desktop',
      icon: 'desktop',
      iconActive: 'desktop-active',
      state: 'desktop',
    },
  ];
}

export function sanitizeAppBarState(state: AppBarItem[]): AppBarItem[] {
  const visibleItems = state.filter((item) => !hiddenAppBarStates.has(item.state));
  if (!visibleItems.length) {
    return defaultAppBarState();
  }

  const hasOpenItem = visibleItems.some((item) => item.status === 'open');
  if (hasOpenItem) {
    return visibleItems;
  }

  return visibleItems.map((item) => (
    item.state === 'desktop'
      ? { ...item, status: 'open' as const }
      : item
  ));
}

function loadStateFromStorage(): AppBarItem[] {
  try {
    const stored = localStorage.getItem(appBarStorageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const sanitized = sanitizeAppBarState(parsed);
        if (sanitized.length !== parsed.length) {
          localStorage.setItem(appBarStorageKey, JSON.stringify(sanitized));
        }
        return sanitized;
      }
    }
  } catch (error) {
    console.error('Failed to load app-bar state from localStorage:', error);
  }

  return defaultAppBarState();
}

export const initialState: AppBarItem[] = loadStateFromStorage();

function updateItem(state: AppBarState[], stateId: string, changes: Partial<AppBarState>): AppBarState[] {
  return state.map((item) => (item.state === stateId ? { ...item, ...changes } : { ...item, status: 'minimized' as const }));
}

export const appBarReducer = createReducer(
  initialState,
  on(appBarOpened, (state, { item }) => {
    if (hiddenAppBarStates.has(item.state)) {
      return sanitizeAppBarState(state);
    }

    const itemExists = state.some((i) => i.state === item.state);
    if (itemExists) {
      return updateItem(state, item.state, { ...item, status: 'open' as const });
    }

    return [...state.map((i) => ({ ...i, status: 'minimized' as const })), { ...item, status: 'open' as const }];
  }),
  on(appBarClosed, (state, { stateName }) => {
    const newState = state.filter((item) => item.state !== stateName);
    return newState.map((item) => {
      if (item.state === 'desktop') {
        return { ...item, status: 'open' as const };
      }
      return { ...item, status: 'minimized' as const };
    });
  }),
  on(appBarMinimized, (state, { stateName }) => state.map((item) => {
    if (item.state === stateName) {
      return { ...item, status: 'minimized' as const };
    }
    if (item.state === 'desktop') {
      return { ...item, status: 'open' as const };
    }
    return { ...item, status: 'minimized' as const };
  })),
  on(appBarAdded, (state, { item }) => {
    if (hiddenAppBarStates.has(item.state)) {
      return sanitizeAppBarState(state);
    }

    const itemExists = state.some((i) => i.state === item.state);
    if (itemExists) {
      return state;
    }
    return [...state, item];
  }),
);
