import { computed, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ComponentStore } from '@ngrx/component-store';
import { of, switchMap, tap } from 'rxjs';
import { catchError, map, startWith } from 'rxjs/operators';
import { CollectionChangeType } from 'app/enums/api.enum';
import { User } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

export interface UsersState {
  isLoading: boolean;
  users: User[] | undefined;
  selectedUser: User | null;
}

const initialState: UsersState = {
  isLoading: true,
  users: undefined,
  selectedUser: null,
};

@UntilDestroy()
@Injectable()
export class UsersStore extends ComponentStore<UsersState> {
  readonly stateAsSignal = toSignal(this.state$, { initialValue: initialState });
  readonly isLoading = computed(() => this.stateAsSignal().isLoading);
  readonly selectedUser = computed(() => this.stateAsSignal().selectedUser);
  readonly users = computed(() => {
    return this.stateAsSignal().users?.filter((user) => !!user) ?? [];
  });

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
  ) {
    super(initialState);
  }

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => {
        this.patchState({ isLoading: true });
        return this.api.call('user.query').pipe(
          switchMap((users: User[]) => this.api.subscribe('user.query').pipe(
            startWith(null),
            map((event) => {
              switch (event?.msg) {
                case CollectionChangeType.Added:
                  return [...users, event.fields];
                case CollectionChangeType.Changed:
                  return users.map((item) => (item.id === event.id ? { ...item, ...event?.fields } : item));
                case CollectionChangeType.Removed:
                  return users.filter((item) => item.id !== event.id);
                default:
                  break;
              }
              return users;
            }),
          )),
          tap((users) => {
            this.patchState({
              users,
              isLoading: false,
            });
          }),
          catchError((error: unknown) => {
            this.patchState({ isLoading: false, users: [] });
            this.errorHandler.showErrorModal(error);
            return of(undefined);
          }),
        );
      }),
      untilDestroyed(this),
    );
  });

  userUpdated(updated: User): void {
    const users = this.users().map((user) => (updated.id === user.id ? updated : user));
    this.patchState({ users });
  }

  selectUser(username: string): void {
    const selectedUser = this.users()?.find((user) => user.username === username);
    if (!selectedUser?.username) {
      this.resetSelectedUser();
      return;
    }
    const oldSelectedUser = this.selectedUser();
    if (!selectedUser || selectedUser === oldSelectedUser) {
      return;
    }

    this.patchState({ selectedUser });
  }

  resetSelectedUser(): void {
    this.patchState({ selectedUser: null });
  }
}
