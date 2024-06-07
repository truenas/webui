import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { helptextApps } from 'app/helptext/apps/apps';

@UntilDestroy()
@Component({
  selector: 'ix-dockerhub-rate-info-dialog',
  templateUrl: './dockerhub-rate-limit-info-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerHubRateInfoDialogComponent {
  helpText = helptextApps;
}
