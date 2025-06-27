import { TranslateService } from '@ngx-translate/core';
import { FilterPreset } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';

export function getDefaultPresets(translate: TranslateService): FilterPreset<User>[] {
  return [
    {
      label: translate.instant('Has API Access'),
      query: [['api_keys', '!=', null]],
    },
    {
      label: translate.instant('Has SMB Access'),
      query: [['smb', '=', true]],
    },
    {
      label: translate.instant('Has Shell Access'),
      query: [['shell', '!=', null]],
    },
    {
      label: translate.instant('Has SSH Access'),
      query: [['sshpubkey', '!=', null]],
    },
  ];
}

export function getActiveDirectoryTogglePreset(
  translate: TranslateService,
  isActiveDirectoryActive: boolean,
): FilterPreset<User> {
  if (isActiveDirectoryActive) {
    return {
      label: translate.instant('Show Active Directory'),
      query: [['local', '=', false]],
    };
  }
  return {
    label: translate.instant('Hide Active Directory'),
    query: [['local', '=', true]],
  };
}

export function getBuiltinTogglePreset(translate: TranslateService, isBuiltinActive: boolean): FilterPreset<User> {
  if (isBuiltinActive) {
    return {
      label: translate.instant('Hide Built-in Users'),
      query: [['builtin', '=', false]],
    };
  }
  return {
    label: translate.instant('Show Built-in Users'),
    query: [['builtin', '=', true]],
  };
}
