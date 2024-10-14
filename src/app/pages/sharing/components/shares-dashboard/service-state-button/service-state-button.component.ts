import { NgClass, LowerCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-service-state-button',
  templateUrl: './service-state-button.component.html',
  styleUrls: ['./service-state-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    MatTooltip,
    NgClass,
    TranslateModule,
    MapValuePipe,
    LowerCasePipe,
  ],
})
export class ServiceStateButtonComponent {
  readonly service = input<Service>();
  readonly count = input<number>();

  protected readonly serviceStatus = ServiceStatus;
  protected readonly serviceNames = serviceNames;

  readonly statusClass = computed(() => {
    switch (this.service()?.state) {
      case ServiceStatus.Running:
        return 'fn-theme-primary';
      case ServiceStatus.Stopped:
        return 'fn-theme-red';
      default:
        return 'fn-theme-orange';
    }
  });
}
