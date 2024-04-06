import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, Inject, Input, TrackByFunction,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatestWith, delay, filter,
} from 'rxjs';
import { WINDOW } from 'app/helpers/window.helper';
import { Option } from 'app/interfaces/option.interface';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { GlobalSearchSection } from 'app/modules/global-search/enums/global-search-section.enum';
import { generateIdFromHierarchy } from 'app/modules/global-search/helpers/generate-id-from-hierarchy';
import { processHierarchy } from 'app/modules/global-search/helpers/process-hierarchy';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';
import { UiSearchableDirectiveService } from 'app/modules/global-search/services/ui-searchable-directive.service';
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

  constructor(
    protected authService: AuthService,
    private translate: TranslateService,
    private searchProvider: UiSearchProvider,
    private searchDirectives: UiSearchableDirectiveService,
    private router: Router,
    @Inject(WINDOW) private window: Window,
    @Inject(DOCUMENT) private document: Document,
  ) {
    this.listenForSelectionChanges();
  }

  selectElement(element: UiSearchableElement): void {
    this.searchProvider.select(element);
    const route = element.anchorRouterLink || element.routerLink;
    if (element.targetHref) {
      this.window.open(element.targetHref, '_blank');
    }
    if (route?.length) {
      this.router.navigate(route);
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

  listenForSelectionChanges(): void {
    this.searchProvider.selectionChanged$.pipe(
      combineLatestWith(this.searchDirectives.highlightOnDirectiveAdded$),
      filter(([selectedElement]) => this.searchDirectives.registeredDirectives.has(selectedElement.anchor)),
      delay(searchDelayConst),
      untilDestroyed(this),
    ).subscribe(([element]) => {
      this.document.querySelector<HTMLElement>('.ix-slide-in-background.open')?.click();
      this.document.querySelector<HTMLElement>('.ix-slide-in2-background.open')?.click();
      this.searchDirectives.registeredDirectives.get(element.anchor).highlight();
    });
  }
}
