import {
  ChangeDetectionStrategy, Component, effect,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  filter, Observable, switchMap,
  tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { LoaderService } from 'app/modules/loader/loader.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import { SubsystemDeleteDialogComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-delete-dialog/subsystem-delete-dialog.component';
import { SubsystemDetailsComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystem-details/subsystem-details.component';
import { SubsystemsListComponent } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/subsystems-list/subsystems-list.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of-subsystems',
  templateUrl: './nvme-of-subsystems.component.html',
  styleUrl: './nvme-of-subsystems.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    SubsystemsListComponent,
    MasterDetailViewComponent,
    SubsystemDetailsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
  ],
})
export class NvmeOfSubsystemsComponent {
  protected dataProvider = new ArrayDataProvider<NvmeOfSubsystem>();
  protected readonly subsystems = this.nvmeOfStore.subsystems;
  protected readonly isLoading = this.nvmeOfStore.isLoading;

  protected readonly requiredRoles = [
    Role.SharingNvmeTargetWrite,
    Role.SharingNvmeTargetWrite,
    Role.SharingWrite,
  ];

  constructor(
    private nvmeOfStore: NvmeOfStore,
    private matDialog: MatDialog,
    private slideIn: SlideIn,
    private api: ApiService,
    private loader: LoaderService,
  ) {
    effect(() => {
      const subsystems = this.subsystems();
      const firstSubsystem = subsystems[subsystems.length - 1];
      if (!this.dataProvider.expandedRow && firstSubsystem) {
        this.dataProvider.expandedRow = firstSubsystem;
      }
      this.dataProvider.setRows(subsystems);
    });

    effect(() => {
      const isLoading = this.isLoading();
      if (isLoading) {
        this.dataProvider.setEmptyType(EmptyType.Loading);
        return;
      }

      const subsystems = this.subsystems();
      if (!subsystems.length) {
        this.dataProvider.setEmptyType(EmptyType.NoPageData);
        return;
      }
      this.dataProvider.setEmptyType(EmptyType.None);
    });
  }

  deleteSubsys(subsystem: NvmeOfSubsystem): void {
    (this.matDialog.open(
      SubsystemDeleteDialogComponent,
      { data: subsystem, minWidth: '500px' },
    ).afterClosed() as Observable<{ confirmed: boolean; force: boolean }>).pipe(
      filter(({ confirmed }) => confirmed),
      tap(() => this.loader.open()),
      switchMap(({ force }) => this.api.call('nvmet.subsys.delete', [subsystem.id, { force }])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.loader.close();
        this.dataProvider.expandedRow = null;
        this.nvmeOfStore.initialize();
      },
    });
  }

  editSubsystem(): void {
    this.slideIn.open(
      AddSubsystemComponent,
      { wide: true },
    ).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(({ response }: { response: NvmeOfSubsystem | boolean }) => {
      this.dataProvider.expandedRow = response as NvmeOfSubsystem;
      this.nvmeOfStore.initialize();
    });
  }
}
