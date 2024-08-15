import {
  Component, Input, ChangeDetectionStrategy,
} from '@angular/core';

@Component({
  selector: 'ix-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLoaderComponent {
  @Input() title: string;
}
