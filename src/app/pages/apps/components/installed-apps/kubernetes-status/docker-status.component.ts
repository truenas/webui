import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DockerStatus, dockerStatusLabels } from 'app/enums/docker-status.enum';
import { DockerStore } from 'app/pages/apps/store/docker.service';

@Component({
  selector: 'ix-docker-status',
  templateUrl: './docker-status.component.html',
  styleUrls: ['./docker-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerStatusComponent {
  readonly DockerStatus = DockerStatus;
  readonly dockerStatusLabels = dockerStatusLabels;

  status = this.store.status;
  statusDescription = this.store.statusDescription;

  constructor(private store: DockerStore) {}
}
