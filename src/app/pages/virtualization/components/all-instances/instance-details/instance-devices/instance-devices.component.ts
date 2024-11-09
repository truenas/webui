import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, OnChanges, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatCardContent, MatCardModule,
} from '@angular/material/card';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { VirtualizationDevice, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-devices',
  templateUrl: './instance-devices.component.html',
  styleUrls: ['./instance-devices.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCardModule,
    TranslateModule,
    MatCardContent,
    MatProgressSpinner,
    TitleCasePipe,
  ],
})
export class InstanceDevicesComponent implements OnChanges {
  instance = input.required<VirtualizationInstance>();

  devices = signal<VirtualizationDevice[]>([]);
  isLoading = signal<boolean>(false);

  constructor(
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (!(changes.instance.currentValue as unknown as VirtualizationInstance).id) {
      return;
    }

    this.loadDevices();
  }

  loadDevices(): void {
    this.isLoading.set(true);
    this.ws.call('virt.instance.device_list', [this.instance().id])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (devices) => {
          this.devices.set(devices);
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
          this.isLoading.set(false);
        },
      });
  }
}
