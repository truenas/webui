import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { provideMockActions } from '@ngrx/effects/testing';
import { Action } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { ReplaySubject } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { User } from 'app/interfaces/user.interface';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import {
  userAdded, userChanged, userRemoved, usersLoaded,
} from 'app/pages/credentials/users/store/user.actions';
import { UserEffects } from 'app/pages/credentials/users/store/user.effects';

describe('UserEffects', () => {
  let spectator: SpectatorService<UserEffects>;
  let actions$: ReplaySubject<Action>;

  const createService = createServiceFactory({
    service: UserEffects,
    providers: [
      mockApi([]),
      { provide: TranslateService, useValue: { instant: (key: string) => key } },
      provideMockActions(() => actions$),
    ],
  });

  beforeEach(() => {
    actions$ = new ReplaySubject(1);
    spectator = createService();
  });

  describe('subscribeToChanges$', () => {
    it('applies users added, changed and removed outside this tab to the list, without the password', () => {
      const dispatched: Action[] = [];
      spectator.service.subscribeToChanges$.subscribe((action) => dispatched.push(action));
      actions$.next(usersLoaded({ users: [] }));

      const api = spectator.inject(MockApiService);
      const fields = { username: 'jane' } as WebUiQueryEntity<'user.query'>;
      api.emitEvent('user.query', {
        msg: 'added', id: 7, fields: { ...fields, password: 'secret' } as WebUiQueryEntity<'user.query'>,
      });
      api.emitEvent('user.query', { msg: 'changed', id: 7, fields });
      api.emitEvent('user.query', { msg: 'removed', id: 7 });

      const user = { id: 7, username: 'jane' } as User;
      expect(dispatched).toEqual([userAdded({ user }), userChanged({ user }), userRemoved({ id: 7 })]);
    });
  });
});
