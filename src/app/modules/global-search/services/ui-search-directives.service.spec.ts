import { Renderer2, ElementRef } from '@angular/core';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { UiSearchDirectivesService } from './ui-search-directives.service';

describe('UiSearchDirectivesService', () => {
  let spectator: SpectatorService<UiSearchDirectivesService>;

  const createService = createServiceFactory({
    service: UiSearchDirectivesService,
    providers: [
      mockProvider(Renderer2),
      mockProvider(ElementRef),
    ],
  });

  describe('basic operations', () => {
    beforeEach(() => {
      spectator = createService();
    });

    it('should check register and unregister', () => {
      const fakeDirective = {
        config: () => ({ anchor: 'anchor' }),
      } as UiSearchDirective;

      spectator.service.register(fakeDirective);
      expect(spectator.service.size()).toBe(1);

      spectator.service.unregister(fakeDirective);
      expect(spectator.service.size()).toBe(0);
    });

    it('should check get method', () => {
      const fakeDirective = {
        config: () => ({ anchor: 'anchor' }),
        id: 'anchor',
      } as UiSearchDirective;

      spectator.service.register(fakeDirective);
      expect(spectator.service.get({ anchor: 'anchor' })).toEqual(fakeDirective);
    });

    it('should check setPendingUiHighlightElement method', () => {
      const element = { anchor: 'anchor' };
      spectator.service.setPendingUiHighlightElement(element);
      expect(spectator.service.pendingUiHighlightElement).toEqual(element);
    });

    it('should check directiveAdded$ BehaviorSubject', () => {
      const fakeDirective = {
        config: () => ({ anchor: 'anchor' }),
      } as UiSearchDirective;

      spectator.service.register(fakeDirective);
      spectator.service.directiveAdded$.subscribe((value) => {
        expect(value).toEqual(fakeDirective);
      });
    });

    it('should check pendingUiHighlightElement getter', () => {
      const element = { anchor: 'anchor' };
      spectator.service.setPendingUiHighlightElement(element);
      expect(spectator.service.pendingUiHighlightElement).toEqual(element);
    });

    it('should check size method', () => {
      const fakeDirective = {
        config: () => ({ anchor: 'anchor' }),
      } as UiSearchDirective;

      spectator.service.register(fakeDirective);
      expect(spectator.service.size()).toBe(1);
    });

    it('should check get method when directive is not registered', () => {
      expect(spectator.service.get({ anchor: 'anchor' })).toBeNull();
    });
  });
});
