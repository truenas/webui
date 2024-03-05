import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, OnInit, ViewChild,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { UiSearchResultsComponent } from 'app/modules/global-ui-search/components/ui-search-results/ui-search-results.component';

@UntilDestroy()
@Component({
  selector: 'ix-ui-search',
  templateUrl: './ui-search.component.html',
  styleUrls: ['./ui-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiSearchComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput: ElementRef<HTMLInputElement>;

  searchControl = new FormControl('');

  constructor(private matDialog: MatDialog) {}

  ngOnInit(): void {
    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value === 'cloud') {
        this.onSearch();
      }
    });
  }

  ngAfterViewInit(): void {
    this.focusInput();
  }

  onSearch(): void {
    // TODO: May be better to replace with cdk overlay.
    this.matDialog.open(UiSearchResultsComponent, {
      hasBackdrop: true,
      panelClass: ['topbar-panel', 'search-results-panel'],
      position: {
        top: '48px',
        left: '307px',
      },
      backdropClass: ['search-results-backdrop', 'cdk-overlay-backdrop', 'cdk-overlay-dark-backdrop'],
    });
  }

  protected resetInput(): void {
    this.searchControl.reset();
    this.focusInput();
  }

  private focusInput(): void {
    this.searchInput.nativeElement.focus();

    // this.searchInput.nativeElement.inputElementRef.nativeElement.focus();
  }
}
