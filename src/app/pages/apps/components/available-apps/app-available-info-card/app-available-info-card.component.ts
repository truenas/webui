import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { formatRelative } from 'date-fns';
import { Observable } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interfase';

@Component({
  selector: 'ix-app-available-info-card',
  templateUrl: './app-available-info-card.component.html',
  styleUrls: ['./app-available-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppAvailableInfoCardComponent implements OnChanges {
  @Input() isLoading$: Observable<boolean>;
  @Input() app: AvailableApp;
  relativeDate = '';

  constructor(
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    if (!this.app) {
      return;
    }
    this.relativeDate = formatRelative(new Date(this.app.last_update.$date), new Date());
    this.cdr.markForCheck();
  }
}
