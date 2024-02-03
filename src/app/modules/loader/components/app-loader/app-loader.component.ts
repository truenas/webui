import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  templateUrl: './app-loader.component.html',
  styleUrls: ['./app-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppLoaderComponent {
  @Input() title: string;
}
