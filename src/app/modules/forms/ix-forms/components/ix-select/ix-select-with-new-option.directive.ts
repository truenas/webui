import {
  AfterViewInit, DestroyRef, Directive, OnInit, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, merge, Observable,
  distinctUntilChanged, filter, pairwise, startWith, switchMap, take, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent, IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ComponentInSlideIn } from 'app/modules/slide-ins/slide-in.interface';

export const addNewIxSelectValue = 'ADD_NEW';

@Directive()
export abstract class IxSelectWithNewOption<R = unknown> implements OnInit, AfterViewInit {
  formComponentIsWide = false;

  readonly ixSelect = viewChild.required(IxSelectComponent);

  private options = new BehaviorSubject<Option[]>([]);

  private slideIn = inject(SlideIn);
  private translateService = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.fetchOptions().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((options) => {
      this.options.next(this.prependAddNew(options));
    });
  }

  abstract getValueFromSlideInResponse(result: R): IxSelectValue;
  abstract getFormComponentType(): ComponentInSlideIn<unknown, R>;
  abstract fetchOptions(): Observable<Option[]>;
  getFormInputData(): Record<string, unknown> | undefined {
    return undefined;
  }

  ngAfterViewInit(): void {
    const ixSelect = this.ixSelect();
    if (!ixSelect) {
      return;
    }
    this.ixSelect().options.set(this.options.asObservable());
    this.ixSelect().refreshOptions();
    this.ixSelect().controlDirective?.control?.valueChanges?.pipe(
      distinctUntilChanged(),
      startWith(this.ixSelect().controlDirective?.control?.value as IxSelectValue),
      pairwise(),
      filter(([, current]) => !!current && current === addNewIxSelectValue),
      switchMap(([previous]) => {
        const result$ = this.slideIn.open(this.getFormComponentType(), {
          wide: this.formComponentIsWide,
          data: this.getFormInputData(),
        });
        return merge(
          result$.success$.pipe(
            switchMap((response) => {
              this.ixSelect().controlDirective.control?.setValue(
                this.getValueFromSlideInResponse(response),
              );
              return this.fetchOptions().pipe(
                tap((options) => this.options.next(this.prependAddNew(options))),
              );
            }),
          ),
          result$.cancel$.pipe(
            tap(() => {
              this.ixSelect().controlDirective.control?.setValue(previous ?? null);
            }),
          ),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  private prependAddNew(options: Option[]): Option[] {
    return [
      { label: this.translateService.instant('Add New'), value: addNewIxSelectValue } as Option,
      ...options,
    ];
  }
}
