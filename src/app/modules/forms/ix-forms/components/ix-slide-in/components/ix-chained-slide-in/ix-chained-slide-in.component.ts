import {
  ChangeDetectionStrategy, ChangeDetectorRef,
  Component, ElementRef, input, OnDestroy, OnInit, ViewChild,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  ChainedComponentSerialized,
  IxChainedSlideInService,
} from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-chained-slide-in',
  templateUrl: './ix-chained-slide-in.component.html',
  styleUrls: ['./ix-chained-slide-in.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxChainedSlideInComponent implements OnInit, OnDestroy {
  readonly id = input<string>();

  @ViewChild('componentWrapper') container: HTMLElement;
  protected components: ChainedComponentSerialized[];
  private element: HTMLElement;

  constructor(
    private el: ElementRef,
    protected ixChainedSlideInService: IxChainedSlideInService,
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
