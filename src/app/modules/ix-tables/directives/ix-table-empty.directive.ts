import {
  AfterViewInit, ComponentRef, Directive, Input, OnChanges, ViewContainerRef,
} from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxEmptyRowComponent } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component';

@UntilDestroy()
@Directive({
  selector: '[ix-table-empty]',
})
export class IxTableEmptyDirective implements AfterViewInit, OnChanges {
  @Input() emptyConfig: EmptyConfig;
  @Input() dataSource: MatTableDataSource<unknown>;
  componentRef: ComponentRef<IxEmptyRowComponent> = null;
  constructor(
    private viewContainerRef: ViewContainerRef,
  ) { }

  ngAfterViewInit(): void {
    this.toggleEmptyComponent();
  }

  ngOnChanges(): void {
    this.toggleEmptyComponent();
  }

  toggleEmptyComponent(): void {
    if (!this.dataSource.filteredData.length) {
      this.updateComponentConfig();
    } else {
      this.destroyRowComponent();
    }
  }

  destroyRowComponent(): void {
    this.componentRef?.destroy();
    this.componentRef = null;
  }

  updateComponentConfig(): void {
    if (!this.componentRef) {
      this.componentRef = this.viewContainerRef.createComponent(IxEmptyRowComponent);
    }
    if (this.emptyConfig) {
      this.componentRef?.setInput('conf', this.emptyConfig);
    }
    this.componentRef.changeDetectorRef.detectChanges();
  }
}
