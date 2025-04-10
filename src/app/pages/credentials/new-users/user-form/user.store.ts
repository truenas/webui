import { computed, Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import {
  combineLatest, Observable, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { User, UserUpdate } from 'app/interfaces/user.interface';
import { ApiService } from 'app/modules/websocket/api.service';

const defaultHomePath = '/var/empty';

export interface UserFormSetupDetails {
  allowedAccess: AllowedAccessConfig;
  defaultPermissions: boolean;
  role: Role | 'prompt';
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
  },
};

@Injectable()
export class UserFormStore extends ComponentStore<UserFormState> {
  readonly isStigMode = computed(() => this.state().isStigMode);
  readonly nextUid = computed(() => this.state().nextUid);

  readonly smbAccess = computed(() => this.state().setupDetails.allowedAccess.smbAccess);
  readonly shellAccess = computed(() => this.state().setupDetails.allowedAccess.shellAccess);
  readonly truenasAccess = computed(() => this.state().setupDetails.allowedAccess.truenasAccess);
  readonly sshAccess = computed(() => this.state().setupDetails.allowedAccess.sshAccess);

  readonly role = computed(() => this.state().setupDetails.role);

  readonly userConfig = computed(() => this.state().userConfig);

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

  createUser(): Observable<User> {
    const state = this.state();
    let user = { ...state.userConfig };
    user = {
      ...user,
      full_name: user.full_name || user.username,
      home: user.home || defaultHomePath,
      locked: false,
      shell: '/usr/sbin/nologin',
      smb: state.setupDetails.allowedAccess.smbAccess,
      ssh_password_enabled: false,
      sudo_commands: [] as string[],
      sudo_commands_nopasswd: [] as string[],
      group_create: true,
      uid: this.nextUid(),
    };

    return this.api.call('user.create', [user]);
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
    return {
      ...state,
      allowedAccess: {
        ...config,
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
