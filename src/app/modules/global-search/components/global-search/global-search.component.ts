import { DOCUMENT } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, OnInit, ViewChild, ElementRef, ChangeDetectorRef,
  Inject,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  tap, debounceTime, filter, switchMap,
  combineLatestWith,
} from 'rxjs';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { moveToNextFocusableElement, moveToPreviousFocusableElement } from 'app/modules/global-search/helpers/focus-helper';
import { getSearchableElementId } from 'app/modules/global-search/helpers/get-searchable-element-id';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { SidenavService } from 'app/services/sidenav.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  searchControl = new FormControl<string>('');
  searchResults: UiSearchableElement[];
  isLoading = false;

  constructor(
    protected sidenavService: SidenavService,
    private searchProvider: UiSearchProvider,
    private searchDirectives: UiSearchDirectivesService,
    private globalSearchSectionsProvider: GlobalSearchSectionsProvider,
    private cdr: ChangeDetectorRef,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    this.listenForSelectionChanges();
    this.listenForSearchChanges();
    this.setInitialSearchResults();
  }

  handleKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        moveToNextFocusableElement();
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveToPreviousFocusableElement();
        break;
      case 'Escape':
        this.resetInput();
        event.preventDefault();
        break;
      case 'Enter':
        event.preventDefault();
        break;
      default:
        if (event.key.length === 1 && !event.metaKey) {
          event.preventDefault();
          this.searchControl.setValue(this.searchControl.value + event.key);
          this.focusInputElement();
        }
        break;
    }
  }

  resetInput(): void {
    this.searchControl.reset();
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
      untilDestroyed(this),
    ).subscribe((searchResults) => {
      this.searchResults = [
        ...searchResults,
        ...this.globalSearchSectionsProvider.getHelpSectionResults(this.searchControl.value),
      ];
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private setInitialSearchResults(): void {
    this.searchResults = this.globalSearchSectionsProvider.getRecentSearchesSectionResults();
  }

  private focusInputElement(): void {
    this.searchInput.nativeElement?.focus();
  }

  private listenForSelectionChanges(): void {
    this.searchProvider.selectionChanged$.pipe(
      combineLatestWith(this.searchDirectives.directiveAdded$.pipe(filter(Boolean))),
      filter(([config, directive]) => directive?.id === getSearchableElementId(config)),
      untilDestroyed(this),
    ).subscribe(([config]) => {
      this.resetInput();
      this.document.querySelector<HTMLElement>('.ix-slide-in-background.open')?.click();
      this.document.querySelector<HTMLElement>('.ix-slide-in2-background.open')?.click();
      this.searchDirectives.get(config).highlight(config);
    });
  }
}
