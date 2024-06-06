import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextApps } from 'app/helptext/apps/apps';
import { DockerHubRateLimit } from 'app/interfaces/dockerhub-rate-limit.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dockerhub-rate-info-dialog',
  templateUrl: './dockerhub-rate-limit-info-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DockerHubRateInfoDialogComponent {
  helpText = helptextApps;

  get warningText(): string {
    return this.translate.instant(
      this.helpText.dockerHubRateLimit.message,
    );
  }

  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: DockerHubRateLimit,
  ) {}
}
