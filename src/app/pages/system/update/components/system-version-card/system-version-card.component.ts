import { Component, ChangeDetectionStrategy } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard } from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, map, shareReplay,
} from 'rxjs';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { getSystemVersion } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';

@Component({
  selector: 'ix-system-version-card',
  templateUrl: './system-version-card.component.html',
  styleUrls: ['./system-version-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    TranslateModule,
    CopyButtonComponent,
    NgxSkeletonLoaderModule,
  ],
})
export class SystemVersionCardComponent {
  private readonly systemInfo$ = this.api.call('webui.main.dashboard.sys_info').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly systemVersion = toSignal(this.systemInfo$.pipe(
    map((info) => getSystemVersion(info.version, info.codename)),
  ));

  protected readonly standbySystemVersion = toSignal(this.systemInfo$.pipe(
    filter((info) => Boolean(info?.remote_info?.version)),
    map((info) => getSystemVersion(info.remote_info.version, info?.remote_info?.codename)),
  ));

  constructor(private api: ApiService) { }
}
