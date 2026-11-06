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
  /**
   * `EmptyConfig.message`, translated and flattened to plain text. `''` where the config carries
   * no message, which is the common case: `tn-empty` renders its description block under
   * `@if (description())`, so an empty string reads as "no description" exactly like the
   * `undefined` the call sites passed before, and no empty block or its margin is painted.
   */
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
   * Memoizes the resolved copy: a `tn-table`'s `[emptyMessage]`/`[emptyDescription]` re-evaluate on
   * every change-detection pass, rendered or not, and each would otherwise cost a `translate.instant()`
   * and regex passes. A fresh cache per catalog makes invalidation structural; keyed on the six empty
   * types, it can't grow.
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
   * Translated title for `tn-table [emptyMessage]` / `tn-empty [title]`. It tracks the language, which
   * `instant()` alone wouldn't, so a call site binds one expression. Like {@link iconForType}, it takes
   * the empty *type*, not a resolved config.
   */
  titleForType(type?: EmptyType | null): string {
    return this.copyForType(type).title;
  }

  /**
   * Translated body copy for `tn-table [emptyDescription]` / `tn-empty [description]`, from the same
   * catalog as {@link titleForType}; empty when the config has no `message`. It is flattened like the
   * `flattenEmptyMessage` pipe does for page-specific configs that still carry `<br>`/`<p>`, so routing
   * one of those through here can't regress into literal markup.
   */
  descriptionForType(type?: EmptyType | null): string {
    return this.copyForType(type).description;
  }

  /**
   * Translated loading text for `tn-table [loadingMessage]`.
   *
   * The library takes no i18n dependency, so it can only default that input to a bare English
   * literal and expects the app to pass a translated one. Resolved here, out of the same catalog
   * {@link titleForType} reads, rather than written out as `'Loading...' | translate` per template:
   * webui carried two spellings of that string (`Loading...` and `Loading…`) which translated to
   * separate entries, and every fresh copy is a chance to add a third.
   */
  loadingMessage(): string {
    return this.titleForType(EmptyType.Loading);
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
   * Resolves the empty-state icon from its type, so tn-table's `[emptyIcon]` reflects the state.
   * `tn-table` gives its inner `tn-empty` no `iconLibrary`, which defaults to `mdi`, so another
   * library's icon gets double-prefixed (`app-x` → `mdi-app-x`) and falls back to an abbreviation.
   * Hence every marker here is `mdi-*`, except loading, which the table never renders.
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
