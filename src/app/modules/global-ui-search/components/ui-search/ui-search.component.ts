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
import { UiSearchableElement } from 'app/interfaces/ui-searchable-element.interface';
import { UiSearchResultsComponent } from 'app/modules/global-ui-search/components/ui-search-results/ui-search-results.component';
import { UiSearchProviderService } from 'app/modules/global-ui-search/services/ui-search.service';

@UntilDestroy()
@Component({
  selector: 'ix-ui-search',
  templateUrl: './ui-search.component.html',
  styleUrls: ['./ui-search.component.scss'],
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
export class UiSearchComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');
  dialogRef: MatDialogRef<UiSearchResultsComponent>;
  searchResults: UiSearchableElement[];

  get hasValueAndResults(): boolean {
    return Boolean(this.searchResults?.length && this.searchControl?.value);
  }

  constructor(
    private searchProvider: UiSearchProviderService,
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
