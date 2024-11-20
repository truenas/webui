import {
  Directive, Input, OnInit, HostListener,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';

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
    private slideInRef: SlideInRef<T>,
  ) {}

  ngOnInit(): void {
    this.overrideSlideInClose();
    this.trackFormChanges();
  }

  @HostListener('ngSubmit')
  onFormSubmit(): void {
    this.formSubmitted = true;
  }

  closeWithConfirmation(response?: T): Observable<boolean> {
    if (this.formGroup.pristine || (this.formSubmitted && !this.formGroup.invalid) || response) {
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

  private trackFormChanges(): void {
    this.formGroup.valueChanges.pipe(
      filter(() => !this.formGroup.pristine && this.formSubmitted),
      tap(() => this.formSubmitted = false),
      untilDestroyed(this),
    ).subscribe();
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
