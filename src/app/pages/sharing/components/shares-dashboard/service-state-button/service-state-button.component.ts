import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';

@Component({
  selector: 'ix-service-state-button',
  templateUrl: './service-state-button.component.html',
  styleUrls: ['./service-state-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceStateButtonComponent {
  @Input() service: Service;
  @Input() count: number;

  readonly serviceStatus = ServiceStatus;
  readonly serviceNames = serviceNames;

  get statusClass(): string {
    switch (this.service?.state) {
      case ServiceStatus.Running:
        return 'fn-theme-primary';
      case ServiceStatus.Stopped:
        return 'fn-theme-red';
      default:
        return 'fn-theme-orange';
    }
  }
}
