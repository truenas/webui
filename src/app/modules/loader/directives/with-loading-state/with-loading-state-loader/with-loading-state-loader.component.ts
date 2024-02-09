import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ix-with-loading-state-loader',
  templateUrl: './with-loading-state-loader.component.html',
  styleUrls: ['./with-loading-state-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WithLoadingStateLoaderComponent {}
