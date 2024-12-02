import {
  AfterViewInit, ComponentRef, Directive, input, OnChanges, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxTableEmptyRowComponent } from 'app/modules/ix-table/components/ix-empty-row/ix-empty-row.component';

@UntilDestroy()
@Directive({
  selector: '[ix-table-empty]',
  standalone: true,
})
export class IxTableEmptyDirective implements AfterViewInit, OnChanges {
  readonly showEmptyRow = input<boolean>(false, { alias: 'ix-table-empty' });
  readonly emptyConfig = input<EmptyConfig>();

  componentRef: ComponentRef<IxTableEmptyRowComponent> = null;
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
    if (this.showEmptyRow() && this.emptyConfig()?.type !== EmptyType.Loading) {
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
      this.componentRef = this.viewContainerRef.createComponent(IxTableEmptyRowComponent);
    }
    if (this.emptyConfig()) {
      this.componentRef?.setInput('conf', this.emptyConfig());
    }
    this.componentRef.changeDetectorRef.detectChanges();
  }
}
