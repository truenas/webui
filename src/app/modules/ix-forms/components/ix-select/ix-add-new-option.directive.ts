import {
  Directive, EventEmitter, Input, OnInit, Output, Type, inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Observable, Subject, map, take,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent } from 'app/modules/ix-forms/components/ix-select/ix-select.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

export const addNewValue = 'ADD_NEW';

@UntilDestroy()
@Directive({
  selector: '[ixAddNewOption]',
})
export class AddNewOptionDirective implements OnInit {
  @Input() ixAddNewOption: Type<unknown>;
  @Output() newOptionAdded = new EventEmitter<unknown>();

  private chainedSlideIn = inject(IxChainedSlideInService);
  private translateService = inject(TranslateService);

  private alteredOptions$: Observable<Option[]>;

  @Input()
  set options(options$: Observable<Option[]>) {
    this.alteredOptions$ = options$.pipe(
      map((options) => {
        return [
          { label: this.translateService.instant('Add New'), value: addNewValue } as Option,
          ...options,
        ];
      }),
    );
    this.ixSelect.options = this.alteredOptions$;
  }

  constructor(private ixSelect: IxSelectComponent) { }

  ngOnInit(): void {
    this.ixSelect.controlDirective.control.valueChanges.pipe(untilDestroyed(this)).subscribe({
      next: (value) => {
        if (value === addNewValue) {
          const close$ = new Subject();
          this.chainedSlideIn.pushComponent({ component: this.ixAddNewOption, close$ });
          close$.pipe(take(1), untilDestroyed(this)).subscribe({
            next: (response) => {
              this.newOptionAdded.emit(response);
            },
          });
        }
      },
    });
  }
}
