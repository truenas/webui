import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { DockerStatus, dockerStatusLabels } from 'app/enums/docker-status.enum';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@Component({
  selector: 'ix-docker-status',
  templateUrl: './docker-status.component.html',
  styleUrls: ['./docker-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    MatTooltip,
    TnIconComponent,
    TranslateModule,
    MapValuePipe,
    MatProgressSpinner,
  ],
})
export class DockerStatusComponent {
  private store = inject(DockerStore);

  readonly DockerStatus = DockerStatus;
  readonly dockerStatusLabels = dockerStatusLabels;

  status$ = this.store.status$;
  statusDescription$ = this.store.statusDescription$;
}
