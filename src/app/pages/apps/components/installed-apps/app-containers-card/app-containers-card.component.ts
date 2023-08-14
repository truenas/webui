import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { PodSelectDialogType } from 'app/enums/pod-select-dialog.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { PodDialogFormValue } from 'app/interfaces/pod-select-dialog.interface';
import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select-dialog/pod-select-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { getPorts } from 'app/pages/apps/utils/get-ports';

@UntilDestroy()
@Component({
  selector: 'ix-app-containers-card',
  templateUrl: './app-containers-card.component.html',
  styleUrls: ['./app-containers-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppContainersCardComponent implements OnChanges {
  @Input() app: ChartRelease;
  isLoading = false;
  readonly chartReleaseStatus = ChartReleaseStatus;

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) {}

  ngOnChanges(): void {
    this.getResources();
  }

  shellButtonPressed(): void {
    this.matDialog.open(PodSelectDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        app: this.app,
        appName: this.app.name,
        title: this.translate.instant('Choose pod'),
        type: PodSelectDialogType.Shell,
        customSubmit: (values: PodDialogFormValue) => this.shellDialogSubmit(values),
      },
    });
  }

  viewLogsButtonPressed(): void {
    this.matDialog.open(PodSelectDialogComponent, {
      minWidth: '650px',
      maxWidth: '850px',
      data: {
        app: this.app,
        appName: this.app.name,
        title: this.translate.instant('Choose pod'),
        type: PodSelectDialogType.Logs,
        customSubmit: (formValueDialog: PodDialogFormValue) => {
          this.logDialogSubmit(formValueDialog);
        },
      },
    });
  }

  private getResources(): void {
    this.isLoading = true;
    this.appService.getChartReleaseWithResources(this.app.name).pipe(
      map((apps) => apps[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (app) => {
        this.app = app;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.app = undefined;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getPorts(app: ChartRelease): string {
    return getPorts(app.used_ports);
  }

  private shellDialogSubmit(formValue: { [key: string]: string }): void {
    this.router.navigate([
      '/apps',
      'installed',
      this.app.catalog,
      this.app.catalog_train,
      this.app.name,
      'shell',
      formValue.pods,
      formValue.command,
    ]);
  }

  private logDialogSubmit(formValue: { [key: string]: string }): void {
    const tailLines = (formValue.tail_lines).toString();
    this.router.navigate([
      '/apps',
      'installed',
      this.app.catalog,
      this.app.catalog_train,
      this.app.name,
      'logs',
      formValue.pods,
      formValue.containers,
      tailLines,
    ]);
  }
}
