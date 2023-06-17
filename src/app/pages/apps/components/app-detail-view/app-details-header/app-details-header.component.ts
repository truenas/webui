import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { map, Observable } from 'rxjs';
import { AvailableApp } from 'app/interfaces/available-app.interface';
import { SelectPoolDialogComponent } from 'app/pages/apps-old/select-pool-dialog/select-pool-dialog.component';
import { AppsStore } from 'app/pages/apps/store/apps-store.service';

@UntilDestroy()
@Component({
  selector: 'ix-app-details-header',
  templateUrl: './app-details-header.component.html',
  styleUrls: ['./app-details-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppDetailsHeaderComponent implements OnInit {
  @Input() app: AvailableApp;
  @Input() isLoading$: Observable<boolean>;

  protected wasPoolSet = false;

  constructor(
    private applicationsStore: AppsStore,
    private router: Router,
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  get description(): string {
    return this.app?.app_readme?.replace(/<[^>]*>/g, '');
  }

  ngOnInit(): void {
    this.checkIfPoolSet();
  }

  navigateToAllInstalledPage(): void {
    this.applicationsStore.installedApps$.pipe(
      map((apps) => {
        return apps.filter((app) => {
          return app.chart_metadata.name === this.app.name
            && app.catalog === this.app.catalog
            && app.catalog_train === this.app.train;
        });
      }),
      untilDestroyed(this),
    ).subscribe((apps) => {
      if (apps.length) {
        this.router.navigate(['/apps', 'installed', apps[0].name]);
      } else {
        this.router.navigate(['/apps', 'installed']);
      }
    });
  }

  navigateToInstallPage(): void {
    this.router.navigate(['/apps', 'available', this.app.catalog, this.app.train, this.app.name, 'install']);
  }

  showChoosePoolModal(): void {
    const dialog = this.matDialog.open(SelectPoolDialogComponent);
    dialog.afterClosed().pipe(untilDestroyed(this)).subscribe((success) => {
      if (!success) {
        return;
      }
      this.wasPoolSet = true;
      this.cdr.markForCheck();
      this.navigateToInstallPage();
    });
  }

  private checkIfPoolSet(): void {
    this.applicationsStore.selectedPool$.pipe(untilDestroyed(this)).subscribe((pool) => {
      this.wasPoolSet = Boolean(pool);
      this.cdr.markForCheck();
    });
  }
}
