import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppMetadata } from 'app/interfaces/app.interface';
import { CardExpandCollapseComponent } from 'app/modules/card-expand-collapse/card-expand-collapse.component';

@Component({
  selector: 'ix-app-metadata-list',
  templateUrl: './app-metadata-list.component.html',
  styleUrls: ['./app-metadata-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    TranslateModule,
    CardExpandCollapseComponent,
  ],
})
export class AppMetadataListComponent {
  readonly appMetadata = input.required<AppMetadata>();

  /** When true, each section is wrapped in a collapsible container (card layout). */
  readonly expandable = input(false);
  readonly maxHeight = input(250);
}
