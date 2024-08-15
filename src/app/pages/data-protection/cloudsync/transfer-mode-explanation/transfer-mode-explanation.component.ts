import {
  ChangeDetectionStrategy, Component, input,
} from '@angular/core';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { helptextCloudSync } from 'app/helptext/data-protection/cloudsync/cloudsync';

@Component({
  selector: 'ix-transfer-mode-explanation',
  templateUrl: './transfer-mode-explanation.component.html',
  styleUrls: ['./transfer-mode-explanation.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferModeExplanationComponent {
  readonly mode = input.required< TransferMode>();

  readonly TransferMode = TransferMode;

  readonly helptext = helptextCloudSync;
}
