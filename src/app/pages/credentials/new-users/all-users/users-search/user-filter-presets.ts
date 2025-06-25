import { TranslateService } from '@ngx-translate/core';
import { FilterPreset } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';

export class UserFilterPresets {
  constructor(private translate: TranslateService) {}

  getDefaultPresets(): FilterPreset<User>[] {
    return [
      {
        label: this.translate.instant('Has API Access'),
        query: [['api_keys', '!=', null]],
      },
      {
        label: this.translate.instant('Has SMB Access'),
        query: [['smb', '=', true]],
      },
      {
        label: this.translate.instant('Has Shell Access'),
        query: [['shell', '!=', null]],
      },
      {
        label: this.translate.instant('Has SSH Access'),
        query: [['sshpubkey', '!=', null]],
      },
    ];
  }

  getActiveDirectoryPreset(): FilterPreset<User> {
    return {
      label: this.translate.instant('From Active Directory'),
      query: [['local', '=', false]],
    };
  }

  getBuiltinTogglePreset(isBuiltinActive: boolean): FilterPreset<User> {
    if (isBuiltinActive) {
      return {
        label: this.translate.instant('Hide Built-in Users'),
        query: [['builtin', '=', false]],
      };
    }
    return {
      label: this.translate.instant('Show Built-in Users'),
      query: [['builtin', '=', true]],
    };
  }
}
