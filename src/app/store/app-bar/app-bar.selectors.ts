import { createFeatureSelector } from '@ngrx/store';
import { AppBarState } from './app-bar.reducer';

export const appBarStateKey = 'app-bar';

// Select the entire appBar array
export const selectAppBarState = createFeatureSelector<AppBarState[]>('app-bar');
