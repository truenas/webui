import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import helptext_cloudsync from 'app/helptext/data-protection/cloudsync/cloudsync-form';

@Component({
  selector: 'ix-transfer-mode-explanation',
  templateUrl: './transfer-mode-explanation.component.html',
  styleUrls: ['./transfer-mode-explanation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferModeExplanationComponent {
  @Input() mode: TransferMode;

  readonly TransferMode = TransferMode;

  readonly helptext = helptext_cloudsync;
}
