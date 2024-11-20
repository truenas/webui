import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { MobileBackButtonComponent } from 'app/modules/buttons/mobile-back-button/mobile-back-button.component';
import {
  EventDataDetailsCardComponent,
} from 'app/pages/audit/components/event-data-details-card/event-data-details-card.component';
import {
  MetadataDetailsCardComponent,
} from 'app/pages/audit/components/metadata-details-card/metadata-details-card.component';

@Component({
  selector: 'ix-log-details-panel',
  templateUrl: './log-details-panel.component.html',
  styleUrls: ['./log-details-panel.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EventDataDetailsCardComponent,
    MetadataDetailsCardComponent,
    TranslateModule,
    MobileBackButtonComponent,
  ],
})
export class LogDetailsPanelComponent {
  readonly log = input.required<AuditEntry>();

  readonly hide = output();

  onCloseMobileDetails(): void {
    this.hide.emit();
  }
}
