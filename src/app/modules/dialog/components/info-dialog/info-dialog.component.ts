import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent, TnIconComponent } from '@truenas/ui-components';
import { TestDirective } from 'app/modules/test-id/test.directive';

export interface InfoDialogData {
  title: string;
  info: string;
  icon?: string;
  isHtml?: boolean;
}

@Component({
  selector: 'ix-info-dialog',
  templateUrl: './info-dialog.component.html',
  styleUrls: ['./info-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TnIconComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class InfoDialog {
  protected dialogRef = inject<DialogRef<boolean, InfoDialog>>(DialogRef);
  protected data = inject<InfoDialogData>(DIALOG_DATA);
}
