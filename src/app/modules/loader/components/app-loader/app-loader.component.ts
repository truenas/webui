import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  Component, Input, ChangeDetectionStrategy,
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
    CdkScrollable,
    MatDialogContent,
    MatProgressSpinner,
    TranslateModule,
  ],
})
export class AppLoaderComponent {
  @Input() title: string;
}
