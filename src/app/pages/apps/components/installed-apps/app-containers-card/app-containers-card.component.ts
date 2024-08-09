import {
  ChangeDetectionStrategy, Component, Input, ChangeDetectorRef, OnChanges,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map } from 'rxjs';
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { Role } from 'app/enums/role.enum';
import { App, AppContainerDetails } from 'app/interfaces/app.interface';
import { PodDialogFormValue } from 'app/interfaces/pod-select-dialog.interface';
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

  containerDetailsList: AppContainerDetails[];

  protected readonly requiredRoles = [Role.AppsWrite];

  constructor(
    private appService: ApplicationsService,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private router: Router,
    private translate: TranslateService,
  ) {
    this.containerDetailsList = this.app?.active_workloads?.container_details;
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

  viewLogsButtonPressed(containerDetails: AppContainerDetails): void {
    this.router.navigate([
      '/apps',
      'installed',
      this.app.metadata.train,
      this.app.name,
      'logs',
      containerDetails.id,
    ]);
  }

  private getResources(): void {
    this.isLoading = true;
    this.appService.getApp(this.app.name).pipe(
      map((apps) => apps[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (app) => {
        this.app = app;
        this.isLoading = false;
        this.containerDetailsList = this.app?.active_workloads?.container_details;
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
}
