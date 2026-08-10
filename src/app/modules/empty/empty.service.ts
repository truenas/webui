import { inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import {
  errorsConfig, loadingConfig, noItemsConfig, noSearchResultsConfig,
} from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { langChangeSignal } from 'app/helpers/translated.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { flattenEmptyMessage } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';

@Injectable({
  providedIn: 'root',
})
export class EmptyService {
  private readonly translate = inject(TranslateService);

  /**
   * Read by {@link descriptionForType} so its `instant()` call re-runs on a language change —
   * both in a `computed` and, since a template expression is itself a reactive context, in the
   * templates that call the method directly.
   */
  private readonly langChange = langChangeSignal();

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
   * Translated body copy for `tn-table [emptyDescription]` / `tn-empty [description]`, resolved
   * from the same catalog `defaultEmptyConfig` supplies the title from. Empty for a state whose
   * config carries no `message`, which is most of them.
   *
   * The one place this is derived, deliberately: every call site used to inline
   * `conf.message ? (conf.message | translate) : ''`, which renders a message's markup as literal
   * text. The catalog's messages were written for `<ix-empty>`, which took HTML, and several still
   * carry `<br>`/`<p>` — so the flattening has to sit with the lookup rather than being remembered
   * at ~30 templates. Mirrors {@link iconForType}: give it the empty *type*, not a resolved config.
   */
  descriptionForType(type?: EmptyType | null): string {
    this.langChange();
    const message = this.defaultEmptyConfig(type).message;
    return message ? flattenEmptyMessage(this.translate.instant(message)) : '';
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
