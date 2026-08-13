import { NgClass, LowerCasePipe, TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective, TnTooltipDirective } from '@truenas/ui-components';
import { serviceNames } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Service } from 'app/interfaces/service.interface';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-service-state-button',
  templateUrl: './service-state-button.component.html',
  styleUrls: ['./service-state-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    TnTooltipDirective,
    NgClass,
    TranslateModule,
    MapValuePipe,
    LowerCasePipe,
    TitleCasePipe,
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
        return 'fn-theme-green';
      case ServiceStatus.Stopped:
        return 'fn-theme-grey';
      default:
        return 'fn-theme-orange';
    }
  });
}
