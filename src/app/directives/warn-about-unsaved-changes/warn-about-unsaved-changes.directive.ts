import {
  Directive, Input, OnInit, HostListener,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';

@UntilDestroy()
@Directive({
  selector: '[warnAboutUnsavedChanges]',
  standalone: true,
})
export class WarnAboutUnsavedChangesDirective<T> implements OnInit {
  @Input() formGroup: FormGroup;

  private formSubmitted = false;

  constructor(
    private translate: TranslateService,
    private dialogService: DialogService,
    private slideInRef: IxSlideInRef<T>,
  ) {}

  ngOnInit(): void {
    this.overrideSlideInClose();
  }

  @HostListener('ngSubmit')
  onFormSubmit(): void {
    this.formSubmitted = true;

    if (this.formGroup.status === 'INVALID') {
      this.formSubmitted = false;
    }
  }

  closeWithConfirmation(response?: T): Observable<boolean> {
    if (this.formGroup.pristine || this.formSubmitted) {
      this.emitClose(response);
      return of(true);
    }

    return this.showConfirmDialog().pipe(
      switchMap((shouldClose) => {
        if (shouldClose) {
          this.emitClose(response);
        }
        return of(shouldClose);
      }),
    );
  }

  private overrideSlideInClose(): void {
    this.slideInRef.close = (response?: T) => this.closeWithConfirmation(response)
      .pipe(untilDestroyed(this))
      .subscribe();
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
    this.slideInRef.slideInClosed$?.next(response);
    this.slideInRef.slideInClosed$?.complete();
  }
}
