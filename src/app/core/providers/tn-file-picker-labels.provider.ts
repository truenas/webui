import { Provider } from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TN_FILE_PICKER_LABELS, type TnFilePickerLabels } from '@truenas/ui-components';
import { translated } from 'app/helpers/translated.helper';

const labelKeys = {
  placeholder: T('Select file or folder'),
  openPicker: T('Open file picker'),
  breadcrumb: T('File path'),
  navigateTo: T('Navigate to {path}'),
  loading: T('Loading...'),
  noItems: T('No items found'),
  selectColumn: T('Select'),
  selectItem: T('Select {name}'),
  openItem: T('Open {name}'),
  nameColumn: T('Name'),
  sizeColumn: T('Size'),
  modifiedColumn: T('Modified'),
  itemsSelected: T('{count, plural, one {# item selected} other {# items selected}}'),
  currentDirectorySelected: T('Current directory selected'),
  noItemsSelected: T('No items selected'),
  clearSelection: T('Clear Selection'),
  select: T('Select'),
  inlineCreateName: T('{action} name'),
  inlineCreateFailed: T('Creation failed'),
  today: T('Today {time}'),
  yesterday: T('Yesterday {time}'),
  pathOutsideRoot: T('Path is outside of {root}'),
  invalidPath: T('Invalid path: {path}'),
  pathValidationFailed: T('Path validation failed'),
  loadFailed: T('Failed to load directory'),
  createFailed: T('Failed to create item'),
  createdOutsideRoot: T('Created item is outside of {root}'),
} satisfies Record<keyof TnFilePickerLabels, string>;

/**
 * Translates everything `tn-file-picker` and its popup render or announce: the placeholder, column
 * headers, footer, button labels, accessible names and the error messages shown in the popup.
 *
 * Labels that carry a value are functions in the library, so the value goes in as a translation
 * parameter here — including the ICU plural for the selected-item count.
 */
export function provideTnFilePickerLabels(): Provider {
  return {
    provide: TN_FILE_PICKER_LABELS,
    useFactory: () => translated<TnFilePickerLabels>((translate) => ({
      placeholder: translate.instant(labelKeys.placeholder),
      openPicker: translate.instant(labelKeys.openPicker),
      breadcrumb: translate.instant(labelKeys.breadcrumb),
      navigateTo: (path) => translate.instant(labelKeys.navigateTo, { path }),
      loading: translate.instant(labelKeys.loading),
      noItems: translate.instant(labelKeys.noItems),
      selectColumn: translate.instant(labelKeys.selectColumn),
      selectItem: (name) => translate.instant(labelKeys.selectItem, { name }),
      openItem: (name) => translate.instant(labelKeys.openItem, { name }),
      nameColumn: translate.instant(labelKeys.nameColumn),
      sizeColumn: translate.instant(labelKeys.sizeColumn),
      modifiedColumn: translate.instant(labelKeys.modifiedColumn),
      itemsSelected: (count) => translate.instant(labelKeys.itemsSelected, { count }),
      currentDirectorySelected: translate.instant(labelKeys.currentDirectorySelected),
      noItemsSelected: translate.instant(labelKeys.noItemsSelected),
      clearSelection: translate.instant(labelKeys.clearSelection),
      select: translate.instant(labelKeys.select),
      inlineCreateName: (action) => translate.instant(labelKeys.inlineCreateName, { action }),
      inlineCreateFailed: translate.instant(labelKeys.inlineCreateFailed),
      today: (time) => translate.instant(labelKeys.today, { time }),
      yesterday: (time) => translate.instant(labelKeys.yesterday, { time }),
      pathOutsideRoot: (root) => translate.instant(labelKeys.pathOutsideRoot, { root }),
      invalidPath: (path) => translate.instant(labelKeys.invalidPath, { path }),
      pathValidationFailed: translate.instant(labelKeys.pathValidationFailed),
      loadFailed: translate.instant(labelKeys.loadFailed),
      createFailed: translate.instant(labelKeys.createFailed),
      createdOutsideRoot: (root) => translate.instant(labelKeys.createdOutsideRoot, { root }),
    })),
  };
}
