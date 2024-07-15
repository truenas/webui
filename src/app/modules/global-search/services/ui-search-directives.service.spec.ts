import { Renderer2, ElementRef } from '@angular/core';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { UiSearchDirectivesService } from './ui-search-directives.service';

describe('UiSearchDirectivesService', () => {
  let spectator: SpectatorService<UiSearchDirectivesService>;
  let renderer: Renderer2;
  let elementRef: ElementRef<HTMLElement>;

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
      renderer = spectator.inject(Renderer2);
      elementRef = spectator.inject(ElementRef);
    });

    it('should check register and unregister', () => {
      const directive = new UiSearchDirective(renderer, elementRef, spectator.service);
      directive.config = { anchor: 'anchor' };

      spectator.service.register(directive);
      expect(spectator.service.size()).toBe(1);

      spectator.service.unregister(directive);
      expect(spectator.service.size()).toBe(0);
    });

    it('should check get method', () => {
      const directive = new UiSearchDirective(renderer, elementRef, spectator.service);
      directive.config = { anchor: 'anchor' };

      spectator.service.register(directive);
      expect(spectator.service.get({ anchor: 'anchor' })).toEqual(directive);
    });

    it('should check setPendingUiHighlightElement method', () => {
      const element = { anchor: 'anchor' };
      spectator.service.setPendingUiHighlightElement(element);
      expect(spectator.service.pendingUiHighlightElement).toEqual(element);
    });

    it('should check directiveAdded$ BehaviorSubject', () => {
      const directive = new UiSearchDirective(renderer, elementRef, spectator.service);
      directive.config = { anchor: 'anchor' };

      spectator.service.register(directive);
      spectator.service.directiveAdded$.subscribe((value) => {
        expect(value).toEqual(directive);
      });
    });

    it('should check pendingUiHighlightElement getter', () => {
      const element = { anchor: 'anchor' };
      spectator.service.setPendingUiHighlightElement(element);
      expect(spectator.service.pendingUiHighlightElement).toEqual(element);
    });

    it('should check size method', () => {
      const directive = new UiSearchDirective(renderer, elementRef, spectator.service);
      directive.config = { anchor: 'anchor' };

      spectator.service.register(directive);
      expect(spectator.service.size()).toBe(1);
    });

    it('should check get method when directive is not registered', () => {
      expect(spectator.service.get({ anchor: 'anchor' })).toBeNull();
    });
  });
});
