import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { DockerStatus, dockerStatusLabels } from 'app/enums/docker-status.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { DockerStore } from 'app/pages/apps/store/docker.store';

@UntilDestroy(this)
@Component({
  selector: 'ix-docker-status',
  templateUrl: './docker-status.component.html',
  styleUrls: ['./docker-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    MatTooltip,
    IxIconComponent,
    TranslateModule,
    MapValuePipe,
    MatProgressSpinner,
  ],
})
export class DockerStatusComponent {
  readonly DockerStatus = DockerStatus;
  readonly dockerStatusLabels = dockerStatusLabels;

  status$ = this.store.status$;
  statusDescription$ = this.store.statusDescription$;

  constructor(private store: DockerStore) { }
}
