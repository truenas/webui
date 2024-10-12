import {
  Directive, Input, OnInit,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';

@UntilDestroy()
@Directive({
  selector: '[formChangeGuardForSlideIn]',
  standalone: true,
})
export class FormChangeGuardForSlideInDirective<T> implements OnInit {
  @Input() formGroup: FormGroup;

  private formChanged = false;

  constructor(
    private translate: TranslateService,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<T>,
  ) {}

  ngOnInit(): void {
    this.trackFormChanges();
    this.overrideSlideInClose();
  }

  private trackFormChanges(): void {
    this.formGroup.valueChanges
      .pipe(
        filter(() => !this.formGroup.pristine),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.formChanged = true;
      });
  }

  private overrideSlideInClose(): void {
    this.slideInRef.close = (response?: T) => this.closeWithConfirmation(response)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  private closeWithConfirmation(response?: T): Observable<boolean> {
    if (!this.formChanged) {
      this.emitClose(response);
      return of(true);
    }

    return this.showConfirmDialog().pipe(
      switchMap((shouldClose) => {
        if (shouldClose) {
          this.formChanged = false;
          this.emitClose(response);
        }
        return of(shouldClose);
      }),
    );
  }

  private showConfirmDialog(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant('Unsaved Changes'),
      message: this.translate.instant('You have unsaved changes. Are you sure you want to close?'),
      cancelText: this.translate.instant('No'),
      buttonText: this.translate.instant('Yes'),
      buttonColor: 'red',
      hideCheckbox: true,
    });
  }

  private emitClose(response?: T): void {
    this.slideInRef.slideInClosed$.next(response);
    this.slideInRef.slideInClosed$.complete();
  }
}
