import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, input, OnDestroy, OnInit,
  viewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { SlideIn2Component } from 'app/modules/slide-ins/components/slide-in2/slide-in2.component';
import {
  ChainedComponentSerialized,
  ChainedSlideInService,
} from 'app/services/chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-chained-slide-in',
  templateUrl: './chained-slide-in.component.html',
  styleUrls: ['./chained-slide-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [SlideIn2Component, AsyncPipe],
})
export class ChainedSlideInComponent implements OnInit, OnDestroy {
  readonly id = input<string>();

  readonly container = viewChild<HTMLElement>('componentWrapper');
  protected components: ChainedComponentSerialized[];
  private element: HTMLElement;

  constructor(
    private el: ElementRef,
    protected ixChainedSlideInService: ChainedSlideInService,
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

    this.ixChainedSlideInService.components$.pipe(untilDestroyed(this)).subscribe((components) => {
      this.components = components;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.element.remove();
  }
}
