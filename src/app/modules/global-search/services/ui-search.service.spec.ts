import { createServiceFactory, SpectatorService, mockProvider } from '@ngneat/spectator/jest';
import { MockDirective } from 'ng-mocks';
import { of, lastValueFrom } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { AuthService } from 'app/modules/auth/auth.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { NavigationService } from 'app/services/navigation/navigation.service';

jest.mock('app/../assets/ui-searchable-elements.json', () => [
  { hierarchy: ['Technology', 'Programming'], synonyms: ['Coding'], requiredRoles: [] },
  { hierarchy: ['Technology', 'Internet'], synonyms: ['Web', 'Programs', 'PR'], requiredRoles: ['FullAdmin'] },
]);

describe('UiSearchProvider with mocked uiElements', () => {
  let spectator: SpectatorService<UiSearchProvider>;

  const createService = createServiceFactory({
    service: UiSearchProvider,
    declarations: [MockDirective(UiSearchDirective)],
  });

  describe('Full admin user checks', () => {
    beforeEach(() => {
      spectator = createService({
        providers: [
          mockProvider(AuthService, { hasRole: () => of(true) }),
          mockProvider(UiSearchDirectivesService),
          mockProvider(NavigationService, {
            hasFailover$: of(true),
            hasEnclosure$: of(true),
            hasVms$: of(true),
            hasApps$: of(true),
          }),
        ],
      });
    });

    it('should return expected search results on specific search with fuzzy results', async () => {
      const searchTerm = 'tech';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(2);
      expect(results[0].hierarchy).toContain('Programming');
      expect(results[1].hierarchy).toContain('Internet');
    });

    it('should return fuzzy search results on specific term with a typo', async () => {
      const searchTerm = 'intrnet';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(1);
      expect(results[0].hierarchy).toContain('Internet');
    });

    it('should search by synonyms', async () => {
      const searchTerm = 'web';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(1);
      expect(results[0].hierarchy).toContain('Internet');
    });
  });

  describe('Not full admin user checks', () => {
    beforeEach(() => {
      spectator = createService({
        providers: [
          mockProvider(AuthService, { hasRole: () => of(false) }),
          mockProvider(UiSearchDirectivesService),
          mockProvider(NavigationService, {
            hasFailover$: of(true),
            hasEnclosure$: of(true),
            hasVms$: of(true),
            hasApps$: of(true),
          }),
        ],
      });
    });

    it('should not show search result where user has no required role', async () => {
      const searchTerm = 'internet';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(0);
    });

    it('should return expected search results based on appropriate roles', async () => {
      const searchTerm = 'pro';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(1);
      expect(results[0].hierarchy).toContain('Programming');
    });
  });

  describe('Basic behavior', () => {
    beforeEach(() => {
      spectator = createService({
        providers: [
          mockProvider(AuthService, { hasRole: () => of(true) }),
          mockProvider(UiSearchDirectivesService),
          mockProvider(NavigationService, {
            hasFailover$: of(true),
            hasEnclosure$: of(true),
            hasVms$: of(true),
            hasApps$: of(true),
          }),
        ],
      });
    });

    it('should limit results to first 50 items & show results for empty string request', async () => {
      const searchTerm = '';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results.length).toBeLessThanOrEqual(50);
    });

    it('should return empty array if no matches found', async () => {
      const searchTerm = 'Some Non Matching String';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(0);
    });

    it('should first show hierarchy match and then synonyms', async () => {
      const searchTerm = 'program';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(2);
      expect(results[0].hierarchy).toContain('Programming');
      expect(results[1].synonyms).toContain('Programs');
    });

    it('should first show full match element', async () => {
      const searchTerm = 'pr';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(2);
      expect(results[0].hierarchy).toEqual(['Technology', 'Internet']);
      expect(results[1].hierarchy).toEqual(['Technology', 'Programming']);
    });

    it('should first show first letter match element', async () => {
      const searchTerm = 'i';
      const results = await lastValueFrom(spectator.service.search(searchTerm, 10));

      expect(results).toHaveLength(2);
      expect(results[0].hierarchy).toEqual(['Technology', 'Internet']);
      expect(results[1].hierarchy).toEqual(['Technology', 'Programming']);
    });
  });
});
