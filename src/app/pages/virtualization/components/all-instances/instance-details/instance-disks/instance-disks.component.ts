import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  InstanceDiskFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disk-form/instance-disk-form.component';
import {
  DeleteDeviceButtonComponent,
} from 'app/pages/virtualization/components/common/delete-device-button/delete-device-button.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';

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
    DeleteDeviceButtonComponent,
  ],
})
export class InstanceDisksComponent {
  protected readonly isLoadingDevices = this.instanceStore.isLoadingDevices;

  constructor(
    private slideIn: ChainedSlideInService,
    private instanceStore: VirtualizationInstancesStore,
  ) {}

  protected readonly visibleDisks = computed(() => {
    return this.instanceStore.selectedInstanceDevices()
      .filter((device) => device.dev_type === VirtualizationDeviceType.Disk)
      // TODO: Second filter is due to Typescript issues.
      .filter((disk) => disk.source);
  });

  protected addDisk(): void {
    this.slideIn.open(InstanceDiskFormComponent, false, this.instanceStore.selectedInstance().id)
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (!result.response) {
          return;
        }
        this.instanceStore.loadDevices();
      });
  }
}
