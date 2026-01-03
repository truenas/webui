import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
} from '@angular/core';

@Component({
  selector: 'ix-page-content',
  templateUrl: './page-content.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageContentComponent implements OnDestroy {
  ngOnDestroy(): void {
    throw new Error('Method not implemented.');
  }
}
