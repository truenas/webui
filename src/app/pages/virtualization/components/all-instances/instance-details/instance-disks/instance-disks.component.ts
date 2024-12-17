import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { filter } from 'rxjs/operators';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationDisk } from 'app/interfaces/virtualization.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  InstanceDiskFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import { DeviceActionsMenuComponent } from 'app/pages/virtualization/components/common/device-actions-menu/device-actions-menu.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { SlideIn } from 'app/services/slide-in';

@UntilDestroy()
@Component({
  selector: 'ix-instance-disks',
  templateUrl: './instance-disks.component.html',
  styleUrls: ['./instance-disks.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    NgxSkeletonLoaderModule,
    TestDirective,
    TranslateModule,
    DeviceActionsMenuComponent,
  ],
})
export class InstanceDisksComponent {
  protected readonly isLoadingDevices = this.deviceStore.isLoading;

  constructor(
    private slideIn: SlideIn,
    private deviceStore: VirtualizationDevicesStore,
  ) {}

  protected readonly visibleDisks = computed(() => {
    return this.deviceStore.devices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Disk)
      // TODO: Second filter is due to Typescript issues.
      .filter((disk) => disk.source);
  });

  protected addDisk(): void {
    this.openDiskForm();
  }

  protected editDisk(disk: VirtualizationDisk): void {
    this.openDiskForm(disk);
  }

  private openDiskForm(disk?: VirtualizationDisk): void {
    this.slideIn.open(InstanceDiskFormComponent, false, { disk, instanceId: this.deviceStore.selectedInstance().id })
      .pipe(filter((result) => !!result.response), untilDestroyed(this))
      .subscribe(() => this.deviceStore.loadDevices());
  }
}
