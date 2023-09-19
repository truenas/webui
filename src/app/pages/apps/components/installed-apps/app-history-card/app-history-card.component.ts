import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnInit, OnChanges,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { map, take } from 'rxjs';
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
  protected isLoading = false;
  protected events: ChartReleaseEvent[] = [];

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(): void {
    this.loadEvents();
  }

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.isLoading = true;
    this.appService.getChartReleaseEvents(this.app.name).pipe(
      map((events) => events.sort((a, b) => {
        return b.metadata.creation_timestamp?.$date - a.metadata.creation_timestamp?.$date;
      })),
      take(1),
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
