import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output, TrackByFunction,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { timer } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { processHierarchy } from 'app/modules/global-search/helpers/process-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-results',
  templateUrl: './global-search-results.component.html',
  styleUrls: ['./global-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchResultsComponent {
  @Input() searchTerm = '';
  @Input() results: UiSearchableElement[] = [];

  @Output() selected = new EventEmitter<void>();

  readonly resultLimit = 6;
  readonly trackBySection: TrackByFunction<Option<GlobalSearchSection>> = (_, section) => section.value;
  readonly trackById: TrackByFunction<UiSearchableElement> = (_, item) => generateIdFromHierarchy(item.hierarchy);

  processHierarchy = processHierarchy;

  showAll: Record<GlobalSearchSection, boolean> = {
    [GlobalSearchSection.Ui]: false,
    [GlobalSearchSection.Help]: false,
  };

  get availableSections(): Option<GlobalSearchSection>[] {
    const uiSection = {
      label: this.translate.instant('UI'),
      value: GlobalSearchSection.Ui,
    };

    const helpSection = {
      label: this.translate.instant('Help'),
      value: GlobalSearchSection.Help,
    };

    if (!this.searchTerm?.trim()?.length) {
      return [uiSection];
    }

    return [uiSection, helpSection];
  }

  protected readonly entityEmptyConf = {
    title: this.translate.instant('No results found'),
    type: EmptyType.NoSearchResults,
    large: true,
  };

  constructor(
    protected authService: AuthService,
    private router: Router,
    private translate: TranslateService,
    @Inject(DOCUMENT) private document: Document,
    @Inject(WINDOW) private window: Window,
  ) {}

  navigateToResult(element: UiSearchableElement): void {
    this.selected.emit();

    if (element.anchorRouterLink || element.routerLink) {
      this.router.navigate(element.anchorRouterLink || element.routerLink).then(() => {
        setTimeout(() => {
          const triggerAnchorRef: HTMLElement = this.document.getElementById(element.triggerAnchor);

          if (triggerAnchorRef) {
            this.highlightElement(triggerAnchorRef);
            triggerAnchorRef.click();
          }

          setTimeout(() => {
            const anchorRef: HTMLElement = this.document.getElementById(element.anchor);

            if (anchorRef) {
              anchorRef.click();
              this.highlightElement(anchorRef);
            }
          }, 300);
        });
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

    if (this.showAll[section] || sectionResults.length <= this.resultLimit) {
      return sectionResults;
    }

    return sectionResults.slice(0, this.resultLimit);
  }

  getElementsBySection(section: GlobalSearchSection): UiSearchableElement[] {
    return this.results.filter((element) => element?.section === section);
  }

  private highlightElement(anchorRef: HTMLElement): void {
    anchorRef.focus();
    anchorRef.classList.add('search-element-highlighted');

    timer(999).pipe(untilDestroyed(this)).subscribe(() => anchorRef.classList.remove('search-element-highlighted'));
  }
}
