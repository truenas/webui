import {
  computed, Injectable, signal,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest, Observable, of, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';
import { OneTimePasswordCreatedDialog } from 'app/pages/credentials/users/one-time-password-created-dialog/one-time-password-created-dialog.component';
import { UserStigPasswordOption } from 'app/pages/credentials/users/user-form/user-form.component';

export const defaultHomePath = '/var/empty';
export const defaultRole = 'prompt';

export interface UserFormSetupDetails {
  allowedAccess: AllowedAccessConfig;
  defaultPermissions: boolean;
  role: Role | 'prompt';
  stigPassword: UserStigPasswordOption;
  homeModeOldValue: string;
}

export interface AllowedAccessConfig {
  smbAccess: boolean;
  truenasAccess: boolean;
  sshAccess: boolean;
  shellAccess: boolean;
}

export interface UserFormState {
  isStigMode: boolean;
  nextUid: number;
  userConfig: UserUpdate;
  setupDetails: UserFormSetupDetails;
}

const initialState: UserFormState = {
  isStigMode: false,
  nextUid: null as number,
  userConfig: null,
  setupDetails: {
    allowedAccess: {
      smbAccess: true,
      truenasAccess: false,
      sshAccess: false,
      shellAccess: false,
    },
    defaultPermissions: true,
    role: 'prompt',
    stigPassword: UserStigPasswordOption.DisablePassword,
    homeModeOldValue: '',
  },
};

@Injectable()
export class UserFormStore extends ComponentStore<UserFormState> {
  readonly isStigMode = computed(() => this.state().isStigMode);
  readonly nextUid = computed(() => this.state().nextUid);
  readonly homeModeOldValue = computed(() => this.state().setupDetails.homeModeOldValue);

  readonly smbAccess = computed(() => this.state().setupDetails.allowedAccess.smbAccess);
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
        this.setNextUserId(),
      ])),
    );
  });

  constructor(
    private api: ApiService,
    private matDialog: MatDialog,
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
      username: payload.username,
      email: payload.email,
      full_name: payload.full_name || payload.username,
      home: payload.home || defaultHomePath,
      shell: payload.shell,
      smb: state.setupDetails.allowedAccess.smbAccess || false,
      ssh_password_enabled: payload.ssh_password_enabled || false,
      sudo_commands: payload.sudo_commands || [] as string[],
      sudo_commands_nopasswd: payload.sudo_commands_nopasswd || [] as string[],
      group_create: payload.group_create || true,
      uid: payload.uid || this.nextUid(),
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

  setAllowedAccessConfig = this.updater((state, allowedAccess: AllowedAccessConfig) => {
    return {
      ...state,
      setupDetails: {
        ...state.setupDetails,
        allowedAccess,
      },
    };
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
