import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { ElementRef, signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockInstance } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import {
  GlobalSearchTriggerComponent,
} from 'app/modules/global-search/components/global-search-trigger/global-search-trigger.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { KeyboardShortcutComponent } from 'app/modules/keyboard-shortcut/keyboard-shortcut.component';

describe('GlobalSearchTriggerComponent', () => {
  let spectator: Spectator<GlobalSearchTriggerComponent>;
  let createdOverlay: OverlayRef;
  const createComponent = createComponentFactory({
    component: GlobalSearchTriggerComponent,
    detectChanges: false,
    imports: [
      MockComponent(KeyboardShortcutComponent),
      MockComponent(GlobalSearchComponent),
    ],
    providers: [
      mockProvider(UiSearchProvider, {
        selectionChanged$: of(),
      }),
      mockWindow({
        document: {
          querySelector: () => ({} as HTMLElement),
        },
      }),
    ],
  });

  beforeEach(() => {
    // TODO: Workaround for https://github.com/help-me-mom/ng-mocks/issues/8634
    MockInstance(GlobalSearchComponent, 'searchInput', signal({} as ElementRef));
    MockInstance(GlobalSearchComponent, 'searchBoxWrapper', signal({} as ElementRef));

    spectator = createComponent();
    jest.spyOn(spectator.inject(Overlay), 'create');
    spectator.detectChanges();
    createdOverlay = spectator.inject(Overlay).create.mock.results[0].value as OverlayRef;
  });

  it('renders and input prompting for search', () => {
    const input = spectator.query('input.search-input');
    expect(input).toExist();
    expect(input).toHaveAttribute('placeholder', 'Search UI');
  });

  it('renders keyboard shortcut', () => {
    const shortcut = spectator.query(KeyboardShortcutComponent)!;
    expect(shortcut.key).toBe('/');
  });

  it('shows search overlay on focus', () => {
    jest.spyOn(createdOverlay, 'attach');
    spectator.focus('input');

    expect(createdOverlay.attach).toHaveBeenCalledWith(expect.any(ComponentPortal));
  });

  it('shows search overlay on click', () => {
    jest.spyOn(createdOverlay, 'attach');
    spectator.click('input');

    expect(createdOverlay.attach).toHaveBeenCalledWith(expect.any(ComponentPortal));
  });

  it('hides overlay when Escape key is pressed', () => {
    jest.spyOn(createdOverlay, 'detach');
    spectator.click('input');

    spectator.dispatchKeyboardEvent(document, 'keydown', 'Escape');

    expect(createdOverlay.detach).toHaveBeenCalled();
  });

  it('closes search shortly after a selection', () => {
    jest.useFakeTimers();
    const selection$ = new Subject<UiSearchableElement>();
    spectator.inject(UiSearchProvider).selectionChanged$ = selection$;

    spectator.click('input');
    selection$.next({} as UiSearchableElement);
    jest.advanceTimersByTime(searchDelayConst);

    expect(createdOverlay.hasAttached()).toBe(false);
    jest.useRealTimers();
  });

  it('does not close search reopened before the auto-close after a selection fires', () => {
    jest.useFakeTimers();
    const selection$ = new Subject<UiSearchableElement>();
    spectator.inject(UiSearchProvider).selectionChanged$ = selection$;

    spectator.click('input');
    selection$.next({} as UiSearchableElement);
    // Closed some other way before the auto-close fired, then opened again.
    spectator.dispatchKeyboardEvent(document, 'keydown', 'Escape');
    spectator.click('input');
    jest.advanceTimersByTime(searchDelayConst);

    expect(createdOverlay.hasAttached()).toBe(true);
    jest.useRealTimers();
  });
});
