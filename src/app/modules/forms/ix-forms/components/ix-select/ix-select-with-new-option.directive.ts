import {
  AfterViewInit, Directive, OnInit, viewChild, inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable, distinctUntilChanged, filter, map, switchMap, take, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent, IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ComponentInSlideIn, SlideInResponse } from 'app/modules/slide-ins/slide-in.interface';

export const addNewIxSelectValue = 'ADD_NEW';

@UntilDestroy()
@Directive()
export abstract class IxSelectWithNewOption implements OnInit, AfterViewInit {
  formComponentIsWide = false;

  readonly ixSelect = viewChild.required(IxSelectComponent);

  private options = new BehaviorSubject<Option[]>([]);

  private slideIn = inject(SlideIn);
  private translateService = inject(TranslateService);

  ngOnInit(): void {
    this.fetchOptions().pipe(
      map((options) => {
        return [
          { label: this.translateService.instant('Add New'), value: addNewIxSelectValue } as Option,
          ...options,
        ];
      }),
      take(1),
      untilDestroyed(this),
    ).subscribe({
      next: (options) => {
        this.options.next(options);
      },
    });
  }

  abstract getValueFromSlideInResponse(
    result: SlideInResponse,
  ): IxSelectValue;
  abstract getFormComponentType(): ComponentInSlideIn<unknown, unknown>;
  abstract fetchOptions(): Observable<Option[]>;
  getFormInputData(): Record<string, unknown> {
    return undefined;
  }

  ngAfterViewInit(): void {
    const ixSelect = this.ixSelect();
    if (!ixSelect) {
      return;
    }
    this.ixSelect().options.set(this.options.asObservable());
    this.ixSelect().ngOnChanges();
    this.ixSelect().controlDirective.control.valueChanges.pipe(
      distinctUntilChanged(),
      filter(Boolean),
      filter((newValue: number | string) => newValue === addNewIxSelectValue),
      switchMap(() => {
        return this.slideIn.open(
          this.getFormComponentType(),
          {
            wide: this.formComponentIsWide,
            data: this.getFormInputData(),
          },
        );
      }),
      filter((response: SlideInResponse) => !response.error),
      tap(
        (response) => this.ixSelect().controlDirective.control.setValue(
          this.getValueFromSlideInResponse(response),
        ),
      ),
      switchMap(() => this.fetchOptions()),
      tap((options) => this.options.next([
        { label: this.translateService.instant('Add New'), value: addNewIxSelectValue } as Option,
        ...options,
      ])),
      untilDestroyed(this),
    ).subscribe();
  }
}
