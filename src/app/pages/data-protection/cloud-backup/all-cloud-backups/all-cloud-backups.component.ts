import { Component, ChangeDetectionStrategy, DestroyRef, signal, OnInit, ChangeDetectorRef, Type, inject, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, NavigationStart, Router } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import { CloudBackupFormComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudBackupListComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { cloudBackupListElements } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.elements';

@Component({
  selector: 'ix-all-cloud-backups',
  templateUrl: './all-cloud-backups.component.html',
  styleUrls: ['./all-cloud-backups.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);

  dataProvider: AsyncDataProvider<CloudBackup>;
  protected readonly cloudBackups = signal<CloudBackup[]>([]);
  protected readonly searchableElements = cloudBackupListElements;
  protected readonly requiredRoles = [Role.CloudBackupWrite];

  constructor() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationStart), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.router.currentNavigation()?.extras?.state?.hideMobileDetails) {
          this.dataProvider.expandedRow = null;
          this.cdr.markForCheck();
        }
      });
  }

  ngOnInit(): void {
    this.route.fragment.pipe(
      tap((id) => this.loadCloudBackups(id || undefined)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  // CloudBackupFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges/requiredRoles) the panel reads; cast past the nominal base type.
  private readonly cloudBackupForm = CloudBackupFormComponent as unknown as Type<SidePanelForm>;

  protected openForm(row?: CloudBackup): void {
    this.formPanel.open(this.cloudBackupForm, {
      title: row
        ? this.translate.instant('Edit TrueCloud Backup Task')
        : this.translate.instant('Add TrueCloud Backup Task'),
      wide: true,
      inputs: { backupToEdit: row },
    }).onSuccess(() => this.dataProvider.load(), this.destroyRef);
  }

  private loadCloudBackups(id?: string): void {
    const cloudBackups$ = this.api.call('cloud_backup.query').pipe(
      tap((cloudBackups) => {
        this.cloudBackups.set(cloudBackups);

        const selectedBackup = id
          ? cloudBackups.find((cloudBackup) => cloudBackup.id.toString() === id)
          : cloudBackups.find((cloudBackup) => cloudBackup.id === this.dataProvider?.expandedRow?.id);

        if (!this.masterDetailView().isMobileView()) {
          if (selectedBackup) {
            this.dataProvider.expandedRow = selectedBackup;
          } else if (cloudBackups.length) {
            const [firstBackup] = cloudBackups;
            this.dataProvider.expandedRow = firstBackup;
          }
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
