import { ElementRef, Renderer2 } from '@angular/core';
import { fakeAsync, tick } from '@angular/core/testing';
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

  describe('requestHighlight', () => {
    function makeVisibleElement(id: string): HTMLElement {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
      // jsdom doesn't compute layout, so offsetParent is null by default.
      // Stub it to mimic an in-DOM, visible element.
      Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => document.body });
      return el;
    }

    function makeHiddenElement(id: string): HTMLElement {
      const el = document.createElement('div');
      el.id = id;
      document.body.appendChild(el);
      Object.defineProperty(el, 'offsetParent', { configurable: true, get: () => null });
      return el;
    }

    function fakeDirective(id: string): UiSearchDirective {
      return {
        id,
        highlight: jest.fn(),
      } as unknown as UiSearchDirective;
    }

    beforeEach(() => {
      spectator = createService();
    });

    afterEach(() => {
      spectator.service.cancelPendingHighlight();
      document.body.innerHTML = '';
    });

    it('highlights immediately when the directive is registered and the target is visible', fakeAsync(() => {
      const directive = fakeDirective('a-card');
      const target = makeVisibleElement('a-card');
      spectator.service.register(directive);

      spectator.service.requestHighlight({ anchor: 'a-card' });

      expect(directive.highlight).toHaveBeenCalledWith({ anchor: 'a-card' }, target);
      expect(spectator.service.pendingUiHighlightElement).toBeNull();
    }));

    it('skips a directive whose target is in the DOM but not visible (offsetParent null)', fakeAsync(() => {
      const directive = fakeDirective('hidden-card');
      makeHiddenElement('hidden-card');
      spectator.service.register(directive);

      spectator.service.requestHighlight({ anchor: 'hidden-card' });

      expect(directive.highlight).not.toHaveBeenCalled();
      // Pending element stays set while polling continues.
      expect(spectator.service.pendingUiHighlightElement).toEqual({ anchor: 'hidden-card' });

      tick(5000);
      expect(directive.highlight).not.toHaveBeenCalled();
      // Cleared after exhausting all attempts.
      expect(spectator.service.pendingUiHighlightElement).toBeNull();
    }));

    it('polls until the directive registers and the target becomes visible', fakeAsync(() => {
      const directive = fakeDirective('late-card');

      spectator.service.requestHighlight({ anchor: 'late-card' });
      tick(150);
      expect(directive.highlight).not.toHaveBeenCalled();

      spectator.service.register(directive);
      const target = makeVisibleElement('late-card');

      tick(150);
      expect(directive.highlight).toHaveBeenCalledWith({ anchor: 'late-card' }, target);
    }));

    it('fires the parent triggerAnchor exactly once across the polling lifetime', fakeAsync(() => {
      const trigger = makeVisibleElement('parent-trigger');
      trigger.click = jest.fn();

      // No directive yet — the target itself isn't in the DOM until the
      // trigger has been "fired" (we simulate that on the second tick).
      spectator.service.requestHighlight({
        anchor: 'menu-item',
        triggerAnchor: 'parent-trigger',
      });

      tick(150);
      expect(trigger.click).toHaveBeenCalledTimes(1);

      // Several more poll iterations should NOT re-fire the trigger.
      tick(500);
      expect(trigger.click).toHaveBeenCalledTimes(1);
    }));

    it('also fires the trigger when triggerAnchor equals the directive id (self-trigger)', fakeAsync(() => {
      const directive = fakeDirective('settings-menu');
      const target = makeVisibleElement('settings-menu');
      target.click = jest.fn();
      spectator.service.register(directive);

      spectator.service.requestHighlight({
        anchor: 'settings-menu',
        triggerAnchor: 'settings-menu',
      });

      expect(target.click).toHaveBeenCalledTimes(1);
      expect(directive.highlight).toHaveBeenCalledWith(
        { anchor: 'settings-menu', triggerAnchor: 'settings-menu' },
        target,
      );

      // Subsequent poll iterations must NOT re-fire the trigger — that would
      // toggle the menu closed (and reopen it, etc.). Letting the timers
      // advance ensures the no-op path holds even if a future change adds
      // late-arriving directives.
      tick(500);
      expect(target.click).toHaveBeenCalledTimes(1);
    }));

    it('does not fire a self-trigger click after the parent triggerAnchor branch already fired it', fakeAsync(() => {
      // Repro for the double-click race: directive registers AFTER iteration 0,
      // so iteration 0 takes the parent-trigger path (line 117) and iteration 1
      // would otherwise hit the self-trigger branch in applyHighlight.
      const trigger = makeVisibleElement('settings-menu');
      trigger.click = jest.fn();

      spectator.service.requestHighlight({
        anchor: 'settings-menu',
        triggerAnchor: 'settings-menu',
      });

      // Iteration 0: directive not registered, parent triggerAnchor path fires.
      expect(trigger.click).toHaveBeenCalledTimes(1);

      // Now register the directive so iteration 1 will resolve. applyHighlight
      // must NOT click the trigger a second time.
      const directive = fakeDirective('settings-menu');
      spectator.service.register(directive);
      tick(150);

      expect(directive.highlight).toHaveBeenCalledWith(
        { anchor: 'settings-menu', triggerAnchor: 'settings-menu' },
        trigger,
      );
      expect(trigger.click).toHaveBeenCalledTimes(1);
    }));

    it('cancels an in-flight poll when requestHighlight is called again', fakeAsync(() => {
      const firstDirective = fakeDirective('first');
      const secondDirective = fakeDirective('second');

      // Neither target is in the DOM yet.
      spectator.service.requestHighlight({ anchor: 'first' });
      spectator.service.requestHighlight({ anchor: 'second' });

      spectator.service.register(firstDirective);
      spectator.service.register(secondDirective);
      makeVisibleElement('first');
      const secondTarget = makeVisibleElement('second');

      tick(150);

      expect(firstDirective.highlight).not.toHaveBeenCalled();
      expect(secondDirective.highlight).toHaveBeenCalledWith({ anchor: 'second' }, secondTarget);
    }));

    it('clears the pending highlight after the poll deadline expires', fakeAsync(() => {
      spectator.service.requestHighlight({ anchor: 'never-appears' });
      expect(spectator.service.pendingUiHighlightElement).toEqual({ anchor: 'never-appears' });

      tick(5000);

      expect(spectator.service.pendingUiHighlightElement).toBeNull();
    }));
  });
});
