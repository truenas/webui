import {
  ChangeDetectionStrategy, Component, input, viewChild,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { App } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';

export const focusNotesEvent = 'focus-notes';

@Component({
  selector: 'ix-app-notes-card',
  templateUrl: './app-notes-card.component.html',
  styleUrls: ['./app-notes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    [`(${focusNotesEvent})`]: 'expand()',
  },
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    CardExpandCollapseComponent,
    TranslateModule,
    MarkdownModule,
  ],
})
export class AppNotesCardComponent {
  readonly app = input.required<App>();

  private expandCollapse = viewChild.required(CardExpandCollapseComponent);

  expand(): void {
    this.expandCollapse().expand();
  }
}
