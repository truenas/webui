import {
  Component, ChangeDetectionStrategy, signal, OnInit,
  ChangeDetectorRef,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudBackupListComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { cloudBackupListElements } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.elements';

@UntilDestroy()
@Component({
  selector: 'ix-all-cloud-backups',
  templateUrl: './all-cloud-backups.component.html',
  styleUrls: ['./all-cloud-backups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MasterDetailViewComponent,
    CloudBackupListComponent,
    CloudBackupDetailsComponent,
    PageHeaderComponent,
    TranslateModule,
    UiSearchDirective,
    RequiresRolesDirective,
    MatButton,
  ],
})
export class AllCloudBackupsComponent implements OnInit {
  dataProvider: AsyncDataProvider<CloudBackup>;
  protected readonly cloudBackups = signal<CloudBackup[]>([]);
  protected readonly searchableElements = cloudBackupListElements;
  protected readonly requiredRoles = [Role.CloudBackupWrite];

  constructor(
    private api: ApiService,
    private slideIn: SlideIn,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), untilDestroyed(this))
      .subscribe(() => {
        if (this.router.getCurrentNavigation()?.extras?.state?.hideMobileDetails) {
          this.dataProvider.expandedRow = null;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnInit(): void {
    this.route.fragment.pipe(
      tap((id) => this.loadCloudBackups(id || undefined)),
      untilDestroyed(this),
    ).subscribe();
  }

  openForm(row?: CloudBackup): void {
    this.slideIn.open(CloudBackupFormComponent, { data: row, wide: true })
      .pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      ).subscribe(() => this.dataProvider.load());
  }

  private loadCloudBackups(id?: string): void {
    const cloudBackups$ = this.api.call('cloud_backup.query').pipe(
      tap((cloudBackups) => {
        this.cloudBackups.set(cloudBackups);

        const selectedBackup = id
          ? cloudBackups.find((cloudBackup) => cloudBackup.id.toString() === id)
          : cloudBackups.find((cloudBackup) => cloudBackup.id === this.dataProvider?.expandedRow?.id);

        if (selectedBackup) {
          this.dataProvider.expandedRow = selectedBackup;
        } else if (cloudBackups.length) {
          const [firstBackup] = cloudBackups;
          this.dataProvider.expandedRow = firstBackup;
        }
        this.cdr.markForCheck();
      }),
    );

    this.dataProvider = new AsyncDataProvider<CloudBackup>(cloudBackups$);
    this.dataProvider.setSorting({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'description',
    });
    this.dataProvider.load();
  }
}
