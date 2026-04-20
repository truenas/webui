import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent } from '@truenas/ui-components';
import { App, AppMetadata } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import {
  AppMetadataDialog,
} from 'app/pages/apps/components/installed-apps/app-metadata-card/app-metadata-dialog/app-metadata-dialog.component';

@Component({
  selector: 'ix-app-metadata-card',
  templateUrl: './app-metadata-card.component.html',
  styleUrls: ['./app-metadata-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    CardExpandCollapseComponent,
    TnIconButtonComponent,
  ],
})
export class AppMetadataCardComponent {
  private tnDialog = inject(TnDialog);

  readonly app = input<App | null>(null);
  readonly appMetadata = input.required<AppMetadata>();
  readonly maxHeight = input(250);

  protected openInDialog(): void {
    this.tnDialog.open(AppMetadataDialog, {
      data: {
        name: this.app()?.name ?? '',
        metadata: this.appMetadata(),
      },
    });
  }
}
