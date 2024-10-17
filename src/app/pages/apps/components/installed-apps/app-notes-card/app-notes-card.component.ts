import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { App } from 'app/interfaces/app.interface';
import { AppSectionExpandCollapseComponent } from 'app/pages/apps/components/app-section-expand-collapse/app-section-expand-collapse.component';

@Component({
  selector: 'ix-app-notes-card',
  templateUrl: './app-notes-card.component.html',
  styleUrls: ['./app-notes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardHeader,
    MatCardTitle,
    MatCardContent,
    AppSectionExpandCollapseComponent,
    TranslateModule,
    MarkdownModule,
  ],
})
export class AppNotesCardComponent {
  readonly app = input.required<App>();
}
