import { computed, inject, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import {
  errorsConfig, loadingConfig, noItemsConfig, noSearchResultsConfig,
} from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { langChangeSignal } from 'app/helpers/translated.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { flattenEmptyMessage } from 'app/modules/pipes/flatten-empty-message/flatten-empty-message.pipe';

/** The translated copy an empty state renders, resolved once per (type, language). */
interface EmptyStateCopy {
  /** `EmptyConfig.title`, translated. */
  title: string;
  /** `EmptyConfig.message`, translated and flattened to plain text. */
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmptyService {
  private readonly translate = inject(TranslateService);

  /**
   * Read by {@link copyForType} so its `instant()` calls re-run whenever the catalog they resolve
   * against changes — both in a `computed` and, since a template expression is itself a reactive
   * context, in the templates that call {@link titleForType}/{@link descriptionForType} directly.
   */
  private readonly langChange = langChangeSignal();

  /**
   * Memoizes the resolved copy, because most call sites are template expressions — a `tn-table`'s
   * `[emptyMessage]`/`[emptyDescription]` are re-evaluated on every change-detection pass whether
   * or not the empty state is rendered, and a page with live metrics ticking runs a lot of them.
   * Without this, each pass would cost a `translate.instant()` plus (for the description) two
   * regex passes and a string allocation, per table, for a value that changes almost never.
   *
   * A fresh cache per catalog, so invalidation is structural — the same shape `perRow` uses in
   * `ix-table/utils`. Keyed on the empty *type*, of which there are six, so it cannot grow.
   */
  private readonly copyCache = computed(() => {
    this.langChange();
    return new Map<EmptyType | null, EmptyStateCopy>();
  });

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
   * Translated title for `tn-table [emptyMessage]` / `tn-empty [title]`.
   *
   * The one place this is derived: every call site used to inline
   * `defaultEmptyConfig(type).title | translate` — or, off a template, a `translated()` wrapper
   * around `instant()`, since `instant()` alone freezes on whichever locale was loaded when it
   * ran. Both halves of that (the catalog lookup and the language dependency) live here now, so a
   * call site binds one expression. Mirrors {@link iconForType}: give it the empty *type*, not a
   * resolved config. Empty for a state whose config carries no `title`, which none do today.
   */
  titleForType(type?: EmptyType | null): string {
    return this.copyForType(type).title;
  }

  /**
   * Translated body copy for `tn-table [emptyDescription]` / `tn-empty [description]`, resolved
   * from the same catalog {@link titleForType} takes the title from. Empty for a state whose
   * config carries no `message`, which is most of them.
   *
   * The one place this is derived, deliberately: every call site used to inline
   * `conf.message ? (conf.message | translate) : ''`, which renders a message's markup as literal
   * text. The catalog's messages were written for `<ix-empty>`, which took HTML, and several still
   * carry `<br>`/`<p>` — so the flattening has to sit with the lookup rather than being remembered
   * at ~30 templates.
   */
  descriptionForType(type?: EmptyType | null): string {
    return this.copyForType(type).description;
  }

  /** Resolves — and memoizes, see {@link copyCache} — both halves of a state's copy at once. */
  private copyForType(type?: EmptyType | null): EmptyStateCopy {
    const cache = this.copyCache();
    // `undefined` and `null` resolve to the same default config, so they share a cache entry.
    const key = type ?? null;
    const cached = cache.get(key);
    if (cached) {
      return cached;
    }

    // `title` and `message` are both optional on EmptyConfig.
    const { title, message } = this.defaultEmptyConfig(type);
    const copy: EmptyStateCopy = {
      title: title ? this.translate.instant(title) : '',
      description: message ? flattenEmptyMessage(this.translate.instant(message)) : '',
    };
    cache.set(key, copy);

    return copy;
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
