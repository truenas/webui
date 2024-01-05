import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { formatDistance } from 'date-fns';
import { helptextApps } from 'app/helptext/apps/apps';
import { DockerHubRateLimit } from 'app/interfaces/dockerhub-rate-limit.interface';

@UntilDestroy()
@Component({
  templateUrl: './dockerhub-rate-limit-info-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerHubRateInfoDialogComponent {
  helpText = helptextApps;

  get warningText(): string {
    return this.translate.instant(
      this.helpText.dockerHubRateLimit.message,
      {
        seconds: formatDistance(0, this.data.remaining_time_limit_in_secs * 1000, { includeSeconds: true }),
      },
    );
  }

  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: DockerHubRateLimit,
  ) {}
}
