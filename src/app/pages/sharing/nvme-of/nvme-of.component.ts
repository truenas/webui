import { Location } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, effect, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnSidePanelActionDirective, TnSidePanelComponent } from '@truenas/ui-components';
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
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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

@Component({
  selector: 'ix-nvme-of',
  templateUrl: './nvme-of.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    PageHeaderComponent,
    RequiresRolesDirective,
    TranslateModule,
    UiSearchDirective,
    MasterDetailViewComponent,
    SubsystemDetailsComponent,
    SubsystemsDetailsHeaderComponent,
    SubsystemsListComponent,
    NvmeOfConfigurationComponent,
    AddSubsystemComponent,
  ],
})
export class NvmeOfComponent implements OnInit {
  private nvmeOfStore = inject(NvmeOfStore);
  private activatedRoute = inject(ActivatedRoute);
  private location = inject(Location);
  private destroyRef = inject(DestroyRef);
  private unsavedChanges = inject(UnsavedChangesService);

  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);

  // Global Configuration form hosted in a <tn-side-panel> (the form is dual-host:
  // it still opens via legacy SlideIn from other call sites).
  protected readonly configPanelOpen = signal(false);
  protected readonly configForm = viewChild(NvmeOfConfigurationComponent);
  protected readonly configCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.configForm());

  // Add Subsystem wizard hosted in a <tn-side-panel>; the panel footer drives the
  // stepper (Next on step 1, Back + Save on step 2) via the form's step API.
  protected readonly addSubsystemPanelOpen = signal(false);
  protected readonly subsystemForm = viewChild(AddSubsystemComponent);
  protected readonly addSubsystemCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.subsystemForm());

  protected readonly subsystems = this.nvmeOfStore.subsystems;
  protected dataProvider = new ArrayDataProvider<NvmeOfSubsystemDetails>();
  private selectedSubsystemName: string | null = null;

  protected readonly isLoading = this.nvmeOfStore.isLoading;
  protected readonly searchableElements = nvmeOfElements;
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  constructor() {
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

    this.dataProvider.setEmptyType(EmptyType.NoPageData);

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

          if (!this.masterDetailView().isMobileView()) {
            this.dataProvider.expandedRow = (routeSelectedRow || subsystems[0]);
          }

          this.selectedSubsystemName = this.dataProvider.expandedRow?.name || null;
          setSubsystemNameInUrl(this.location, this.selectedSubsystemName);
        }
      }
    });

    this.dataProvider.expandedRow$
      .pipe(filter((row): row is NvmeOfSubsystemDetails => !!row))
      .pipe(takeUntilDestroyed(this.destroyRef))
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
    this.configPanelOpen.set(true);
  }

  protected onConfigClosed(): void {
    this.configPanelOpen.set(false);
  }

  protected addSubsystem(): void {
    this.addSubsystemPanelOpen.set(true);
  }

  protected onSubsystemCreated(subsystem: NvmeOfSubsystem): void {
    this.addSubsystemPanelOpen.set(false);
    this.selectedSubsystemName = subsystem.name;
    this.nvmeOfStore.initialize();
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
