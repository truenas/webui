import { createDirectiveFactory, mockProvider, SpectatorDirective } from '@ngneat/spectator/jest';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { LayoutService } from 'app/modules/layout/layout.service';

interface Box {
  top: number;
  bottom: number;
}

describe('DetailsHeightDirective', () => {
  let spectator: SpectatorDirective<DetailsHeightDirective>;

  const createDirective = createDirectiveFactory({
    directive: DetailsHeightDirective,
    providers: [
      mockProvider(LayoutService),
    ],
  });

  /**
   * The scroll container is 900px of screen below a 48px topbar, padded by 16px.
   */
  const scrollContainer = { top: 48, bottom: 948 } as Box;
  const containerPadding = 16;

  function setup(row: Box): HTMLElement {
    const container = document.createElement('div');
    container.style.paddingTop = `${containerPadding}px`;
    container.style.paddingBottom = `${containerPadding}px`;
    container.getBoundingClientRect = () => scrollContainer as DOMRect;

    spectator = createDirective('<div class="container"><div ixDetailsHeight></div></div>', {
      providers: [
        mockProvider(LayoutService, { getContentContainer: () => container }),
      ],
    });

    const details = spectator.element as HTMLElement;
    details.parentElement!.getBoundingClientRect = () => row as DOMRect;
    spectator.directive.applyHeight();

    return details;
  }

  it('fills the screen below the row when the page is not scrolled', () => {
    // Row starts 177px down (page heading above it) and its content runs well past the screen.
    const details = setup({ top: 177, bottom: 1400 });

    // Down to the container's padded bottom: 948 - 16 - 177.
    expect(details.style.height).toBe('755px');
  });

  it('grows as the page heading scrolls away, stopping where the block sticks', () => {
    // Same row scrolled up past the top of the scroll container, still running past the screen.
    const details = setup({ top: -300, bottom: 1100 });

    // Measured from where the block sticks (48 + 16), not from the row's off-screen top.
    expect(details.style.height).toBe('868px');
  });

  it('does not shrink itself when the row it sits in is the one it sizes', () => {
    // The row is as tall as this block, so its bottom moves with whatever height is set here.
    // Reading it would ratchet the height down a pass at a time.
    const details = setup({ top: 177, bottom: 177 + 400 });

    expect(details.style.height).toBe('755px');
  });
});
