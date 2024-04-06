import { Renderer2, ElementRef } from '@angular/core';
import { SpectatorService, createServiceFactory } from '@ngneat/spectator';
import { mockProvider } from '@ngneat/spectator/jest';
import { UiSearchableElementDirective } from 'app/directives/common/ui-searchable-element.directive';
import { UiSearchableDirectiveService } from 'app/modules/global-search/services/ui-searchable-directive.service';

describe('UiSearchableDirectiveService', () => {
  let spectator: SpectatorService<UiSearchableDirectiveService>;
  let renderer: Renderer2;
  let elementRef: ElementRef<HTMLElement>;

  const createService = createServiceFactory({
    service: UiSearchableDirectiveService,
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
      const directive = new UiSearchableElementDirective(renderer, elementRef, spectator.service);
      directive.ixSearchConfig = { anchor: 'anchor' };

      spectator.service.register(directive);
      expect(spectator.service.registeredDirectives.size).toBe(1);

      spectator.service.unregister(directive);
      expect(spectator.service.registeredDirectives.size).toBe(0);
    });
  });
});
