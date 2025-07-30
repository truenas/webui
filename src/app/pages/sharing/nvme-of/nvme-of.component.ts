import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, effect, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystem, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
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
import { setSubsystemNameInUrl } from 'app/pages/sharing/nvme-of/utils/router-utils';

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

  private selectedSubsystemName: string | null = null;

  protected readonly isLoading = this.nvmeOfStore.isLoading;
  protected readonly searchableElements = nvmeOfElements;
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  constructor(
    private nvmeOfStore: NvmeOfStore,
    private slideIn: SlideIn,
    private activatedRoute: ActivatedRoute,
    private location: Location,
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
          const urlName = this.activatedRoute.snapshot.paramMap.get('name');
          const selectedName = this.selectedSubsystemName || urlName;
          const routeSelectedRow = subsystems.find((subsystem) => subsystem.name === selectedName);
          this.dataProvider.expandedRow = routeSelectedRow || subsystems[0];
          this.selectedSubsystemName = this.dataProvider.expandedRow?.name || null;
          setSubsystemNameInUrl(this.location, this.selectedSubsystemName);
        }
      }
    });

    this.dataProvider.expandedRow$
      .pipe(filter((row): row is NvmeOfSubsystemDetails => !!row))
      .pipe(untilDestroyed(this))
      .subscribe((row) => {
        this.selectedSubsystemName = row.name;
        setSubsystemNameInUrl(this.location, row.name);
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
    ).subscribe(({ response }) => {
      this.selectedSubsystemName = (response as NvmeOfSubsystem).name;
      this.nvmeOfStore.initialize();
    });
  }

  protected onSubsystemSelected(subsystem: NvmeOfSubsystemDetails): void {
    this.dataProvider.expandedRow = subsystem;
    this.selectedSubsystemName = subsystem.name;
    setSubsystemNameInUrl(this.location, subsystem.name);
  }

  protected onSubsystemRenamed(newName: string): void {
    this.selectedSubsystemName = newName;
    setSubsystemNameInUrl(this.location, newName);
  }

  protected onSubsystemRemoved(): void {
    this.nvmeOfStore.initialize();
    this.dataProvider.expandedRow = null;
  }
}
