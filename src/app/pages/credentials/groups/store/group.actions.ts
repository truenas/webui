import { createAction, props } from '@ngrx/store';
import { Group } from 'app/interfaces/group.interface';

export const groupPageEntered = createAction('[Groups API] Load');

export const groupsLoaded = createAction('[Groups API] Loaded', props<{ groups: Group[] }>());
export const groupsNotLoaded = createAction('[Groups API] Not Loaded', props<{ error: string }>());

export const groupAdded = createAction('[Groups API] Group Added', props<{ group: Group }>());
export const groupChanged = createAction('[Groups API] Group Changed', props<{ group: Group }>());
export const groupRemoved = createAction('[Groups API] Group Removed', props<{ id: number }>());
