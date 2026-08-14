import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { LangChangeEvent, TranslateService, TranslationChangeEvent } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyService } from 'app/modules/empty/empty.service';

describe('EmptyService', () => {
  let spectator: SpectatorService<EmptyService>;
  const createService = createServiceFactory(EmptyService);

  beforeEach(() => {
    spectator = createService();
  });

  describe('titleForType', () => {
    it('returns the translated config title', () => {
      expect(spectator.service.titleForType(EmptyType.Errors)).toBe('Cannot retrieve response');
      expect(spectator.service.titleForType(EmptyType.NoSearchResults)).toBe('No Search Results.');
      // The default branch too, for a type the enum doesn't cover.
      expect(spectator.service.titleForType()).toBe('No records have been added yet');
    });
  });

  describe('loadingMessage', () => {
    it('returns the loading title from the same catalog, so tn-table gets one translated spelling', () => {
      expect(spectator.service.loadingMessage()).toBe(spectator.service.titleForType(EmptyType.Loading));
      expect(spectator.service.loadingMessage()).toBe('Loading...');
    });
  });

  describe('descriptionForType', () => {
    it('returns the config message for a state that carries one', () => {
      expect(spectator.service.descriptionForType(EmptyType.NoSearchResults)).toBe('No matching results found');
    });

    it('returns an empty string for the states whose config is title-only', () => {
      expect(spectator.service.descriptionForType(EmptyType.NoPageData)).toBe('');
      expect(spectator.service.descriptionForType(EmptyType.Errors)).toBe('');
      // The default branch too, for a type the enum doesn't cover.
      expect(spectator.service.descriptionForType()).toBe('');
    });

    it('flattens markup, since the catalog messages were written for ix-empty', () => {
      jest.spyOn(spectator.inject(TranslateService), 'instant')
        .mockReturnValue('First line.<br>\nSecond line.');

      expect(spectator.service.descriptionForType(EmptyType.NoSearchResults)).toBe('First line. Second line.');
    });
  });

  describe('memoization', () => {
    it('translates a type once, however many times a template asks for its copy', () => {
      const instant = jest.spyOn(spectator.inject(TranslateService), 'instant');

      for (let pass = 0; pass < 5; pass++) {
        spectator.service.titleForType(EmptyType.NoSearchResults);
        spectator.service.descriptionForType(EmptyType.NoSearchResults);
      }

      // Once for the title, once for the message — the other nine calls are cache hits.
      expect(instant).toHaveBeenCalledTimes(2);
    });

    it('re-translates after a language change', () => {
      expect(spectator.service.titleForType(EmptyType.Errors)).toBe('Cannot retrieve response');

      const translate = spectator.inject(TranslateService);
      jest.spyOn(translate, 'instant').mockReturnValue('Antwort kann nicht abgerufen werden');
      translate.onLangChange.emit({ lang: 'de', translations: {} } as LangChangeEvent);

      expect(spectator.service.titleForType(EmptyType.Errors)).toBe('Antwort kann nicht abgerufen werden');
    });

    it('re-translates when a catalog arrives after the first lookup', () => {
      // An `instant()` that runs before the active language's catalog is loaded returns the key;
      // without this invalidation the cache would keep serving that key until a language switch.
      expect(spectator.service.titleForType(EmptyType.Errors)).toBe('Cannot retrieve response');

      const translate = spectator.inject(TranslateService);
      jest.spyOn(translate, 'instant').mockReturnValue('Antwort kann nicht abgerufen werden');
      translate.onTranslationChange.emit({ lang: 'de', translations: {} } as TranslationChangeEvent);

      expect(spectator.service.titleForType(EmptyType.Errors)).toBe('Antwort kann nicht abgerufen werden');
    });
  });

  describe('iconForType', () => {
    it('maps each empty type to its state icon', () => {
      expect(spectator.service.iconForType(EmptyType.Errors)).toBe(tnIconMarker('alert-octagon', 'mdi'));
      expect(spectator.service.iconForType(EmptyType.NoSearchResults)).toBe(tnIconMarker('magnify-scan', 'mdi'));
      expect(spectator.service.iconForType(EmptyType.None)).toBe('');
    });

    it('falls back to the generic list icon for no-data', () => {
      expect(spectator.service.iconForType(EmptyType.NoPageData)).toBe(tnIconMarker('format-list-text', 'mdi'));
    });
  });

  describe('iconForTypeOrDefault', () => {
    const pageIcon = tnIconMarker('cloud-outline', 'mdi');

    it('uses the state icon for error and no-search states', () => {
      expect(spectator.service.iconForTypeOrDefault(EmptyType.Errors, pageIcon))
        .toBe(tnIconMarker('alert-octagon', 'mdi'));
      expect(spectator.service.iconForTypeOrDefault(EmptyType.NoSearchResults, pageIcon))
        .toBe(tnIconMarker('magnify-scan', 'mdi'));
    });

    it('falls back to the page icon for no-data and first-use states', () => {
      expect(spectator.service.iconForTypeOrDefault(EmptyType.NoPageData, pageIcon)).toBe(pageIcon);
      expect(spectator.service.iconForTypeOrDefault(EmptyType.FirstUse, pageIcon)).toBe(pageIcon);
      expect(spectator.service.iconForTypeOrDefault(undefined, pageIcon)).toBe(pageIcon);
    });

    it('returns an mdi marker for every type a table can render, so tn-empty cannot double-prefix', () => {
      // tn-table gives its inner tn-empty no `iconLibrary`, so it defaults to mdi and a marker
      // carrying a different prefix would be prefixed twice and fall back to a two-letter
      // abbreviation. Loading is exempt — the table gates its empty state on `!loading()`.
      const icons = Object.values(EmptyType)
        .filter((type) => type !== EmptyType.Loading)
        .map((type) => spectator.service.iconForType(type))
        // EmptyType.None renders no icon at all.
        .filter(Boolean)
        // The default branch too, for a type the enum doesn't cover.
        .concat(spectator.service.iconForType());

      expect(icons.every((icon) => icon.startsWith('mdi-'))).toBe(true);
    });
  });
});
