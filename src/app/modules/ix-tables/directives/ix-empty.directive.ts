import {
  AfterViewInit, Directive, Input, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxEmptyComponent } from 'app/modules/ix-tables/components/ix-empty/ix-empty.component';

@UntilDestroy()
@Directive({
  selector: '[ixEmpty]',
})
export class IxEmptyDirective implements AfterViewInit {
  @Input() displayedColumns: string[];
  @Input() emptyConfig: EmptyConfig;

  constructor(
    private viewContainerRef: ViewContainerRef,
  ) { }

  ngAfterViewInit(): void {
    const componentRef = this.viewContainerRef.createComponent<IxEmptyComponent>(IxEmptyComponent);
    componentRef.instance.conf = this.emptyConfig;
    componentRef.changeDetectorRef.markForCheck();
  }
}
