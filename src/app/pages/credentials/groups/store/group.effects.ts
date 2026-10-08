import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  catchError, filter, map, switchMap,
} from 'rxjs/operators';
import { toGroup } from 'app/interfaces/group.interface';
import { TypedQueryFilter, WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import {
  groupPageEntered,
  groupRemoved,
  groupsLoaded,
  groupsNotLoaded,
} from 'app/pages/credentials/groups/store/group.actions';
import { AppState } from 'app/store';
import { builtinGroupsToggled } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';

@Injectable()
export class GroupEffects {
  private actions$ = inject(Actions);
  private api = inject(TypedApiService);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);

  loadGroups$ = createEffect(() => this.actions$.pipe(
    ofType(groupPageEntered, builtinGroupsToggled),
    switchMap(() => this.store$.pipe(waitForPreferences)),
    switchMap((preferences) => {
      const filters: TypedQueryFilter<WebUiQueryEntity<'group.query'>>[] = preferences.hideBuiltinGroups
        ? [['builtin', '=', false]]
        : [];
      return this.api.query('group.query', filters).pipe(
        map((groups) => groupsLoaded({ groups: groups.map(toGroup) })),
        catchError((error: unknown) => {
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
      return this.api.subscribe('group.query').pipe(
        filter((event) => event.msg === 'removed'),
        map((event) => groupRemoved({ id: event.id as number })),
      );
    }),
  ));
}
