import {
  Component, ChangeDetectionStrategy, signal,
} from '@angular/core';
import { MatDialogContent } from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'ix-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    MatProgressSpinner,
    TranslateModule,
  ],
})
export class AppLoaderComponent {
  protected title = signal<string>('');

  setTitle(title: string): void {
    this.title.set(title);
  }
}
