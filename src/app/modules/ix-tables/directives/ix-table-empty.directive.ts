import {
  AfterViewInit, ComponentRef, Directive, Input, OnChanges, SimpleChanges, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxEmptyRowComponent } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component';

@UntilDestroy()
@Directive({
  selector: '[ix-table-empty]',
})
export class IxTableEmptyDirective implements AfterViewInit, OnChanges {
  @Input() emptyConfig: EmptyConfig;
  componentRef: ComponentRef<IxEmptyRowComponent>;
  constructor(
    private viewContainerRef: ViewContainerRef,
  ) { }

  ngAfterViewInit(): void {
    this.componentRef = this.viewContainerRef.createComponent(IxEmptyRowComponent);
    if (this.emptyConfig) {
      this.componentRef.setInput('conf', this.emptyConfig);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.emptyConfig.currentValue) {
      this.componentRef?.setInput('conf', changes.emptyConfig.currentValue);
    }
  }
}
