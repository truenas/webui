import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { helptextVolumes } from 'app/helptext/storage/volumes/volume-list';
import { ServicesToBeRestartedInfo } from 'app/interfaces/pool-export.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';

@Component({
  selector: 'ix-services-to-be-restarted-dialog',
  templateUrl: './services-to-be-restarted-dialog.component.html',
  styleUrl: './services-to-be-restarted-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    FormActionsComponent,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class ServicesToBeRestartedDialogComponent {
  protected dialogRef = inject<DialogRef<unknown, ServicesToBeRestartedDialogComponent>>(DialogRef);
  protected servicesInfo = inject<ServicesToBeRestartedInfo>(DIALOG_DATA);

  protected readonly helptext = helptextVolumes;
}
