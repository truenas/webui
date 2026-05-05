import { fakeAsync, tick } from '@angular/core/testing';
import { NavigationStart, Router } from '@angular/router';
import {
  createServiceFactory,
  SpectatorService,
} from '@ngneat/spectator/jest';
import { MockProvider } from 'ng-mocks';
import { Subject } from 'rxjs';
import {
  NavigateAndHighlightService,
  highlightTargetClass,
  highlightTargetInsetClass,
} from 'app/directives/navigate-and-interact/navigate-and-highlight.service';

function makeVisibleElement(id: string): HTMLElement {
  const el = document.createElement('div');
  el.id = id;
  el.scrollIntoView = jest.fn();
  document.body.appendChild(el);
  return el;
}

describe('NavigateAndHighlightService', () => {
  let spectator: SpectatorService<NavigateAndHighlightService>;
  let routerEvents$: Subject<unknown>;
  const createComponent = createServiceFactory({
    service: NavigateAndHighlightService,
    providers: [],
  });

  beforeEach(() => {
    routerEvents$ = new Subject();
    spectator = createComponent({
      providers: [
        MockProvider(Router, {
          navigate: jest.fn(() => Promise.resolve(true)),
          events: routerEvents$,
        }),
      ],
    });
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('should call router.navigate with correct parameters on click', () => {
    spectator.service.navigateAndHighlight(['/some-path'], 'testHash');
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/some-path'], { fragment: 'testHash' });
  });

  it('should scroll to and highlight the element with the given ID', fakeAsync(() => {
    const element = makeVisibleElement('testHash');

    spectator.service.navigateAndHighlight(['/some-path'], 'testHash');

    tick(150);

    expect(element.scrollIntoView).toHaveBeenCalled();
    expect(element.classList.contains(highlightTargetClass)).toBe(true);
  }));

  it('adds the highlight class and removes it on click', () => {
    const element = makeVisibleElement('clicker');
    spectator.service.highlight(element);

    expect(element.classList.contains(highlightTargetClass)).toBe(true);

    element.dispatchEvent(new MouseEvent('click'));
    expect(element.classList.contains(highlightTargetClass)).toBe(false);
  });

  it('focuses a focusable target', () => {
    const button = document.createElement('button');
    button.id = 'focus-target';
    document.body.appendChild(button);

    spectator.service.highlight(button);

    expect(document.activeElement).toBe(button);
    // No tabindex was added — button is natively focusable.
    expect(button.hasAttribute('tabindex')).toBe(false);
  });

  it('adds tabindex=-1 to non-focusable containers and removes it on cleanup', () => {
    const card = document.createElement('div');
    card.id = 'card';
    document.body.appendChild(card);

    spectator.service.highlight(card);

    expect(card.getAttribute('tabindex')).toBe('-1');
    expect(document.activeElement).toBe(card);

    card.dispatchEvent(new MouseEvent('click'));

    expect(card.hasAttribute('tabindex')).toBe(false);
  });

  it('cleans up previous highlight when another element is highlighted', () => {
    const element1 = makeVisibleElement('first');
    spectator.service.highlight(element1);

    expect(element1.classList.contains(highlightTargetClass)).toBe(true);

    const element2 = makeVisibleElement('second');
    spectator.service.highlight(element2);

    expect(element1.classList.contains(highlightTargetClass)).toBe(false);
    expect(element2.classList.contains(highlightTargetClass)).toBe(true);
  });

  it.each([
    'Escape',
    'Tab',
  ])('removes the highlight on %s keydown', (key) => {
    const card = makeVisibleElement('dismiss-target');
    spectator.service.highlight(card);

    expect(card.classList.contains(highlightTargetClass)).toBe(true);

    document.dispatchEvent(new KeyboardEvent('keydown', { key }));

    expect(card.classList.contains(highlightTargetClass)).toBe(false);
  });

  it.each([
    'ArrowDown',
    'ArrowUp',
    'a',
    'Shift',
    'Control',
  ])('keeps the highlight on %s keydown', (key) => {
    const card = makeVisibleElement('keep-target');
    spectator.service.highlight(card);

    document.dispatchEvent(new KeyboardEvent('keydown', { key }));

    expect(card.classList.contains(highlightTargetClass)).toBe(true);
  });

  it('uses the inset class when called with inset: true', () => {
    const card = makeVisibleElement('inset-card');
    spectator.service.highlight(card, { inset: true });

    expect(card.classList.contains(highlightTargetInsetClass)).toBe(true);
    expect(card.classList.contains(highlightTargetClass)).toBe(false);
  });

  it('forwards the block option to scrollIntoView (defaulting to center)', () => {
    const target = makeVisibleElement('block-target');

    spectator.service.scrollIntoView(target);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ block: 'center' });

    spectator.service.scrollIntoView(target, { block: 'start' });
    expect(target.scrollIntoView).toHaveBeenLastCalledWith({ block: 'start' });
  });

  it('cancels an in-flight poll when waitForElement is called again', fakeAsync(() => {
    spectator.service.waitForElement('first-poll-target');
    spectator.service.waitForElement('second-poll-target');

    const firstElement = makeVisibleElement('first-poll-target');
    const secondElement = makeVisibleElement('second-poll-target');

    tick(150);

    expect(firstElement.scrollIntoView).not.toHaveBeenCalled();
    expect(secondElement.scrollIntoView).toHaveBeenCalledTimes(1);

    tick(500);
    expect(firstElement.scrollIntoView).not.toHaveBeenCalled();
    expect(secondElement.scrollIntoView).toHaveBeenCalledTimes(1);
  }));

  it('cancels an in-flight poll when the router fires NavigationStart', fakeAsync(() => {
    spectator.service.waitForElement('mid-flight-target');

    // Simulate the user navigating away mid-poll.
    routerEvents$.next(new NavigationStart(1, '/elsewhere'));

    // Even when the awaited element appears later, the poll must not resume —
    // otherwise we'd highlight an element on a page the user no longer cares
    // about (or worse, an element with the same id on the new page).
    const late = makeVisibleElement('mid-flight-target');
    tick(5000);
    expect(late.scrollIntoView).not.toHaveBeenCalled();
  }));

  it('keeps polling until the element appears in the DOM', fakeAsync(() => {
    spectator.service.waitForElement('late-poll-target');

    // Not in DOM yet — first poll attempt finds nothing.
    tick(150);

    const target = makeVisibleElement('late-poll-target');

    tick(150);
    expect(target.scrollIntoView).toHaveBeenCalled();
  }));

  it('highlightResolved scrolls and highlights the given element without polling', () => {
    const target = makeVisibleElement('resolved-target');

    spectator.service.highlightResolved(target);

    expect(target.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(target.classList.contains(highlightTargetClass)).toBe(true);
  });

  it('highlightResolved cancels an in-flight poll started by waitForElement', fakeAsync(() => {
    // Kick off a poll for an element that isn't in the DOM yet.
    spectator.service.waitForElement('pending-target');

    const resolved = makeVisibleElement('resolved-target');
    spectator.service.highlightResolved(resolved, { inset: true });

    expect(resolved.scrollIntoView).toHaveBeenCalledTimes(1);
    expect(resolved.classList.contains(highlightTargetInsetClass)).toBe(true);

    // Even if the originally-awaited element appears later, the cancelled
    // poll must not re-highlight it.
    const late = makeVisibleElement('pending-target');
    tick(5000);
    expect(late.scrollIntoView).not.toHaveBeenCalled();
  }));

  it('dispatches synthetic ArrowDown events to sync the mat-menu KeyManager with the target item', () => {
    // Smoke test for the focus-target dance against mat-mdc-menu-panel —
    // the gnarliest piece of the highlight code. A KeyManager would normally
    // be wired up by Material; here we just observe that one ArrowDown
    // keydown is fired per step from the first item to the target.
    const menuPanel = document.createElement('div');
    menuPanel.classList.add('mat-mdc-menu-panel');
    document.body.appendChild(menuPanel);

    const items = ['first', 'second', 'third', 'fourth'].map((id) => {
      const item = document.createElement('button');
      item.id = id;
      item.classList.add('mat-mdc-menu-item');
      menuPanel.appendChild(item);
      return item;
    });

    const dispatched: KeyboardEvent[] = [];
    menuPanel.addEventListener('keydown', (event) => {
      if (event instanceof KeyboardEvent) dispatched.push(event);
    });

    // Highlighting the third item should fire two ArrowDown events (advance
    // _activeItem from index 0 → 2). keyCode/which must be patched so the
    // CDK FocusKeyManager actually sees them.
    spectator.service.highlight(items[2]);

    expect(dispatched).toHaveLength(2);
    expect(dispatched[0].key).toBe('ArrowDown');
    // CDK FocusKeyManager still reads the deprecated `keyCode` field, so
    // assert it survived the patch — that's the bug a future CDK upgrade
    // would expose.
    // eslint-disable-next-line sonarjs/deprecation
    expect(dispatched[0].keyCode).toBe(40);
    // eslint-disable-next-line sonarjs/deprecation
    expect(dispatched[1].keyCode).toBe(40);
  });

  it('does NOT hijack Enter when the highlighted target is not inside a mat-menu', () => {
    const button = document.createElement('button');
    button.id = 'plain-button';
    button.click = jest.fn();
    document.body.appendChild(button);

    spectator.service.highlight(button);

    const event = new KeyboardEvent('keydown', { key: 'Enter', cancelable: true });
    document.dispatchEvent(event);

    // The capture-phase handler must NOT invoke .click() on a focused
    // non-menu host — that's left to the browser's native Enter behaviour.
    expect(button.click).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });
});
