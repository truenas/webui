import {
  AfterViewInit, Directive, OnDestroy, TemplateRef,
} from '@angular/core';
import { LayoutService } from 'app/services/layout.service';

/**
 * Add to <ng-template> in your component to add a page header.
 */
@Directive({
  selector: '[ixPageHeader]',
})
export class PageHeaderDirective implements AfterViewInit, OnDestroy {
  constructor(
    private layoutService: LayoutService,
    private templateRef: TemplateRef<unknown>,
  ) {}

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.templateRef);
  }

  ngOnDestroy(): void {
    this.layoutService.pageHeaderUpdater$.next(undefined);
  }
}
