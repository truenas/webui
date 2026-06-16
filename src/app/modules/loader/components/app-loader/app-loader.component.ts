import {
  Component, ChangeDetectionStrategy, signal,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnSpinnerComponent } from '@truenas/ui-components';

@Component({
  selector: 'ix-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnSpinnerComponent,
    TranslateModule,
  ],
})
export class AppLoaderComponent {
  protected title = signal<string>('');

  setTitle(title: string): void {
    this.title.set(title);
  }
}
