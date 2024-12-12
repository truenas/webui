import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'ix-with-loading-state-loader',
  templateUrl: './with-loading-state-loader.component.html',
  styleUrls: ['./with-loading-state-loader.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
})
export class WithLoadingStateLoaderComponent {}
