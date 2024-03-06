import {
  animate, style, transition, trigger,
} from '@angular/animations';
import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { NavigationStart, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { debounceTime, filter, switchMap } from 'rxjs';
import { GlobalSearchResultsComponent } from 'app/modules/global-search/components/global-search-results/global-search-results.component';
import { UiSearchableElement } from 'app/modules/global-search/interfaces/ui-searchable-element.interface';
import { UiSearchProvider } from 'app/modules/global-search/services/ui-search.service';

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
export class GlobalSearchComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');
  dialogRef: MatDialogRef<GlobalSearchResultsComponent>;
  searchResults: UiSearchableElement[];

  get hasValueAndResults(): boolean {
    return Boolean(this.searchResults?.length && this.searchControl?.value);
  }

  constructor(
    private searchProvider: UiSearchProvider,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.listenForSearchChanges();
    this.listenForRouteChanges();
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  resetInput(): void {
    this.searchControl.reset();
  }

  private focusInput(): void {
    this.searchInput.nativeElement.focus();
  }

  private listenForSearchChanges(): void {
    this.searchControl.valueChanges.pipe(
      debounceTime(150),
      switchMap((term) => this.searchProvider.search(term)),
      untilDestroyed(this),
    ).subscribe((searchResults) => {
      this.searchResults = searchResults;
      this.cdr.markForCheck();
    });
  }

  private listenForRouteChanges(): void {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this)).subscribe(() => {
        this.resetInput();
      });
  }
}
