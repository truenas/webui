import { computed, Injectable, signal, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import { patchState, signalState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { TnDialog } from '@truenas/ui-components';
import { isEqual, merge } from 'lodash-es';
import {
  map, Observable, of, pipe, switchMap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import {
  toUser, toUserCreateArgs, User, UserUpdate,
} from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { OneTimePasswordCreatedDialog } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export enum UserStigPasswordOption {
  DisablePassword = 'disable_password',
  OneTimePassword = 'one_time_password',
}

export const defaultHomePath = '/var/empty';
export const defaultRole = 'prompt' as Role;

export interface UserFormSetupDetails {
  allowedAccess: AllowedAccessConfig;
  defaultPermissions: boolean;
  role: Role | null;
  stigPassword: UserStigPasswordOption;
  homeModeOldValue: string;
}

export interface AllowedAccessConfig {
  smbAccess: boolean;
  webshareAccess: boolean;
  truenasAccess: boolean;
  sshAccess: boolean;
  shellAccess: boolean;
}

export interface UserFormState {
  isStigMode: boolean;
  userConfig: UserUpdate;
  setupDetails: UserFormSetupDetails;
}

const initialState: UserFormState = {
  isStigMode: false,
  userConfig: null,
  setupDetails: {
    allowedAccess: {
      smbAccess: true,
      webshareAccess: false,
      truenasAccess: false,
      sshAccess: false,
      shellAccess: false,
    },
    defaultPermissions: true,
    role: null,
    stigPassword: UserStigPasswordOption.DisablePassword,
    homeModeOldValue: '',
  },
};

@Injectable()
export class UserFormStore {
  private api = inject(ApiService);
  private tnDialog = inject(TnDialog);
  private errorHandler = inject(ErrorHandlerService);

  private readonly state = signalState(initialState);

  readonly isStigMode = this.state.isStigMode;
  readonly userConfig = this.state.userConfig;
  readonly setupDetails = this.state.setupDetails;
  readonly homeModeOldValue = computed(() => this.setupDetails().homeModeOldValue);
  readonly role = computed(() => this.setupDetails().role);
  readonly username = computed(() => this.userConfig()?.username);

  /** Compared by value: every access-section change writes a fresh object, even when no flag moved. */
  readonly allowedAccess = computed<AllowedAccessConfig>(() => this.setupDetails().allowedAccess, { equal: isEqual });
  readonly smbAccess = computed(() => this.allowedAccess().smbAccess);
  readonly webshareAccess = computed(() => this.allowedAccess().webshareAccess);
  readonly shellAccess = computed(() => this.allowedAccess().shellAccess);
  readonly truenasAccess = computed(() => this.allowedAccess().truenasAccess);
  readonly sshAccess = computed(() => this.allowedAccess().sshAccess);

  readonly isNewUser = signal<boolean>(true);

  readonly loadStigMode = rxMethod<void>(pipe(
    switchMap(() => this.api.call('system.security.config').pipe(
      tapResponse({
        next: (config) => patchState(this.state, { isStigMode: config.enable_gpos_stig }),
        // The form works without the flag, so a failed lookup is logged and the form stays non-STIG.
        error: (error: unknown) => this.errorHandler.handleError(error),
      }),
    )),
  ));

  private generateOneTimePasswordIfNeeded(user: User): Observable<User> {
    if (this.isNewUser() && this.setupDetails().stigPassword === UserStigPasswordOption.OneTimePassword) {
      return this.api.call('auth.generate_onetime_password', [{ username: this.userConfig()?.username }]).pipe(
        switchMap((password) => {
          this.tnDialog.open(OneTimePasswordCreatedDialog, { data: password });
          return of(user);
        }),
      );
    }
    return of(user);
  }

  createUser(): Observable<User> {
    const oneTimePassword = this.setupDetails().stigPassword === UserStigPasswordOption.OneTimePassword;
    let payload = { ...this.userConfig() };
    payload = {
      ...payload,
      full_name: payload.full_name || payload.username,
      sudo_commands: payload.sudo_commands || [] as string[],
      sudo_commands_nopasswd: payload.sudo_commands_nopasswd || [] as string[],
      uid: payload.uid || null,
      password: oneTimePassword || payload.password_disabled ? null : payload.password,
      random_password: oneTimePassword,
    };

    if (!oneTimePassword) {
      delete payload.random_password;
    }

    return this.api.call('user.create', [toUserCreateArgs(payload)]).pipe(
      switchMap((user) => this.generateOneTimePasswordIfNeeded(toUser(user))),
    );
  }

  updateUser(id: number, payload: UserUpdate): Observable<User> {
    if (payload.home_create) {
      return this.api.call('user.update', [id,
        {
          home_create: true,
          home: payload.home,
        },
      ]).pipe(
        switchMap(() => {
          delete payload.home_create;
          delete payload.group_create;
          delete payload.home;
          return this.api.call('user.update', [id, payload]);
        }),
        map(toUser),
      );
    }
    return this.api.call('user.update', [id, payload]).pipe(map(toUser));
  }

  updateUserConfig(userConfig: UserUpdate): void {
    patchState(this.state, (state) => ({
      userConfig: { ...state.userConfig, ...userConfig },
    }));
  }

  setAllowedAccessConfig(config: AllowedAccessConfig): void {
    patchState(this.state, (state) => ({
      setupDetails: {
        ...state.setupDetails,
        // `merge` skips `undefined`, so a partial config never blanks a flag that is already known.
        allowedAccess: merge({}, state.setupDetails.allowedAccess, config),
      },
    }));
  }

  updateSetupDetails(setupDetails: Partial<UserFormSetupDetails>): void {
    patchState(this.state, (state) => ({
      setupDetails: { ...state.setupDetails, ...setupDetails },
    }));
  }
}
