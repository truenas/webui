import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { BottomSheetService } from 'app/services/bottom-sheet.service';

@Component({
  selector: 'ix-form-header-actions',
  templateUrl: './form-header-actions.component.html',
  styleUrls: ['./form-header-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MatButtonModule],
})
export class FormHeaderActionsComponent {
  title = input<string>('');

  constructor(private bottomSheet: BottomSheetService) {}

  close(): void {
    this.bottomSheet.close();
  }
}
