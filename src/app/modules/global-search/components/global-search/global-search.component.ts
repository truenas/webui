import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EventEmitter, OnInit, Output, ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  debounceTime, distinctUntilChanged, switchMap,
} from 'rxjs';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section';
import { moveToNextFocusableElement, moveToPreviousFocusableElement } from 'app/modules/global-search/helpers/focus-helper';
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

  @Output() resetSearch = new EventEmitter<void>();

  searchTerm: string;
  searchControl = new FormControl('');
  searchResults: UiSearchableElement[];

  constructor(
    protected sidenavService: SidenavService,
    private searchProvider: UiSearchProvider,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  get helpSectionElement(): UiSearchableElement {
    return {
      hierarchy: [this.translate.instant('Search Documentation for «{value}»', { value: this.searchControl.value })],
      targetHref: `https://www.truenas.com/docs/search/?query=${this.searchControl.value}`,
      section: GlobalSearchSection.Help,
    };
  }

  ngOnInit(): void {
    this.listenForSearchChanges();
    this.getInitialSearchResults();
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
      debounceTime(150),
      distinctUntilChanged(),
      switchMap((term) => this.searchProvider.search(term)),
      untilDestroyed(this),
    ).subscribe((searchResults) => {
      this.searchTerm = this.searchControl.value;
      this.searchResults = [...searchResults, this.helpSectionElement];
      this.cdr.markForCheck();
    });
  }

  private getInitialSearchResults(): void {
    this.searchProvider.search('').pipe(untilDestroyed(this)).subscribe((searchResults) => {
      this.searchResults = [...searchResults.filter((result) => result.section === GlobalSearchSection.Ui)];
      this.cdr.markForCheck();
    });
  }

  private focusInputElement(): void {
    this.searchInput.nativeElement?.focus();
  }
}
