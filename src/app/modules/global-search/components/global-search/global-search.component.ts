import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import {
  debounceTime, filter, switchMap, tap,
} from 'rxjs';
import { moveToNextFocusableElement, moveToPreviousFocusableElement } from 'app/modules/global-search/helpers/focus-helper';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { SidenavService } from 'app/services/sidenav.service';
import { AppState } from 'app/store';
import { waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-global-search',
  templateUrl: './global-search.component.html',
  styleUrls: ['./global-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchComponent implements OnInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  @Output() resetSearch = new EventEmitter<void>();

  searchControl = new FormControl('');
  searchResults: UiSearchableElement[];
  isLoading = false;
  systemVersion: string;

  constructor(
    protected sidenavService: SidenavService,
    private globalSearchSectionsProvider: GlobalSearchSectionsProvider,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.getSystemVersion();
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
    this.resetSearch.emit();
  }

  private listenForSearchChanges(): void {
    this.searchControl.valueChanges.pipe(
      tap((value) => {
        this.isLoading = !!value;
        if (!value) {
          this.setInitialSearchResults();
        }
      }),
      debounceTime(150),
      filter(Boolean),
      switchMap((term) => this.globalSearchSectionsProvider.getUiSectionResults(term)),
      untilDestroyed(this),
    ).subscribe((searchResults) => {
      this.searchResults = [
        ...searchResults,
        ...this.globalSearchSectionsProvider.getHelpSectionResults(
          this.searchControl.value,
          this.extractVersion(this.systemVersion),
        ),
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

  private getSystemVersion(): void {
    this.store$.pipe(
      waitForSystemInfo,
      untilDestroyed(this),
    )
      .subscribe((systemInfo) => {
        this.systemVersion = systemInfo.version;
      });
  }

  private extractVersion(version: string): string {
    return version.match(/(\d+\.\d+)\.\d+-/)?.[1];
  }
}
