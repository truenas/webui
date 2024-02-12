import {
  AfterViewInit, ComponentRef, Directive, Input, OnChanges, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxTable2EmptyRowComponent } from 'app/modules/ix-table2/components/ix-empty-row/ix-empty-row.component';

@UntilDestroy()
@Directive({
  selector: '[ix-table2-empty]',
})
export class IxTable2EmptyDirective implements AfterViewInit, OnChanges {
  @Input('ix-table2-empty') showEmptyRow: boolean;
  @Input() emptyConfig: EmptyConfig;
  componentRef: ComponentRef<IxTable2EmptyRowComponent> = null;
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
    if (this.showEmptyRow && this.emptyConfig?.type !== EmptyType.Loading) {
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
      this.componentRef = this.viewContainerRef.createComponent(IxTable2EmptyRowComponent);
    }
    if (this.emptyConfig) {
      this.componentRef?.setInput('conf', this.emptyConfig);
    }
    this.componentRef.changeDetectorRef.detectChanges();
  }
}
