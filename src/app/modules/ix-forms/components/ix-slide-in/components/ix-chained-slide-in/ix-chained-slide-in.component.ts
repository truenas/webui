import { Component, ElementRef, Input, OnInit, TrackByFunction, Type, ViewChild } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { ChainedComponentSeralized as ChainedComponentInfoSeralized, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-chained-slide-in',
  templateUrl: './ix-chained-slide-in.component.html',
  styleUrls: ['./ix-chained-slide-in.component.scss'],
})
export class IxChainedSlideInComponent implements OnInit {
  @Input() id: string;
  @ViewChild('componentWrapper') container: HTMLElement;
  protected components: ChainedComponentInfoSeralized[];
  private element: HTMLElement;

  readonly trackByComponentId: TrackByFunction<{
    component: Type<unknown>; id: string; close$: Subject<unknown>;
  }> = (_, componentRef) => componentRef.id;

  constructor(
    private el: ElementRef,
    protected ixChainedSlideInService: IxChainedSlideInService,
  ) {
    this.element = this.el.nativeElement as HTMLElement;
  }

  ngOnInit(): void {
    // ensure id attribute exists
    if (!this.id) {
      return;
    }

    // move element to bottom of page (just before </body>) so it can be displayed above everything else
    document.body.appendChild(this.element);

    this.ixChainedSlideInService.components$.pipe(untilDestroyed(this)).subscribe((components) => {
      this.components = components;
    });
  }
}