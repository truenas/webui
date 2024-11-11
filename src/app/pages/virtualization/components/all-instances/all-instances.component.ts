import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
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
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

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
  readonly selectedInstance = this.instancesStore.selectedInstance;
  readonly showMobileDetails = signal(false);

  constructor(
    private configStore: VirtualizationConfigStore,
    private instancesStore: VirtualizationInstancesStore,
  ) {}

  ngOnInit(): void {
    this.configStore.initialize();
    this.instancesStore.initialize();
  }
}
