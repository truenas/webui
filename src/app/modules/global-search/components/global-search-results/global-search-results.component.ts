import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { timer } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-global-search-results',
  templateUrl: './global-search-results.component.html',
  styleUrls: ['./global-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GlobalSearchResultsComponent {
  @Input() searchTerm: string;
  @Input() results: UiSearchableElement[];
  @Input() focusedIndex: number;

  @Output() selected = new EventEmitter<void>();

  protected readonly entityEmptyConf = this.emptyService.defaultEmptyConfig(EmptyType.NoSearchResults);

  constructor(
    protected authService: AuthService,
    private router: Router,
    private emptyService: EmptyService,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  navigateToResult(element: UiSearchableElement): void {
    this.selected.emit();

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

  navigateToResultByFocusedIndex(index: number): void {
    this.navigateToResult(this.results[index]);
  }

  focusOnResultIndex(index: number): void {
    const selectedItem = this.document.querySelector(`.focused-index-${index}`);

    if (selectedItem instanceof HTMLElement) {
      selectedItem.focus();
    }
  }

  processHierarchy(hierarchy: string[], searchTerm: string): string {
    const escapeRegExp = (term: string): string => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const searchWords = searchTerm.split(' ').map(escapeRegExp).filter((word) => word);

    const regex = new RegExp(`(${searchWords.join('|')})`, 'gi');

    const processedItems = hierarchy.map((item) => {
      return item.split(regex).map((segment) => {
        if (segment.match(regex) && item === hierarchy[hierarchy.length - 1]) {
          return `<span class="highlight">${segment}</span>`;
        }
        return `<span class="dimmed-text">${segment}</span>`;
      }).join('');
    });

    return processedItems.join(' → ');
  }

  private highlightElement(anchorRef: HTMLElement): void {
    anchorRef.focus();
    anchorRef.classList.add('search-element-highlighted');

    timer(999).pipe(untilDestroyed(this)).subscribe(() => anchorRef.classList.remove('search-element-highlighted'));
  }
}
