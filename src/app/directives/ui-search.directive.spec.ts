import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { NavigateAndHighlightService } from 'app/directives/navigate-and-interact/navigate-and-highlight.service';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';

describe('UiSearchDirective', () => {
  let spectator: SpectatorDirective<UiSearchDirective>;
  const config = { hierarchy: ['Storage', 'Disks'], anchor: 'storage-disks' } as UiSearchableElement;

  const createDirective = createDirectiveFactory({
    directive: UiSearchDirective,
    providers: [
      mockProvider(NavigateAndHighlightService),
    ],
  });

  it('registers itself and sets id and aria-label on the host', () => {
    spectator = createDirective('<div [ixUiSearch]="config"></div>', { hostProps: { config } });

    expect(spectator.inject(UiSearchDirectivesService).get(config)).toBe(spectator.directive);
    expect(spectator.element).toHaveAttribute('id', 'storage-disks');
    expect(spectator.element).toHaveAttribute('aria-label', 'Disks');
  });

  it('unregisters itself on destroy', () => {
    spectator = createDirective('<div [ixUiSearch]="config"></div>', { hostProps: { config } });

    spectator.fixture.destroy();

    expect(spectator.inject(UiSearchDirectivesService).get(config)).toBeNull();
  });

  it('does not hide the original error when its view fails before the input is set', () => {
    spectator = createDirective(
      '<div [title]="fail()" [ixUiSearch]="config"></div>',
      {
        detectChanges: false,
        hostProps: {
          config,
          fail: () => {
            throw new Error('Original error');
          },
        },
      },
    );

    expect(() => spectator.detectChanges()).toThrow('Original error');
    expect(() => spectator.fixture.destroy()).not.toThrow();
  });
});
