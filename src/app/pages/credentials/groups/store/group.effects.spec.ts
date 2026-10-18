import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TranslateService } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { MockTypedApiService } from 'app/core/testing/classes/mock-typed-api.service';
import { mockTypedApi } from 'app/core/testing/utils/mock-typed-api.utils';
import { Group } from 'app/interfaces/group.interface';
import { Preferences } from 'app/interfaces/preferences.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  groupAdded, groupChanged, groupRemoved, groupsLoaded,
} from 'app/pages/credentials/groups/store/group.actions';
import { GroupEffects } from 'app/pages/credentials/groups/store/group.effects';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('GroupEffects', () => {
  let spectator: SpectatorService<GroupEffects>;
  let actions$: ReplaySubject<Action>;

  const createService = createServiceFactory({
    service: GroupEffects,
    providers: [
      mockTypedApi([]),
      { provide: TranslateService, useValue: { instant: (key: string) => key } },
      provideMockActions(() => actions$),
      provideMockStore({
        selectors: [{ selector: selectPreferences, value: { hideBuiltinGroups: true } as Preferences }],
      }),
    ],
  });

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    spectator = createService();
  });

  describe('subscribeToChanges$', () => {
    it('applies groups added, changed and removed outside this tab, leaving out hidden builtin groups', () => {
      const dispatched: Action[] = [];
      spectator.service.subscribeToChanges$.subscribe((action) => dispatched.push(action));
      actions$.next(groupsLoaded({ groups: [] }));

      const api = spectator.inject(MockTypedApiService);
      const fields = { group: 'staff', builtin: false } as WebUiQueryEntity<'group.query'>;
      api.emitEvent('group.query', { msg: 'added', id: 7, fields });
      api.emitEvent('group.query', {
        msg: 'added', id: 8, fields: { group: 'wheel', builtin: true } as WebUiQueryEntity<'group.query'>,
      });
      api.emitEvent('group.query', { msg: 'changed', id: 7, fields });
      api.emitEvent('group.query', { msg: 'removed', id: 7 });

      const group = { id: 7, group: 'staff', builtin: false } as Group;
      expect(dispatched).toEqual([groupAdded({ group }), groupChanged({ group }), groupRemoved({ id: 7 })]);
    });
  });
});
