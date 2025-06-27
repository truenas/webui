import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { FilterPreset } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';

export function getDefaultPresets(): FilterPreset<User>[] {
  return [
    {
      label: T('Has API Access'),
      query: [['api_keys', '!=', null]],
    },
    {
      label: T('Has SMB Access'),
      query: [['smb', '=', true]],
    },
    {
      label: T('Has Shell Access'),
      query: [['shell', '!=', null]],
    },
    {
      label: T('Has SSH Access'),
      query: [['sshpubkey', '!=', null]],
    },
  ];
}

export function getActiveDirectoryTogglePreset(isActiveDirectoryActive: boolean): FilterPreset<User> {
  if (isActiveDirectoryActive) {
    return {
      label: T('Show Active Directory'),
      query: [['local', '=', false]],
    };
  }
  return {
    label: T('Hide Active Directory'),
    query: [['local', '=', true]],
  };
}

export function getBuiltinTogglePreset(isBuiltinActive: boolean): FilterPreset<User> {
  if (isBuiltinActive) {
    return {
      label: T('Hide Built-in Users'),
      query: [['builtin', '=', false]],
    };
  }
  return {
    label: T('Show Built-in Users'),
    query: [['builtin', '=', true]],
  };
}
