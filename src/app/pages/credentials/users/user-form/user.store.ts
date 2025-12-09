import { computed, Injectable, signal, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentStore } from '@ngrx/component-store';
import { merge } from 'lodash-es';
import {
  combineLatest, Observable, of, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { OneTimePasswordCreatedDialog } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';

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
export class UserFormStore extends ComponentStore<UserFormState> {
  private api = inject(ApiService);
  private matDialog = inject(MatDialog);

  readonly isStigMode = computed(() => this.state().isStigMode);
  readonly homeModeOldValue = computed(() => this.state().setupDetails.homeModeOldValue);

  readonly smbAccess = computed(() => this.state().setupDetails.allowedAccess.smbAccess);
  readonly webshareAccess = computed(() => this.state().setupDetails.allowedAccess.webshareAccess);
  readonly shellAccess = computed(() => this.state().setupDetails.allowedAccess.shellAccess);
  readonly truenasAccess = computed(() => this.state().setupDetails.allowedAccess.truenasAccess);
  readonly sshAccess = computed(() => this.state().setupDetails.allowedAccess.sshAccess);

  readonly role = computed(() => this.state().setupDetails.role);

  readonly userConfig = computed(() => this.state().userConfig);
  readonly isNewUser = signal<boolean>(true);

  readonly initialize = this.effect((trigger$) => {
    return trigger$.pipe(
      switchMap(() => combineLatest([
        this.setStigMode(),
      ])),
    );
  });

  constructor() {
    super(initialState);
  }

  private setStigMode(): Observable<SystemSecurityConfig> {
    return this.api.call('system.security.config').pipe(
      tap((config: SystemSecurityConfig) => {
        this.patchState({ isStigMode: config.enable_gpos_stig });
      }),
    );
  }

  private generateOneTimePasswordIfNeeded(user: User): Observable<User> {
    if (this.isNewUser() && this.state().setupDetails.stigPassword === UserStigPasswordOption.OneTimePassword) {
      return this.api.call('auth.generate_onetime_password', [{ username: this.userConfig()?.username }]).pipe(
        switchMap((password) => {
          this.matDialog.open(OneTimePasswordCreatedDialog, { data: password });
          return of(user);
        }),
      );
    }
    return of(user);
  }

  createUser(): Observable<User> {
    const state = this.state();
    const oneTimePassword = state.setupDetails.stigPassword === UserStigPasswordOption.OneTimePassword;
    let payload = { ...state.userConfig };
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

    return this.api.call('user.create', [payload]).pipe(
      switchMap((user) => this.generateOneTimePasswordIfNeeded(user)),
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
      );
    }
    return this.api.call('user.update', [id, payload]);
  }

  updateUserConfig = this.updater((state, userConfig: UserUpdate) => {
    return {
      ...state,
      userConfig: {
        ...state.userConfig,
        ...userConfig,
      },
    };
  });

  setAllowedAccessConfig = this.updater((state, config: AllowedAccessConfig) => {
    return merge({}, state, {
      setupDetails: {
        allowedAccess: config,
      },
    });
  });

  updateSetupDetails = this.updater((state, setupDetails: Partial<UserFormSetupDetails>) => {
    return {
      ...state,
      setupDetails: {
        ...state.setupDetails,
        ...setupDetails,
      },
    };
  });
}
