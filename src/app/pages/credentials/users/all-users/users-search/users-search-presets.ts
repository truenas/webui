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

  // Multiple types selected - combine with OR
  const typeFilters = selectedTypes.map((type) => buildTypeFilterExpression(type, showBuiltinUsers));
  return [['OR', typeFilters]] as QueryFilters<User>;
}

function buildSingleTypeFilter(type: UserType, showBuiltinUsers: boolean): QueryFilters<User> {
  if (type === UserType.Directory) {
    return [['local', '=', false]];
  }

  // UserType.Local
  if (showBuiltinUsers) {
    return [['local', '=', true]];
  }

  // Local without builtin (except root)
  return [
    ['local', '=', true],
    ['OR', [['builtin', '=', false], ['username', '=', 'root']]],
  ] as QueryFilters<User>;
}

function buildTypeFilterExpression(
  type: UserType,
  showBuiltinUsers: boolean,
): unknown {
  if (type === UserType.Directory) {
    return ['local', '=', false];
  }

  // UserType.Local
  if (showBuiltinUsers) {
    return ['local', '=', true];
  }

  // Local without builtin (except root) - nested structure for OR group
  return [
    ['local', '=', true],
    ['OR', [['builtin', '=', false], ['username', '=', 'root']]],
  ];
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
