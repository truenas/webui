import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { timer } from 'rxjs';
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';
import { AuthService } from 'app/services/auth/auth.service';

@UntilDestroy()
@Component({
  selector: 'ix-ui-search-results',
  templateUrl: './ui-search-results.component.html',
  styleUrls: ['./ui-search-results.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSearchResultsComponent {
  @Input() searchTerm: string;
  @Input() results: UiSearchableElement[];

  @Output() selected = new EventEmitter<void>();

  get mappedResults(): UiSearchableElement[] {
    return this.results?.map((element) => {
      return {
        ...element,
        hierarchy: element.hierarchy.map((key) => this.translate.instant(key)),
        synonyms: element.synonyms.map((key) => this.translate.instant(key)),
      };
    });
  }

  constructor(
    protected authService: AuthService,
    private translate: TranslateService,
    private router: Router,
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

  processHierarchy(hierarchy: string[], searchTerm: string): string {
    if (hierarchy.length === 0 || !searchTerm) {
      return '';
    }

    const escapeRegExp = (term: string): string => term.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const searchEscaped = escapeRegExp(searchTerm);
    const regex = new RegExp(searchEscaped, 'gi');

    const processedItems = hierarchy.slice(0, -1).map((item) => {
      return item.replace(regex, '<span class="highlight">$&</span>');
    });

    const lastWord = hierarchy[hierarchy.length - 1];
    const lastWordHighlighted = lastWord?.replace(regex, '<span class="highlight">$&</span>');
    const lastWordProcessed = `<span class="last">${lastWordHighlighted}</span>`;

    processedItems.push(lastWordProcessed);

    return processedItems.join(' → ');
  }

  private highlightElement(anchorRef: HTMLElement): void {
    anchorRef.focus();
    anchorRef.classList.add('search-element-highlighted');

    timer(999).pipe(untilDestroyed(this)).subscribe(() => anchorRef.classList.remove('search-element-highlighted'));
  }
}
