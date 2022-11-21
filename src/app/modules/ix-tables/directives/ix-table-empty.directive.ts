import {
  AfterViewInit, Directive, Input, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxEmptyRowComponent } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component';

@UntilDestroy()
@Directive({
  selector: '[ix-table-empty]',
})
export class IxTableEmptyDirective implements AfterViewInit {
  @Input() emptyConfig: EmptyConfig;

  constructor(
    private viewContainerRef: ViewContainerRef,
  ) { }

  ngAfterViewInit(): void {
    const componentRef = this.viewContainerRef.createComponent(IxEmptyRowComponent);
    if (this.emptyConfig) {
      componentRef.setInput('conf', this.emptyConfig);
    }
  }
}
