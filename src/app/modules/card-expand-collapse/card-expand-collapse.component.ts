import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  input,
  OnChanges,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-card-expand-collapse',
  templateUrl: './card-expand-collapse.component.html',
  styleUrls: ['./card-expand-collapse.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TranslateModule,
    MatButton,
    TestDirective,
  ],
})
export class CardExpandCollapseComponent implements OnChanges {
  section = viewChild<ElementRef<HTMLElement>>('section');
  maxHeight = input<number>(250);
  height = signal<number>(this.maxHeight());
  isCollapsed = signal<boolean>(true);
  showButton = computed<boolean>(() => {
    return this.height() >= this.maxHeight();
  });

  constructor() {
    effect(() => {
      if (this.isCollapsed()) {
        this.setHeight();
        this.section().nativeElement.style.maxHeight = `${this.maxHeight()}px`;
      }
    });
  }

  ngOnChanges(): void {
    this.isCollapsed.set(true);
    this.section().nativeElement.style.maxHeight = `${this.maxHeight()}px`;
  }

  changeCollapsed(): void {
    this.setHeight();
    this.isCollapsed.set(!this.isCollapsed());
    this.section().nativeElement.style.maxHeight = this.isCollapsed() ? `${this.maxHeight()}px` : 'none';
  }

  setHeight(): void {
    this.height.set(this.section().nativeElement.offsetHeight || this.maxHeight());
  }

  onResize(): void {
    this.setHeight();
  }
}
