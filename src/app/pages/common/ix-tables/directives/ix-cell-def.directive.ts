/* eslint-disable @angular-eslint/no-host-metadata-property */

import { CdkCellDef } from '@angular/cdk/table';
import { Directive, Input } from '@angular/core';
import { MatCellDef, MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';

@Directive({
  selector: '[matCellDef]',
  providers: [{ provide: CdkCellDef, useExisting: IxCellDefDirective }],
  host: {
    class: 'mat-cell',
    role: 'gridcell',
  },
})
export class IxCellDefDirective<T> extends MatCellDef {
  // @HostBinding('class') classes = 'mat-cell';
  // leveraging syntactic-sugar syntax when we use *matCellDef
  @Input() matCellDefDataSource: T[] | Observable<T[]> | MatTableDataSource<T>;

  // ngTemplateContextGuard flag to help with the Language Service
  static ngTemplateContextGuard<T>(
    dir: IxCellDefDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
