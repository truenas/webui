import { Renderer2, ElementRef } from '@angular/core';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { UiSearchDirective } from 'app/directives/common/ui-search.directive';
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
  });
});
