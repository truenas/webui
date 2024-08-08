import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { CatalogAppState } from 'app/enums/chart-release-status.enum';
import { Role } from 'app/enums/role.enum';
import { App } from 'app/interfaces/chart-release.interface';
import { PodDialogFormValue } from 'app/interfaces/pod-select-dialog.interface';
// import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select-dialog/pod-select-dialog.component';
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
  @Input() app: App;
  isLoading = false;
  readonly chartReleaseStatus = CatalogAppState;

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
  // containerImages: Record<string, ChartContainerImage>;

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) {
    // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
    // this.containerImages = this.app?.resources?.container_images;
  }

  ngOnChanges(): void {
    this.getResources();
  }

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392
  // shellButtonPressed(containerImageKey: string): void {
  // this.matDialog.open(PodSelectDialogComponent, {
  //   minWidth: '650px',
  //   maxWidth: '850px',
  //   data: {
  //     containerImageKey,
  //     app: this.app,
  //     appName: this.app.name,
  //     title: this.translate.instant('Choose pod'),
  //     type: PodSelectDialogType.Shell,
  //     customSubmit: (values: PodDialogFormValue) => this.shellDialogSubmit(values),
  //   },
  // });
  // }

  // viewLogsButtonPressed(containerImageKey: string): void {
  // TODO: https://ixsystems.atlassian.net/browse/NAS-130392

  // this.matDialog.open(PodSelectDialogComponent, {
  //   minWidth: '650px',
  //   maxWidth: '850px',
  //   data: {
  //     containerImageKey,
  //     app: this.app,
  //     appName: this.app.name,
  //     title: this.translate.instant('Choose pod'),
  //     type: PodSelectDialogType.Logs,
  //     customSubmit: (formValueDialog: PodDialogFormValue) => {
  //       this.logDialogSubmit(formValueDialog);
  //     },
  //   },
  // });
  // }

  private getResources(): void {
    this.isLoading = true;
    this.appService.getApp(this.app.name).pipe(
      map((apps) => apps[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (app) => {
        this.app = app;
        this.isLoading = false;
        // TODO: https://ixsystems.atlassian.net/browse/NAS-130379
        // this.containerImages = this.app?.resources?.container_images;
        this.cdr.markForCheck();
      },
      error: () => {
        this.app = undefined;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  getPorts(app: App): string {
    return getPorts(app.active_workloads.used_ports);
  }

  private shellDialogSubmit(formValue: PodDialogFormValue): void {
    this.router.navigate([
      '/apps',
      'installed',
      this.app.metadata.train,
      this.app.name,
      'shell',
      formValue.pods,
      formValue.command,
    ]);
  }

  private logDialogSubmit(formValue: PodDialogFormValue): void {
    const tailLines = (formValue.tail_lines).toString();
    this.router.navigate([
      '/apps',
      'installed',
      this.app.metadata.train,
      this.app.name,
      'logs',
      formValue.pods,
      formValue.containers,
      tailLines,
    ]);
  }
}
