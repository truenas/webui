import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { tnIconMarker } from '@truenas/ui-components';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyService } from 'app/modules/empty/empty.service';

describe('EmptyService', () => {
  let spectator: SpectatorService<EmptyService>;
  const createService = createServiceFactory(EmptyService);

  beforeEach(() => {
    spectator = createService();
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
  });
});
