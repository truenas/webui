import { Component, ComponentRef, ElementRef, Input, OnInit, TrackByFunction, Type } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Subject } from 'rxjs';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

export class IxSlideInRef<T, D = unknown> {
  readonly slideInClosed$ = new Subject<D>();
  componentRef: ComponentRef<T>;
  id: string;

  get componentInstance(): T {
    return this.componentRef.instance;
  }

  close(response?: D): void {
    this.slideInClosed$.next(response);
    this.slideInClosed$.complete();
  }
}

@UntilDestroy()
@Component({
  selector: 'ix-chained-slide-in',
  templateUrl: './ix-chained-slide-in.component.html',
  styleUrls: ['./ix-chained-slide-in.component.scss'],
})
export class IxChainedSlideInComponent implements OnInit {
  @Input() id: string;
  protected components: { component: Type<unknown>; id: string }[] = [];
  private element: HTMLElement;

  readonly trackByComponentId: TrackByFunction<{
    component: Type<unknown>; id: string;
  }> = (_, componentRef) => componentRef.id;

  constructor(
    private el: ElementRef,
    private ixChainedSlideInService: IxChainedSlideInService,
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