import {
  ChangeDetectionStrategy, Component, OnChanges,
  input, signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
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
  readonly app = input.required< AvailableApp>();

  protected isLoading = signal(false);
  protected similarApps = signal<AvailableApp[]>([]);
  protected loadingError = signal<unknown>(null);

  private readonly maxSimilarApps = 6;

  constructor(
    protected router: Router,
    private appService: ApplicationsService,
  ) { }

  ngOnChanges(): void {
    this.loadSimilarApps();
  }

  private loadSimilarApps(): void {
    this.isLoading.set(true);
    this.appService.getSimilarApps(this.app()).pipe(untilDestroyed(this)).subscribe({
      next: (apps) => {
        this.isLoading.set(false);
        this.similarApps.set(apps.slice(0, this.maxSimilarApps));
      },
      error: (error) => {
        this.isLoading.set(false);
        console.error(error);
        this.loadingError.set(error);
      },
    });
  }

  trackByAppId(_: number, app: AvailableApp): string {
    return `${app.catalog}-${app.train}-${app.name}`;
  }
}
