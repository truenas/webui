import { CdkRowDef } from '@angular/cdk/table';
import { Directive, Input } from '@angular/core';
import { MatRowDef, MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';

@Directive({
  selector: '[matRowDef]',
  providers: [{ provide: CdkRowDef, useExisting: IxRowDefDirective }],
})
export class IxRowDefDirective<T> extends MatRowDef<T> {
  // leveraging syntactic-sugar syntax when we use *matRowDef
  @Input() matRowDefDataSource: T[] | Observable<T[]> | MatTableDataSource<T>;

  // ngTemplateContextGuard flag to help with the Language Service
  static ngTemplateContextGuard<T>(
    dir: IxRowDefDirective<T>,
    ctx: unknown,
  ): ctx is { $implicit: T; index: number } {
    return true;
  }
}
