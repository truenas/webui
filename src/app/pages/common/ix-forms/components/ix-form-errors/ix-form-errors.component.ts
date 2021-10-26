import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Subscription } from 'rxjs';

/**
 * TODO: This is a stupid copy of form-errors from entity module.
 * TODO: Refactor.
 */
@Component({
  selector: 'ix-form-errors',
  styleUrls: ['./ix-form-errors.component.scss'],
  templateUrl: './ix-form-errors.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxFormErrorsComponent implements OnChanges, OnDestroy {
  @Input() control: AbstractControl;
  @Input() label: string;

  errors: ValidationErrors;
  private statusChangeSubscription: Subscription;

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('control' in changes && this.control) {
      // This manually works around: https://github.com/angular/angular/issues/10816
      this.statusChangeSubscription?.unsubscribe();
      // eslint-disable-next-line rxjs-angular/prefer-takeuntil
      this.statusChangeSubscription = this.control.statusChanges.subscribe(() => {
        if (this.errors === this.control.errors) {
          return;
        }

        this.errors = this.control.errors;
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy(): void {
    this.statusChangeSubscription?.unsubscribe();
  }
}
