import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, input, OnDestroy, OnInit,
  viewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SlideInComponent } from 'app/modules/slide-ins/components/slide-in/slide-in.component';
import {
  SlideIn,
} from 'app/modules/slide-ins/slide-in';
import { ComponentSerialized } from 'app/modules/slide-ins/slide-in.interface';

@UntilDestroy()
@Component({
  selector: 'ix-slide-in-controller',
  templateUrl: './slide-in-controller.component.html',
  styleUrls: ['./slide-in-controller.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SlideInComponent, AsyncPipe],
})
export class SlideInControllerComponent implements OnInit, OnDestroy {
  readonly id = input<string>();

  readonly container = viewChild<HTMLElement>('componentWrapper');
  protected components: ComponentSerialized[];
  private element: HTMLElement;

  constructor(
    private el: ElementRef,
    protected slideIn: SlideIn,
    private cdr: ChangeDetectorRef,
  ) {
    this.element = this.el.nativeElement as HTMLElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id()) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);

    this.slideIn.components$.pipe(untilDestroyed(this)).subscribe((components) => {
      this.components = components;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.element.remove();
  }
}
