import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-details-similar',
  templateUrl: './app-details-similar.component.html',
  styleUrls: ['./app-details-similar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsSimilarComponent implements OnChanges {
  @Input() app: AvailableApp;

  protected similarAppsLoading$ = new BehaviorSubject<boolean>(false);
  protected similarApps: AvailableApp[] = [];

  private readonly maxSimilarApps = 6;

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnChanges(): void {
    this.loadSimilarApps();
  }

  private loadSimilarApps(): void {
    this.similarAppsLoading$.next(true);
    this.appService.getAppSimilarApps(this.app).pipe(untilDestroyed(this)).subscribe({
      next: (apps) => {
        this.similarApps = apps.slice(0, this.maxSimilarApps);
        this.similarAppsLoading$.next(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.similarAppsLoading$.next(false);
        this.cdr.markForCheck();
      },
    });
  }

  trackByAppId(id: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
