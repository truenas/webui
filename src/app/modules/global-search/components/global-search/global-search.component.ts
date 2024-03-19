import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, switchMap } from 'rxjs';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { SidenavService } from 'app/services/sidenav.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('0.25s ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('0.25s ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;
  @ViewChild('searchResultsList', { static: false }) searchResultsList: GlobalSearchResultsComponent;

  @Output() resetSearch = new EventEmitter<void>();

  selectedIndex = 0;

  searchControl = new FormControl('');
  searchResults: UiSearchableElement[];

  constructor(
    private searchProvider: UiSearchProvider,
    private cdr: ChangeDetectorRef,
    protected sidenavService: SidenavService,
  ) {}

  ngOnInit(): void {
    this.listenForSearchChanges();
    this.getInitialSearchResults();
  }

  handleKeyDown(event: KeyboardEvent): void {
    if ((event.key === 'a') && event.metaKey) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
        this.focusElementByIndex();
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.selectedIndex = (this.selectedIndex - 1 + this.searchResults.length) % this.searchResults.length;
        this.focusElementByIndex();
        event.preventDefault();
        break;
      case 'Escape':
        this.resetInput();
        event.preventDefault();
        break;
      case 'Tab':
        if (event.shiftKey) {
          this.selectedIndex = (this.selectedIndex - 1 + this.searchResults.length) % this.searchResults.length;
        } else {
          this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
        }
        this.focusElementByIndex();
        event.preventDefault();
        break;
      case 'Enter':
        if (this.selectedIndex !== -1) {
          this.searchResultsList.navigateToResultByFocusedIndex(this.selectedIndex);
        }
        event.preventDefault();
        break;
      default:
        break;
    }
  }

  resetInput(): void {
    this.searchControl.reset();
    this.resetSearch.emit();
  }

  private focusElementByIndex(): void {
    this.searchResultsList.focusOnResultIndex(this.selectedIndex);
    this.focusInputElement();
  }

  private listenForSearchChanges(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(150),
      switchMap((term) => this.searchProvider.search(term)),
      untilDestroyed(this),
    ).subscribe((searchResults) => {
      this.selectedIndex = 0;
      this.searchResults = [...searchResults, {
        hierarchy: [`Search Documentation for "${this.searchControl.value}"`],
        targetHref: `https://www.truenas.com/docs/search/?query=${this.searchControl.value}`,
        section: 'help',
      }];
      this.cdr.markForCheck();
    });
  }

  private getInitialSearchResults(): void {
    this.searchProvider.search('').pipe(untilDestroyed(this)).subscribe((searchResults) => {
      this.searchResults = searchResults;
      this.cdr.markForCheck();
    });
  }

  private focusInputElement(): void {
    this.searchInput.nativeElement?.focus();
  }
}
