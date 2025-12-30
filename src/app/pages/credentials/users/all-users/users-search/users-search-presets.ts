import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { FilterPreset, QueryFilters } from 'app/interfaces/query-api.interface';
import { User } from 'app/interfaces/user.interface';

export enum UserType {
  Local = 'local',
  Directory = 'directory',
}

/**
 * Builds query filters for user type selection.
 * Used by both AllUsersComponent (for default params) and UsersSearchComponent (for search).
 */
export function buildUserTypeFilters(
  selectedTypes: UserType[],
  showBuiltinUsers: boolean,
): QueryFilters<User> {
  if (selectedTypes.length === 0) {
    return [];
  }

  if (selectedTypes.length === 1) {
    const [type] = selectedTypes;
    return buildSingleTypeFilter(type, showBuiltinUsers);
  }

  // Both Local and Directory selected
  if (showBuiltinUsers) {
    // Show all users - no filter needed
    return [];
  }

  // Hide builtin users: builtin=false OR local=false
  // This shows:
  //   - Local non-builtin users (local=true, builtin=false) ✓
  //   - Directory users (local=false, builtin=N/A) ✓
  // This hides:
  //   - Local builtin users (local=true, builtin=true) ✗
  return [['OR', [['builtin', '=', false], ['local', '=', false]]]] as QueryFilters<User>;
}

function buildSingleTypeFilter(type: UserType, showBuiltinUsers: boolean): QueryFilters<User> {
  if (type === UserType.Directory) {
    // Show directory users only (local=false)
    return [['local', '=', false]];
  }

  // UserType.Local
  if (showBuiltinUsers) {
    // Show all local users including built-in (local=true, any builtin value)
    return [['local', '=', true]];
  }

  // Show local users excluding built-in (local=true, builtin=false)
  return [
    ['local', '=', true],
    ['builtin', '=', false],
  ] as QueryFilters<User>;
}

/**
 * Returns the default user type filters (Local + Directory, builtin hidden).
 * Convenience function for initializing data providers.
 */
export function getDefaultUserTypeFilters(): QueryFilters<User> {
  return buildUserTypeFilters([UserType.Local, UserType.Directory], false);
}

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
