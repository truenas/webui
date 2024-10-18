import {
  Component, ChangeDetectionStrategy, input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { BottomSheetService } from 'app/services/bottom-sheet.service';

@Component({
  selector: 'ix-form-header-actions',
  templateUrl: './form-header-actions.component.html',
  styleUrls: ['./form-header-actions.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule, MatButtonModule, FakeProgressBarComponent],
})
export class FormHeaderActionsComponent {
  title = input<string>('');
  isLoading = input(false);

  constructor(private bottomSheet: BottomSheetService) {}

  close(): void {
    this.bottomSheet.close();
  }
}
