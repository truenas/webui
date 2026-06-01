import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TnDialogShellComponent } from '@truenas/ui-components';
import { MatButton } from '@angular/material/button';
import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { ServicesToBeRestartedInfo } from 'app/interfaces/pool-export.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-services-to-be-restarted-dialog',
  templateUrl: './services-to-be-restarted-dialog.component.html',
  styleUrl: './services-to-be-restarted-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class ServicesToBeRestartedDialogComponent {
  protected servicesInfo = inject<ServicesToBeRestartedInfo>(DIALOG_DATA);

  protected readonly helptext = helptextVolumes;
}
