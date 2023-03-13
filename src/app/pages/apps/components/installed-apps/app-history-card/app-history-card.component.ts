import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnInit, OnChanges,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { ChartReleaseEvent } from 'app/interfaces/chart-release-event.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-history-card',
  templateUrl: './app-history-card.component.html',
  styleUrls: ['./app-history-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppHistoryCardComponent implements OnInit, OnChanges {
  @Input() app: ChartRelease;
  isLoading = false;
  events: ChartReleaseEvent[] = [];

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  ngOnChanges(): void {
    this.events = [];
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.appService.getChartReleaseEvents(this.app.name).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (events) => {
        this.events = events;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.events = [];
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }
}
