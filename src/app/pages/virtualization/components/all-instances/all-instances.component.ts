import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  AllInstancesHeaderComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/all-instances-header.component';
import {
  InstanceDetailsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-details.component';
import { InstanceListComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-list.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { VirtualizationViewStore } from 'app/pages/virtualization/stores/virtualization-view.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances',
  templateUrl: './all-instances.component.html',
  styleUrls: ['./all-instances.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TranslateModule,
    AllInstancesHeaderComponent,
    InstanceDetailsComponent,
    InstanceListComponent,
    DetailsHeightDirective,
  ],
})
export class AllInstancesComponent implements OnInit {
  readonly isLoading = this.instancesStore.isLoading;

  readonly selectedInstance = this.deviceStore.selectedInstance;
  readonly showMobileDetails = this.viewStore.showMobileDetails;
  readonly isMobileView = this.viewStore.isMobileView;

  constructor(
    private configStore: VirtualizationConfigStore,
    private instancesStore: VirtualizationInstancesStore,
    private viewStore: VirtualizationViewStore,
    private deviceStore: VirtualizationDevicesStore,
  ) {}

  ngOnInit(): void {
    this.configStore.initialize();
    this.instancesStore.initialize();
    this.viewStore.initialize();
  }

  closeMobileDetails(): void {
    this.viewStore.closeMobileDetails();
  }
}
