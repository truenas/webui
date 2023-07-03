import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { formatRelative } from 'date-fns';
import { Observable } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-available-info-card',
  templateUrl: './app-available-info-card.component.html',
  styleUrls: ['./app-available-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppAvailableInfoCardComponent implements OnChanges {
  @Input() isLoading$: Observable<boolean>;
  @Input() app: AvailableApp;
  sources: string[] = [];
  loadingSources = true;
  relativeDate = '';

  constructor(
    private cdr: ChangeDetectorRef,
    private applicationService: ApplicationsService,
  ) { }

  ngOnChanges(): void {
    if (!this.app) {
      return;
    }
    this.loadingSources = true;
    this.applicationService.getCatalogItem(this.app.name, this.app.catalog, this.app.train)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (catalogItem) => {
          this.sources = [...(catalogItem?.versions[this.app.latest_version]?.chart_metadata?.sources || [])];
          this.cdr.markForCheck();
        },
        complete: () => {
          this.loadingSources = false;
          this.cdr.markForCheck();
        },
      });
    this.relativeDate = formatRelative(new Date(this.app.last_update.$date), new Date());
    this.cdr.markForCheck();
  }
}
