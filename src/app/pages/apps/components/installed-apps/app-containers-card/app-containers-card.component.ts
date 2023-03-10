import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { map } from 'rxjs';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-containers-card',
  templateUrl: './app-containers-card.component.html',
  styleUrls: ['./app-containers-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppContainersCardComponent implements OnInit {
  @Input() app: ChartRelease;
  appResources: ChartRelease;

  constructor(
    private snackbar: SnackbarService,
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getResources();
  }

  onShellPressed(): void {
    this.snackbar.success('Shell Pressed!');
  }

  getResources(): void {
    this.appService.getChartReleaseWithResources(this.app.name).pipe(
      map((apps) => apps[0]),
      untilDestroyed(this),
    ).subscribe((app) => {
      this.appResources = app;
      this.cdr.markForCheck();
    });
  }

  getPorts(app: ChartRelease): string {
    return this.appService.getPorts(app);
  }
}
