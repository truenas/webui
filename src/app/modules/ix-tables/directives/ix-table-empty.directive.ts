import {
  AfterViewInit, ChangeDetectorRef, Directive, Input, ViewContainerRef,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { IxEmptyRowComponent } from 'app/modules/ix-tables/components/ix-empty-row/ix-empty-row.component';

@UntilDestroy()
@Directive({
  selector: '[ix-table-empty]',
})
export class IxTableEmptyDirective implements AfterViewInit {
  @Input() displayedColumns: string[];
  @Input() emptyConfig: EmptyConfig = {
    title: this.translate.instant('Rehan'),
    message: this.translate.instant('Rehan 2'),
    large: false,
    type: EmptyType.NoPageData,
  };

  constructor(
    private translate: TranslateService,
    private viewContainerRef: ViewContainerRef,
    private cdr: ChangeDetectorRef,
  ) { }

  ngAfterViewInit(): void {
    const componentRef = this.viewContainerRef.createComponent(IxEmptyRowComponent);
    componentRef.instance.displayedColumns = this.displayedColumns;
    componentRef.instance.emptyConfig = this.emptyConfig;
    this.cdr.markForCheck();
  }
}
