import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, OnChanges, Output, TrackByFunction,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy } from '@ngneat/until-destroy';
import { findIndex, isEqual } from 'lodash';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import {
  GlobalSearchSection,
} from 'app/modules/global-search/enums/global-search-section.enum';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { processHierarchy } from 'app/modules/global-search/helpers/process-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { GlobalSearchSectionsProvider } from 'app/modules/global-search/services/global-search-sections.service';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-results',
  templateUrl: './global-search-results.component.html',
  styleUrls: ['./global-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchResultsComponent implements OnChanges {
  @Input() searchTerm = '';
  @Input() isLoading = false;
  @Input() results: UiSearchableElement[] = [];

  @Output() selected = new EventEmitter<void>();

  readonly initialResultsLimit = this.globalSearchSectionsProvider.globalSearchInitialLimit;
  readonly delayTime = 150;
  readonly trackBySection: TrackByFunction<Option<GlobalSearchSection>> = (_, section) => section.value;
  readonly trackById: TrackByFunction<UiSearchableElement> = (_, item) => generateIdFromHierarchy(item.hierarchy);

  processHierarchy = processHierarchy;

  initialShowAll: Record<GlobalSearchSection, boolean> = Object.fromEntries(
    Object.values(GlobalSearchSection).map((section) => [section, false]),
  ) as Record<GlobalSearchSection, boolean>;

  showAll = { ...this.initialShowAll };

  get availableSections(): Option<GlobalSearchSection>[] {
    const uniqueSectionValues = new Set(this.results.map((result) => result.section));

    if (
      this.searchTerm
      && !uniqueSectionValues.has(GlobalSearchSection.Ui)
      && !uniqueSectionValues.has(GlobalSearchSection.RecentSearches)
    ) {
      uniqueSectionValues.add(GlobalSearchSection.Ui);
    }

    return this.globalSearchSectionsProvider.searchSections.filter(
      (sectionOption) => uniqueSectionValues.has(sectionOption.value),
    );
  }

  constructor(
    protected authService: AuthService,
    private router: Router,
    private globalSearchSectionsProvider: GlobalSearchSectionsProvider,
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.searchTerm) {
      this.showAll = { ...this.initialShowAll };
    }
  }

  navigateToResult(element: UiSearchableElement): void {
    this.saveSearchResult(element);
    this.selected.emit();

    if (element.anchorRouterLink || element.routerLink) {
      this.router.navigate(element.anchorRouterLink || element.routerLink).then(() => {
        setTimeout(() => {
          (this.document.querySelector('.ix-slide-in2-background.open') as unknown as HTMLElement)?.click();
          this.tryHighlightAnchors(element, 0);
        }, this.delayTime);
      });
    }

    if (element.targetHref) {
      this.window.open(element.targetHref, '_blank');
    }
  }

  toggleShowAll(section: GlobalSearchSection): void {
    this.showAll[section] = !this.showAll[section];
  }

  getLimitedSectionResults(section: GlobalSearchSection): UiSearchableElement[] {
    const sectionResults = this.results.filter((element) => element.section === section);

    if (this.showAll[section] || sectionResults.length <= this.initialResultsLimit) {
      return sectionResults;
    }

    return sectionResults.slice(0, this.initialResultsLimit);
  }

  getElementsBySection(section: GlobalSearchSection): UiSearchableElement[] {
    return this.results.filter((element) => element?.section === section);
  }

  private tryHighlightAnchors(element: UiSearchableElement, attemptCount: number): void {
    const triggerAnchorRef = this.document.getElementById(element.triggerAnchor);

    if (triggerAnchorRef || this.document.getElementById(element.anchor)) {
      this.highlightAndClickElement(triggerAnchorRef);
      this.highlightElementAnchor(element.anchor);
    } else if (attemptCount < 2) {
      setTimeout(() => this.tryHighlightAnchors(element, attemptCount + 1), this.delayTime * 3);
    }
  }

  private highlightElementAnchor(elementAnchor: string): void {
    setTimeout(() => {
      const anchorRef: HTMLElement = this.document.getElementById(elementAnchor);

      if (anchorRef) {
        this.highlightAndClickElement(anchorRef);
      }
    }, this.delayTime * 1.5);
  }

  private highlightAndClickElement(anchorRef: HTMLElement): void {
    if (!anchorRef) {
      return;
    }

    anchorRef.scrollIntoView();
    anchorRef.focus();
    anchorRef.classList.add('search-element-highlighted');

    setTimeout(() => anchorRef.click(), this.delayTime);
    setTimeout(() => anchorRef.classList.remove('search-element-highlighted'), this.delayTime * 10);
  }

  private saveSearchResult(result: UiSearchableElement): void {
    const existingResults = JSON.parse(
      this.window.localStorage.getItem('recentSearches') || '[]',
    ) as UiSearchableElement[];

    const existingIndex = findIndex(existingResults, (item) => isEqual(item.hierarchy, result.hierarchy));

    if (existingIndex !== -1) {
      existingResults.splice(existingIndex, 1);
    }

    existingResults.unshift(result);

    localStorage.setItem('recentSearches', JSON.stringify(
      existingResults
        .slice(0, this.globalSearchSectionsProvider.recentSearchesMaximumToSave)
        .map((item) => ({ ...item, section: GlobalSearchSection.RecentSearches })),
    ));
  }
}
