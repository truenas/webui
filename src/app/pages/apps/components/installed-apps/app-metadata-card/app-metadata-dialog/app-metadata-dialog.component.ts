import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { AppMetadata } from 'app/interfaces/app.interface';
import {
  AppMetadataListComponent,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-list/app-metadata-list.component';

export interface AppMetadataDialogData {
  name: string;
  metadata: AppMetadata;
}

@Component({
  selector: 'ix-app-metadata-dialog',
  templateUrl: './app-metadata-dialog.component.html',
  styleUrls: ['./app-metadata-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TnButtonComponent,
    TranslateModule,
    AppMetadataListComponent,
  ],
})
export class AppMetadataDialog {
  private ref = inject<DialogRef<void>>(DialogRef);
  protected data = inject<AppMetadataDialogData>(DIALOG_DATA);

  protected close(): void {
    this.ref.close();
  }
}
