import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AllInstancesHeaderComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/all-instances-header.component';
import { allInstancesElements } from 'app/pages/instances/components/all-instances/all-instances.elements';
import { InstanceDetailsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import { InstanceListComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-list.component';
import { ContainerConfigStore } from 'app/pages/instances/stores/container-config.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances',
  templateUrl: './all-instances.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    AllInstancesHeaderComponent,
    InstanceDetailsComponent,
    InstanceListComponent,
    MasterDetailViewComponent,
    UiSearchDirective,
  ],
})
export class AllInstancesComponent implements OnInit {
  private configStore = inject(ContainerConfigStore);
  private instancesStore = inject(ContainerInstancesStore);
  private dialogService = inject(DialogService);
  private window = inject<Window>(WINDOW);
  private translate = inject(TranslateService);

  readonly selectedInstance = this.instancesStore.selectedInstance;
  protected readonly searchableElements = allInstancesElements;

  ngOnInit(): void {
    this.configStore.initialize();
    this.instancesStore.initialize();

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
