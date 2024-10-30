import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule } from '@ngx-translate/core';
import { AppMetadata } from 'app/interfaces/app.interface';
import { AppSectionExpandCollapseComponent } from 'app/pages/apps/components/app-section-expand-collapse/app-section-expand-collapse.component';

@Component({
  selector: 'ix-app-metadata-card',
  templateUrl: './app-metadata-card.component.html',
  styleUrls: ['./app-metadata-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    AppSectionExpandCollapseComponent,
  ],
})
export class AppMetadataCardComponent {
  readonly appMetadata = input<AppMetadata>();
  readonly maxHeight = input(250);
}
