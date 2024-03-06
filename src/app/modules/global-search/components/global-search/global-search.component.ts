import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, OnInit, Output, ViewChild,
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
  @ViewChild('autocompleteList', { static: false }) autocompleteList: GlobalSearchResultsComponent;

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
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex + 1) % this.searchResults.length;
      this.autocompleteList.scrollIntoFocusedSelectedIndexView();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex = (this.selectedIndex - 1 + this.searchResults.length) % this.searchResults.length;
      this.autocompleteList.scrollIntoFocusedSelectedIndexView();
    } else if (event.key === 'Escape') {
      event.preventDefault();
      this.resetInput();
      this.autocompleteList.scrollIntoFocusedSelectedIndexView();
    } else if (event.key === 'Enter' && this.selectedIndex !== -1) {
      event.preventDefault();
      this.autocompleteList.navigateToResultByFocusedSelectedIndex();
    }
  }

  resetInput(): void {
    this.searchControl.reset();
    this.resetSearch.emit();
  }

  private listenForSearchChanges(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(150),
      switchMap((term) => this.searchProvider.search(term)),
      untilDestroyed(this),
    ).subscribe((searchResults) => {
      this.selectedIndex = 0;
      this.searchResults = searchResults;
      this.cdr.markForCheck();
    });
  }

  private getInitialSearchResults(): void {
    this.searchProvider.search(' ').pipe(untilDestroyed(this)).subscribe((searchResults) => {
      this.searchResults = searchResults;
      this.cdr.markForCheck();
    });
  }
}
