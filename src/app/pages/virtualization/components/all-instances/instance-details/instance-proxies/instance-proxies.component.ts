import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  EMPTY, Observable, switchMap, tap,
} from 'rxjs';
import { VirtualizationDeviceType } from 'app/enums/virtualization.enum';
import { VirtualizationProxy } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  InstanceProxyFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxy-form/instance-proxy-form.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ApiService } from 'app/services/api.service';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-proxies',
  templateUrl: './instance-proxies.component.html',
  styleUrls: ['./instance-proxies.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    MatButton,
    TestDirective,
    NgxSkeletonLoaderModule,
    MatTooltip,
    MatIconButton,
    IxIconComponent,
  ],
})
export class InstanceProxiesComponent {
  protected readonly isLoadingDevices = this.instanceStore.isLoadingDevices;

  constructor(
    private slideIn: ChainedSlideInService,
    private instanceStore: VirtualizationInstancesStore,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private ws: ApiService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
  ) {}

  protected readonly proxies = computed(() => {
    return this.instanceStore.selectedInstanceDevices().filter((device) => {
      return device.dev_type === VirtualizationDeviceType.Proxy;
    });
  });

  protected addProxy(): void {
    this.slideIn.open(InstanceProxyFormComponent, false, this.instanceStore.selectedInstance().id)
      .pipe(untilDestroyed(this))
      .subscribe((result) => {
        if (!result.response) {
          return;
        }
        this.instanceStore.loadDevices();
      });
  }

  protected deleteProxyPressed(proxy: VirtualizationProxy): void {
    this.dialog.confirm({
      message: this.translate.instant('Are you sure you want to delete this proxy?'),
      title: this.translate.instant('Delete Proxy'),
    })
      .pipe(
        switchMap((confirmed) => {
          if (!confirmed) {
            return EMPTY;
          }

          return this.deleteProxy(proxy);
        }),
        untilDestroyed(this),
      )
      .subscribe();
  }

  private deleteProxy(proxy: VirtualizationProxy): Observable<unknown> {
    return this.ws.call('virt.instance.device_delete', [this.instanceStore.selectedInstance().id, proxy.name]).pipe(
      this.loader.withLoader(),
      this.errorHandler.catchError(),
      tap(() => {
        this.snackbar.success(this.translate.instant('Proxy deleted'));
        this.instanceStore.loadDevices();
      }),
    );
  }
}
