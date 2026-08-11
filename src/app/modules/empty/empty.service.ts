import { Injectable } from '@angular/core';
import { tnIconMarker } from '@truenas/ui-components';
import {
  errorsConfig, loadingConfig, noItemsConfig, noSearchResultsConfig,
} from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

@Injectable({
  providedIn: 'root',
})
export class EmptyService {
  defaultEmptyConfig(type?: EmptyType | null): EmptyConfig {
    switch (type) {
      case EmptyType.Loading:
        return loadingConfig;
      case EmptyType.Errors:
        return errorsConfig;
      case EmptyType.NoSearchResults:
        return noSearchResultsConfig;
      default:
        return noItemsConfig;
    }
  }

  /**
   * Resolves the icon for an empty state from its type. Mirrors the icon mapping
   * historically rendered by ix-empty so tn-table's `[emptyIcon]` reflects the
   * state (error/search/no-data) instead of a static page-specific icon.
   *
   * ⚠ `tn-empty`'s `iconLibrary` defaults to `mdi` and `tn-table` gives its inner
   * `tn-empty` no library, so a name that already carries a *different* library
   * prefix is prefixed a second time (`app-x` → `mdi-app-x`) and falls back to a
   * two-letter abbreviation. Every marker below is therefore `mdi-*` except the
   * loading one, which the table never renders (its empty state is gated on
   * `!loading()`). Pass a non-mdi icon only where you can also set `iconLibrary`.
   */
  iconForType(type?: EmptyType | null): string {
    switch (type) {
      case EmptyType.Loading:
        return tnIconMarker('truenas-logo', 'custom');
      case EmptyType.FirstUse:
        return tnIconMarker('rocket', 'mdi');
      case EmptyType.Errors:
        return tnIconMarker('alert-octagon', 'mdi');
      case EmptyType.NoSearchResults:
        return tnIconMarker('magnify-scan', 'mdi');
      case EmptyType.None:
        return '';
      case EmptyType.NoPageData:
      default:
        return tnIconMarker('format-list-text', 'mdi');
    }
  }

  /**
   * Resolves the empty-state icon, preferring the state icon for error /
   * no-search-results states so they stay visually distinct, and falling back to
   * a page-specific `pageIcon` for the first-use / no-data states, where the
   * feature's own glyph is more meaningful than the generic list icon.
   */
  iconForTypeOrDefault(type: EmptyType | null | undefined, pageIcon: string): string {
    switch (type) {
      case EmptyType.Errors:
      case EmptyType.NoSearchResults:
        return this.iconForType(type);
      default:
        return pageIcon;
    }
  }
}
