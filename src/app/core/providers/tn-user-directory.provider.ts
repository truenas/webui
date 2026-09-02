import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import {
  TN_USER_DIRECTORY, TN_USER_DIRECTORY_LABELS, type TnUserDirectoryLabels,
} from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';
import { TrueNasUserDirectory } from 'app/services/truenas-user-directory.service';

/**
 * The strings marked for extraction. `{name}` and `{names}` are the library's
 * own placeholders, substituted after translation — a translator must keep them
 * verbatim, which is why they are marked here rather than interpolated by
 * `translate.instant`.
 */
const labelKeys: Record<keyof TnUserDirectoryLabels, string> = {
  userPlaceholder: T('Type to search users...'),
  groupPlaceholder: T('Type to search groups...'),
  addUser: T('Add New'),
  userDoesNotExist: T('User "{name}" does not exist'),
  groupDoesNotExist: T('Group "{name}" does not exist'),
  usersDoNotExist: T('The following users do not exist: {names}'),
  groupsDoNotExist: T('The following groups do not exist: {names}'),
};

/**
 * Points every `tn-user-*` / `tn-group-*` field at this app's user store, and
 * translates the copy they share.
 *
 * Without the directory the fields throw on construction rather than rendering
 * an empty list — a missing provider should not look like a directory outage.
 */
export function provideTnUserDirectory(): Provider[] {
  return [
    {
      provide: TN_USER_DIRECTORY,
      useExisting: TrueNasUserDirectory,
    },
    {
      provide: TN_USER_DIRECTORY_LABELS,
      useFactory: () => translated<TnUserDirectoryLabels>((translate) => ({
        userPlaceholder: translate.instant(labelKeys.userPlaceholder),
        groupPlaceholder: translate.instant(labelKeys.groupPlaceholder),
        addUser: translate.instant(labelKeys.addUser),
        userDoesNotExist: translate.instant(labelKeys.userDoesNotExist),
        groupDoesNotExist: translate.instant(labelKeys.groupDoesNotExist),
        usersDoNotExist: translate.instant(labelKeys.usersDoNotExist),
        groupsDoNotExist: translate.instant(labelKeys.groupsDoNotExist),
      })),
    },
  ];
}
