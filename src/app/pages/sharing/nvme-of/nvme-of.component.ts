import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { nvmeOfElements } from 'app/pages/sharing/nvme-of/nvme-of.elements';
import { NvmeOfSubsystemDetails } from 'app/pages/sharing/nvme-of/services/nvme-of-subsystem-details.interface';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  SubsystemDetailsComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-details.component';
import {
  SubsystemsDetailsHeaderComponent,
} from 'app/pages/sharing/nvme-of/subsystem-details-header/subsystems-details-header.component';
import {
  SubsystemsListComponent,
} from 'app/pages/sharing/nvme-of/subsystems-list/subsystems-list.component';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of',
  templateUrl: './nvme-of.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    PageHeaderComponent,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    UiSearchDirective,
    MasterDetailViewComponent,
    SubsystemDetailsComponent,
    SubsystemsDetailsHeaderComponent,
    SubsystemsListComponent,
  ],
})
export class NvmeOfComponent implements OnInit {
  protected readonly subsystems = this.nvmeOfStore.subsystems;

  protected dataProvider = new ArrayDataProvider<NvmeOfSubsystemDetails>();

  protected readonly isLoading = this.nvmeOfStore.isLoading;
  protected readonly searchableElements = nvmeOfElements;
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  constructor(
    private nvmeOfStore: NvmeOfStore,
    private slideIn: SlideIn,
  ) {
    this.setupDataProvider();
  }

  ngOnInit(): void {
    this.nvmeOfStore.initialize();
  }

  private setupDataProvider(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });

    effect(() => {
      const subsystems = this.subsystems();
      const isLoading = this.isLoading();

      this.dataProvider.setRows(subsystems);

      if (!isLoading) {
        if (!subsystems.length) {
          this.dataProvider.setEmptyType(EmptyType.NoPageData);
        } else {
          this.dataProvider.expandedRow = subsystems[0];
        }
      }
    });
  }

  protected onFilter(query: string): void {
    this.dataProvider.setFilter({
      list: this.subsystems(),
      query,
      columnKeys: ['name'],
    });
  }

  protected openGlobalConfiguration(): void {
    this.slideIn.open(NvmeOfConfigurationComponent);
  }

  protected addSubsystem(): void {
    this.slideIn.open(AddSubsystemComponent).pipe(
      filter(({ response }) => !!response),
      untilDestroyed(this),
    ).subscribe(() => this.nvmeOfStore.initialize());
  }

  protected onSubsystemRemoved(): void {
    this.nvmeOfStore.initialize();
    this.dataProvider.expandedRow = null;
  }
}
