import { ChangeDetectionStrategy, Component, Inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
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
    FormActionsComponent,
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    TestDirective,
    TranslateModule,
    MatDialogClose,
  ],
})
export class ServicesToBeRestartedDialogComponent {
  protected readonly helptext = helptextVolumes;

  constructor(
    @Inject(MAT_DIALOG_DATA) protected servicesInfo: ServicesToBeRestartedInfo,
  ) {}
}
