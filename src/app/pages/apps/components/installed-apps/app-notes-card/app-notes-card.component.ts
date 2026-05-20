import {
  ChangeDetectionStrategy, Component, inject, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent } from '@truenas/ui-components';
import { MarkdownModule } from 'ngx-markdown';
import { App } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';
import {
  AppNotesDialog,
} from 'app/pages/apps/components/installed-apps/app-notes-card/app-notes-dialog/app-notes-dialog.component';
import { appNotesCardAnchorId } from 'app/pages/apps/components/installed-apps/installed-apps.constants';

@Component({
  selector: 'ix-app-notes-card',
  templateUrl: './app-notes-card.component.html',
  styleUrls: ['./app-notes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    CardExpandCollapseComponent,
    TranslateModule,
    MarkdownModule,
    TnIconButtonComponent,
  ],
})
export class AppNotesCardComponent {
  private tnDialog = inject(TnDialog);

  readonly app = input.required<App>();

  protected readonly anchorId = appNotesCardAnchorId;

  protected openInDialog(): void {
    this.tnDialog.open(AppNotesDialog, {
      data: {
        name: this.app().name,
        notes: this.app().notes,
      },
    });
  }
}
