import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { signal } from '@angular/core';
import { MatInput } from '@angular/material/input';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent, MockInstance } from 'ng-mocks';
import { of } from 'rxjs';
import { mockWindow } from 'app/core/testing/utils/mock-window.utils';
import { GlobalSearchComponent } from 'app/modules/global-search/components/global-search/global-search.component';
import {
  GlobalSearchTriggerComponent,
} from 'app/modules/global-search/components/global-search-trigger/global-search-trigger.component';
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
          querySelector: () => undefined as HTMLElement,
        },
      }),
    ],
  });

  beforeEach(() => {
    // TODO: Workaround for https://github.com/help-me-mom/ng-mocks/issues/8634
    MockInstance(GlobalSearchComponent, 'searchInput', signal(null));
    MockInstance(GlobalSearchComponent, 'searchBoxWrapper', signal(null));

    spectator = createComponent();
    jest.spyOn(spectator.inject(Overlay), 'create');
    spectator.detectChanges();
    createdOverlay = spectator.inject(Overlay).create.mock.results[0].value as OverlayRef;
  });

  it('renders and input prompting for search', () => {
    const input = spectator.query(MatInput);
    expect(input).toExist();
    expect(input).toHaveAttribute('placeholder', 'Search UI');
  });

  it('renders keyboard shortcut', () => {
    const shortcut = spectator.query(KeyboardShortcutComponent);
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
});
