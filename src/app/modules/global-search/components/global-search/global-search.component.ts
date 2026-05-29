import { CdkTrapFocus } from '@angular/cdk/a11y';
import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, ElementRef, ChangeDetectorRef, AfterViewInit, OnDestroy, Signal, signal, viewChild, DOCUMENT, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatInput } from '@angular/material/input';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import {
  debounceTime, filter, switchMap, tap,
} from 'rxjs';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { extractVersion } from 'app/modules/global-search/helpers/extract-version';
import {
  getFocusableSearchBoxElements, moveToNextFocusableElement, moveToPreviousFocusableElement,
} from 'app/modules/global-search/helpers/focus-helper';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { SidenavService } from 'app/modules/layout/sidenav.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { FocusService } from 'app/services/focus.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@Component({
  selector: 'ix-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkTrapFocus,
    TnIconComponent,
    MatInput,
    ReactiveFormsModule,
    TestDirective,
    GlobalSearchResultsComponent,
    TranslateModule,
  ],
})
export class GlobalSearchComponent implements OnInit, AfterViewInit, OnDestroy {
  protected sidenavService = inject(SidenavService);
  private searchProvider = inject(UiSearchProvider);
  private searchDirectives = inject(UiSearchDirectivesService);
  private globalSearchSectionsProvider = inject(GlobalSearchSectionsProvider);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private dialogService = inject(DialogService);
  private focusService = inject(FocusService);
  private document = inject<Document>(DOCUMENT);
  private destroyRef = inject(DestroyRef);

  searchInput: Signal<ElementRef<HTMLInputElement>> = viewChild.required('searchInput', { read: ElementRef });
  searchBoxWrapper: Signal<ElementRef<HTMLElement>> = viewChild.required('searchBoxWrapper', { read: ElementRef });

  searchControl = new FormControl<string>('', { nonNullable: true });
  searchResults: UiSearchableElement[];
  isLoading = false;
  systemVersion: string;
  detachOverlay: () => void; // passed from global-search-trigger

  // CdkTrapFocus restores focus to the previously-focused element on destroy
  // (the topbar search trigger button). When dismissal is user-driven, that's
  // correct. When the overlay auto-closes after a selection, the highlight
  // service already moved focus to the chosen target — restoring would steal
  // it back. Flip this off in handleSearchSelection so detach skips restore.
  protected autoRestoreFocus = true;

  // Tracked as a signal updated by focus/blur listeners on the input. Reading
  // `document.activeElement` from a getter wouldn't trigger CD when focus
  // changes — the template binding would only update when something else
  // marked the view dirty.
  readonly isSearchInputFocused = signal(false);

  ngOnInit(): void {
    this.getSystemVersion();
    this.listenForSelectionChanges();
    this.listenForSearchChanges();
    this.setInitialSearchResults();
  }

  ngAfterViewInit(): void {
    this.searchBoxWrapper().nativeElement.addEventListener('focusout', this.handleFocusOut);
    const input = this.searchInput().nativeElement;
    input.addEventListener('focus', this.handleSearchInputFocus);
    input.addEventListener('blur', this.handleSearchInputBlur);
  }

  ngOnDestroy(): void {
    this.searchBoxWrapper().nativeElement.removeEventListener('focusout', this.handleFocusOut);
    const input = this.searchInput().nativeElement;
    input.removeEventListener('focus', this.handleSearchInputFocus);
    input.removeEventListener('blur', this.handleSearchInputBlur);
  }

  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'Tab':
        event.preventDefault();

        // Tab/Shift+Tab on the first/last focusable should escape the search
        // overlay to the next/previous focusable in the page. If we escaped,
        // don't fall through to the in-search cycle.
        if (event.key === 'Tab' && this.handleTabOutFromGlobalSearch(event)) {
          break;
        }

        if (!event.shiftKey) {
          if (this.isSearchInputFocused()) moveToNextFocusableElement(this.document);
          moveToNextFocusableElement(this.document);
        }

        if (event.shiftKey && event.key === 'Tab') {
          moveToPreviousFocusableElement(this.document);
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveToPreviousFocusableElement(this.document);
        break;
      case 'Enter':
        event.preventDefault();

        if (this.isSearchInputFocused()) {
          // Submit the first result, not the next focusable. The reset
          // button now sits in tab order between the input and the result
          // list, so falling through to `moveToNextFocusableElement` would
          // land on the reset button and clear the field on Enter.
          this.submitFirstResult();
        }
        break;
      default:
        if (event.key.length === 1 && !event.metaKey && !this.isSearchInputFocused()) {
          event.preventDefault();
          this.searchControl.setValue(this.searchControl.value + event.key);
          this.focusInputElement();
        }
        break;
    }
  }

  resetInput(): void {
    this.searchControl.setValue('');
  }

  setInitialSearchResults(): void {
    this.searchResults = this.globalSearchSectionsProvider.getRecentSearchesSectionResults();
  }

  closeAllBackdrops(): void {
    this.slideIn.closeAll();
    this.sidenavService.closeSecondaryMenu();
    this.dialogService.closeAllDialogs();
  }

  private listenForSearchChanges(): void {
    this.searchControl.valueChanges.pipe(
      tap((value) => {
        this.isLoading = !!value;
        if (!value) {
          this.setInitialSearchResults();
        }
      }),
      debounceTime(searchDelayConst),
      filter(Boolean),
      switchMap((term) => this.globalSearchSectionsProvider.getUiSectionResults(term)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((searchResults) => {
      this.searchResults = [
        ...searchResults,
        ...this.globalSearchSectionsProvider.getHelpSectionResults(
          this.searchControl.value,
          extractVersion(this.systemVersion),
        ),
      ];
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private focusInputElement(): void {
    this.searchInput().nativeElement?.focus();
  }

  private submitFirstResult(): void {
    const firstResult = this.searchBoxWrapper().nativeElement
      .querySelector<HTMLElement>('.search-result');
    firstResult?.click();
  }

  private getSystemVersion(): void {
    this.store$.pipe(
      waitForSystemInfo,
      takeUntilDestroyed(this.destroyRef),
    )
      .subscribe((systemInfo) => {
        this.systemVersion = systemInfo.version;
      });
  }

  private listenForSelectionChanges(): void {
    this.searchProvider.selectionChanged$.pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((config) => this.handleSearchSelection(config));
  }

  private handleSearchSelection(config: UiSearchableElement): void {
    // Run component-side cleanup eagerly while we still exist; the actual
    // polling + highlight lives on UiSearchDirectivesService so it can
    // outlive this component (overlay auto-detaches ~150ms after selection,
    // mat-menu auto-focus can detach it sooner via focusout).
    this.autoRestoreFocus = false;
    this.resetInput();
    this.closeAllBackdrops();
    this.searchDirectives.requestHighlight(config);
  }

  private handleTabOutFromGlobalSearch(event: KeyboardEvent): boolean {
    // Use the same tabindex-sorted ordering that moveToNext/Previous uses,
    // otherwise we can miss the case where the active element is last in tab
    // order but not last in document order (then moveToNext wraps to the
    // start instead of escaping).
    const sorted = getFocusableSearchBoxElements(this.document);
    const firstElement = sorted[0];
    const lastElement = sorted[sorted.length - 1];

    if (event.shiftKey && this.document.activeElement === firstElement) {
      this.tabOutFromGlobalSearch('previous');
      return true;
    }
    if (!event.shiftKey && this.document.activeElement === lastElement) {
      this.tabOutFromGlobalSearch('next');
      return true;
    }
    return false;
  }

  private tabOutFromGlobalSearch(direction: 'next' | 'previous'): void {
    this.detachOverlay();

    setTimeout(() => {
      // Tab forward from the search overlay should land on the next topbar
      // icon (Send Feedback, etc.), not jump back into the sidenav. The
      // topbar icons live inside `.topbar-mobile-footer`, the sidenav toggle
      // is `#sidenavToggle`.
      const targetSelector = direction === 'next'
        ? '.topbar-mobile-footer button:not([disabled]), .topbar-mobile-footer a:not([disabled])'
        : '#sidenavToggle';

      const target = this.document.querySelector<HTMLElement>(targetSelector);
      if (target) {
        target.focus();
        return;
      }

      // Fallback: walk the document's focusable list relative to the search
      // trigger if for some reason the topbar selectors don't resolve.
      const trigger = this.document.querySelector<HTMLElement>('.search-box .search-input');
      if (!trigger) return;
      const all = this.focusService.getFocusableElements(this.document.body);
      const triggerIndex = all.indexOf(trigger);
      if (triggerIndex === -1) return;
      const fallback = direction === 'next' ? all[triggerIndex + 1] : all[triggerIndex - 1];
      fallback?.focus();
    });
  }

  private handleFocusOut = (event: FocusEvent): void => {
    const relatedTarget = event.relatedTarget as HTMLElement;
    if (relatedTarget && !this.searchBoxWrapper().nativeElement.contains(relatedTarget)) {
      this.detachOverlay();
    }
  };

  private handleSearchInputFocus = (): void => {
    this.isSearchInputFocused.set(true);
  };

  private handleSearchInputBlur = (): void => {
    this.isSearchInputFocused.set(false);
  };
}
