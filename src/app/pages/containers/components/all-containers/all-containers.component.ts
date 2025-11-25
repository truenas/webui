import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AllContainersHeaderComponent,
} from 'app/pages/containers/components/all-containers/all-containers-header/all-containers-header.component';
import { allContainersElements } from 'app/pages/containers/components/all-containers/all-containers.elements';
import { ContainerDetailsComponent } from 'app/pages/containers/components/all-containers/container-details/container-details.component';
import { ContainerListComponent } from 'app/pages/containers/components/all-containers/container-list/container-list.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-containers',
  templateUrl: './all-containers.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    AllContainersHeaderComponent,
    ContainerDetailsComponent,
    ContainerListComponent,
    MasterDetailViewComponent,
    UiSearchDirective,
  ],
})
export class AllContainersComponent implements OnInit {
  private configStore = inject(ContainerConfigStore);
  private containersStore = inject(ContainersStore);
  private dialogService = inject(DialogService);
  private window = inject<Window>(WINDOW);
  private translate = inject(TranslateService);

  readonly selectedContainer = this.containersStore.selectedContainer;
  protected readonly searchableElements = allContainersElements;

  ngOnInit(): void {
    this.configStore.initialize();
    this.containersStore.initialize();

    const showVmInstancesWarning = !this.window.localStorage.getItem('showNewVmInstancesWarning');

    if (showVmInstancesWarning) {
      this.dialogService.closeAllDialogs();

      this.dialogService.warn(
        this.translate.instant('Warning'),
        this.translate.instant('Containers are experimental and only recommended for advanced users. Make all configuration changes using the TrueNAS UI. Operations using the command line are not supported.'),
      ).pipe(untilDestroyed(this)).subscribe(() => {
        this.window.localStorage.setItem('showNewVmInstancesWarning', 'true');
      });
    }
  }
}
