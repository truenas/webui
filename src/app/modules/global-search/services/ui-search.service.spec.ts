import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { of, lastValueFrom } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { AuthService } from 'app/services/auth/auth.service';

const mockedUiElements = [
  { hierarchy: ['Technology', 'Internet'], synonyms: ['Web'], requiredRoles: [Role.FullAdmin] },
  { hierarchy: ['Technology', 'Programming'], synonyms: ['Coding'], requiredRoles: [] },
] as UiSearchableElement[];

describe('UiSearchProvider with mocked uiElements', () => {
  let spectator: SpectatorService<UiSearchProvider>;

  const createService = createServiceFactory({
    service: UiSearchProvider,
  });

  describe('Full admin user checks', () => {
    beforeEach(() => {
      spectator = createService({
        providers: [
          mockProvider(AuthService, { hasRole: () => of(true) }),
        ],
      });
      spectator.service.uiElements = mockedUiElements;
    });

    it('should return expected search results on specific search', async () => {
      const searchTerm = 'Internet';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results).toHaveLength(1);
      expect(results[0].hierarchy).toContain('Internet');
    });

    it('should return expected search results without search', async () => {
      const searchTerm = '';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results).toHaveLength(2);
      expect(results[0].hierarchy).toContain('Internet');
      expect(results[1].hierarchy).toContain('Programming');
    });
  });

  describe('Not full admin user checks', () => {
    beforeEach(() => {
      spectator = createService({
        providers: [
          mockProvider(AuthService, { hasRole: () => of(false) }),
        ],
      });
      spectator.service.uiElements = mockedUiElements;
    });

    it('should not show search result where user has no required role', async () => {
      const searchTerm = 'Internet';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results).toHaveLength(0);
    });

    it('should show search result where no role check required', async () => {
      const searchTerm = 'Programming';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results).toHaveLength(1);
      expect(results[0].hierarchy).toContain('Programming');
    });

    it('should return expected search results based on appropriate roles', async () => {
      const searchTerm = '';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results).toHaveLength(1);
      expect(results[0].hierarchy).toContain('Programming');
    });
  });

  describe('Basic behavior', () => {
    beforeEach(() => {
      spectator = createService({
        providers: [
          mockProvider(AuthService, { hasRole: () => of(true) }),
        ],
      });
      spectator.service.uiElements = mockedUiElements;
    });

    it('should limit results to first 50 items & show results for empty string request', async () => {
      const searchTerm = '';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('should return empty array if no matches found', async () => {
      const searchTerm = 'Some Non Matching String';
      const results = await lastValueFrom(spectator.service.search(searchTerm));

      expect(results).toHaveLength(0);
    });
  });
});
