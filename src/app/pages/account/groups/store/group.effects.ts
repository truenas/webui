import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { ApiEventMessage } from 'app/enums/api-event-message.enum';
import { Group } from 'app/interfaces/group.interface';
import { QueryParams } from 'app/interfaces/query-api.interface';
import {
  groupPageEntered, groupsLoaded, groupsNotLoaded, groupRemoved,
} from 'app/pages/account/groups/store/group.actions';
import { WebSocketService } from 'app/services';
import { AppState } from 'app/store';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@Injectable()
export class GroupEffects {
  loadGroups$ = createEffect(() => this.actions$.pipe(
    ofType(groupPageEntered, builtinGroupsToggled),
    switchMap(() => this.store$.pipe(waitForPreferences)),
    switchMap((preferences) => {
      let params: QueryParams<Group> = [];
      if (preferences.hideBuiltinGroups) {
        params = [[['builtin', '=', false]]];
      }
      return this.ws.call('group.query', params).pipe(
        map((groups) => groupsLoaded({ groups })),
        catchError((error) => {
          console.error(error);
          // TODO: See if it would make sense to parse middleware error.
          return of(groupsNotLoaded({
            error: this.translate.instant('Groups could not be loaded'),
          }));
        }),
      );
    }),
  ));

  // groupAdded() and groupChanged() are dispatched from the Group Form

  subscribeToRemoval$ = createEffect(() => this.actions$.pipe(
    ofType(groupsLoaded),
    switchMap(() => {
      return this.ws.sub('group.query').pipe(
        filter((event) => event.msg === ApiEventMessage.Changed && event.cleared),
        map((event) => groupRemoved({ id: event.id })),
      );
    }),
  ));

  constructor(
    private actions$: Actions,
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private translate: TranslateService,
  ) {}
}
