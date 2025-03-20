import { computed, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest, Observable, switchMap, tap,
} from 'rxjs';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';

export interface NewUserFormState {
  isStigMode: boolean;
  nextUid: number;
}

const initialState: NewUserFormState = {
  isStigMode: false,
  nextUid: null as number,
};

@Injectable()
export class UserFormStore extends ComponentStore<NewUserFormState> {
  readonly isStigMode = computed(() => this.state().isStigMode);
  readonly nextUid = computed(() => this.state().nextUid);

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => combineLatest([
        this.setStigMode(),
        this.setNextUserId(),
      ])),
    );
  });

  constructor(
    private api: ApiService,
  ) {
    super(initialState);
  }

  private setStigMode(): Observable<SystemSecurityConfig> {
    return this.api.call('system.security.config').pipe(
      tap((config: SystemSecurityConfig) => {
        this.patchState({ isStigMode: config.enable_gpos_stig });
      }),
    );
  }

  private setNextUserId(): Observable<number> {
    return this.api.call('user.get_next_uid').pipe(
      tap((nextUid) => this.patchState({ nextUid })),
    );
  }

  createUser(payload: UserUpdate): Observable<User> {
    return this.api.call('user.create', [payload]);
  }
}
