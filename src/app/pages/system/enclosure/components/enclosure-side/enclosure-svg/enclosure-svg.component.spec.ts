import { fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { EMPTY, of } from 'rxjs';
import { DashboardEnclosureSlot } from 'app/interfaces/enclosure.interface';
import {
  EnclosureSvgComponent,
} from 'app/pages/system/enclosure/components/enclosure-side/enclosure-svg/enclosure-svg.component';
import { SvgCacheService } from 'app/pages/system/enclosure/services/svg-cache.service';

describe('EnclosureSvgComponent', () => {
  let spectator: Spectator<EnclosureSvgComponent>;
  const testSvg = `
<svg>
  <rect x="0" y="0" width="100" height="100" fill="red"></rect>
  <g id="Drives">
    <g id="DRIVE_CAGE_1">
      <rect x="0" y="0" width="100" height="100" fill="green"></rect>
    </g>
    <g id="DRIVE_CAGE_2">
      <rect x="0" y="100" width="100" height="100" fill="blue"></rect>
    </g>
  </g>
</svg>`;
  const createComponent = createComponentFactory({
    component: EnclosureSvgComponent,
  });

  // eslint-disable-next-line @typescript-eslint/naming-convention
  function mockGetBBox(): void {
    // getBBox is not implemented in JSDOM, so we need to mock it.
    let timesCalled = 0;
    Object.defineProperty(SVGElement.prototype, 'getBBox', {
      writable: true,
      value: () => {
        timesCalled = timesCalled + 1;
        if (timesCalled === 1) {
          return {
            x: 0,
            y: 0,
            width: 100,
            height: 100,
          };
        }

        return {
          x: 0,
          y: 100,
          width: 100,
          height: 100,
        };
      },
    });
  }

  function setupComponent(loadSvgResponse?: string): void {
    spectator = createComponent({
      props: {
        svgUrl: '/assets/m1.svg',
        slots: [
          { drive_bay_number: 1 },
          { drive_bay_number: 2 },
        ] as DashboardEnclosureSlot[],
        enableMouseEvents: true,
        selectedSlot: null,
      },
      providers: [
        mockProvider(SvgCacheService, {
          loadSvg: jest.fn(() => (!loadSvgResponse ? EMPTY : of(loadSvgResponse))),
        }),
      ],
    });
    tick();
    spectator.detectChanges();
  }

  describe('svg is loaded', () => {
    beforeEach(fakeAsync(() => {
      mockGetBBox();
      setupComponent(testSvg);
    }));

    it('loads svg and shows it using svgUrl and SvgCacheService service', () => {
      expect(spectator.query('.svg-container')).toHaveDescendant('svg');
      expect(spectator.query('.svg-container svg')).toHaveDescendant('g[id="Drives"]');
      expect(spectator.query('.svg-container svg g[id="Drives"] ')).toHaveDescendant('g[id="DRIVE_CAGE_1"]');
      expect(spectator.query('.svg-container svg g[id="Drives"] ')).toHaveDescendant('g[id="DRIVE_CAGE_2"]');
      expect(spectator.inject(SvgCacheService).loadSvg).toHaveBeenCalledWith('/assets/m1.svg');
    });

    it('adds "selected" class to the overlay over selected slot', () => {
      spectator.setInput('selectedSlot', { drive_bay_number: 1 });

      const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
      expect(overlays[0].classList).toContain('selected');
      expect(overlays[1].classList).not.toContain('selected');
    });

    it('calls slotTintFn to colors each overlay if slotTintFn is provided', () => {
      const tintFn = jest.fn((slot: DashboardEnclosureSlot) => {
        return slot.drive_bay_number === 1 ? 'red' : 'blue';
      });

      spectator.setInput('slotTintFn', tintFn);

      expect(tintFn).toHaveBeenCalledTimes(2);
      expect(tintFn).toHaveBeenNthCalledWith(1, { drive_bay_number: 1 });

      const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
      expect(overlays[0].style.fill).toBe('red');
      expect(overlays[1].style.fill).toBe('blue');
    });

    it('adds overlays for every drive cage in an svg', () => {
      const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
      expect(overlays).toHaveLength(2);

      const overlay1 = overlays[0];
      expect(overlay1.getAttribute('x')).toBe('0');
      expect(overlay1.getAttribute('y')).toBe('0');
      expect(overlay1.getAttribute('width')).toBe('100');
      expect(overlay1.getAttribute('height')).toBe('100');

      const overlay2 = overlays[1];
      expect(overlay2.getAttribute('x')).toBe('0');
      expect(overlay2.getAttribute('y')).toBe('100');
      expect(overlay2.getAttribute('width')).toBe('100');
      expect(overlay2.getAttribute('height')).toBe('100');
    });

    describe('mouse events disabled', () => {
      beforeEach(() => {
        spectator.setInput('enableMouseEvents', false);
      });

      it('adds static class to svg container', () => {
        expect(spectator.query('.svg-container').classList).toContain('static');
      });
    });

    describe('Interaction Listeners and Keyboard Navigation', () => {
      it('updates selectedSlot model when user clicks on a slot', () => {
        jest.spyOn(spectator.component.selectedSlot, 'set');
        const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
        overlays[1].dispatchEvent(new MouseEvent('click'));

        expect(spectator.component.selectedSlot.set).toHaveBeenCalledWith({ drive_bay_number: 2 });
      });

      it('navigates to the correct slot on arrow key press', () => {
        const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
        overlays[0].focus();
        overlays[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }));
        expect(document.activeElement).toBe(overlays[1]);
      });

      it('selects the slot on enter key press', () => {
        jest.spyOn(spectator.component.selectedSlot, 'set');

        const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
        overlays[0].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
        expect(spectator.component.selectedSlot.set).toHaveBeenCalledWith({ drive_bay_number: 1 });
      });

      it('updates tabindex and aria-label attributes', () => {
        const overlays = spectator.queryAll<SVGRectElement>('.overlay-rect');
        expect(overlays[0].getAttribute('tabindex')).toBe('0');
        expect(overlays[0].getAttribute('aria-label')).toContain('Disk Details for');
      });
    });
  });

  describe('svg is not loaded yet', () => {
    beforeEach(fakeAsync(() => {
      mockGetBBox();
      setupComponent();
    }));

    it('shows skeleton loader while SVG is loading', fakeAsync(() => {
      spectator.setInput('svgUrl', '/assets/m1.svg');
      spectator.detectChanges();
      tick();

      const skeletonLoader = spectator.query(NgxSkeletonLoaderComponent);
      expect(skeletonLoader).toBeTruthy();
      expect(skeletonLoader.animation).toBe(false);
      expect(skeletonLoader.theme).toEqual({
        height: '66px',
        marginBottom: 0,
        background: 'var(--alt-bg2)',
        opacity: 0.25,
      });
      expect(skeletonLoader.count).toBe(3);
      expect(spectator.query('.svg-container')).toBeFalsy();
    }));
  });
});
