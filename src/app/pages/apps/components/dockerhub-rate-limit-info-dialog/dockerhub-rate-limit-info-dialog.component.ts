import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { formatDistance } from 'date-fns';
import { helptextApps } from 'app/helptext/apps/apps';
import { DockerHubRateLimit } from 'app/interfaces/dockerhub-rate-limit.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-dockerhub-rate-info-dialog',
  templateUrl: './dockerhub-rate-limit-info-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    TnButtonComponent,
    TestDirective,
    RouterLink,
  ],
})
export class DockerHubRateInfoDialog {
  protected dialogRef = inject<DialogRef<unknown, DockerHubRateInfoDialog>>(DialogRef);
  private translate = inject(TranslateService);
  data = inject<DockerHubRateLimit>(DIALOG_DATA);

  helpText = helptextApps;

  get warningText(): string {
    return this.translate.instant(
      this.helpText.dockerHubRateLimit.message,
      {
        seconds: formatDistance(0, Number(this.data.remaining_time_limit_in_secs) * 1000, { includeSeconds: true }),
      },
    );
  }
}
