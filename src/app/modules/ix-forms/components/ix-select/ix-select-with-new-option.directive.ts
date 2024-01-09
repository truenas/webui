import { ComponentType } from '@angular/cdk/portal';
import {
  AfterViewInit, Directive, Input, OnInit, ViewChild, inject,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject,
  Observable, distinctUntilChanged, filter, map, switchMap, take, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent, IxSelectValue } from 'app/modules/ix-forms/components/ix-select/ix-select.component';
import { ChainedComponentResponse, IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';

export const addNewIxSelectValue = 'ADD_NEW';

@UntilDestroy()
@Directive()
export abstract class IxSelectWithNewOption implements OnInit, AfterViewInit {
  @Input() disabled: boolean;
  formComponentIsWide = false;

  @ViewChild(IxSelectComponent) private ixSelect: IxSelectComponent;

  private options = new BehaviorSubject<Option[]>([]);

  private chainedSlideIn = inject(IxChainedSlideInService);
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

  abstract getValueFromChainedResponse(
    result: ChainedComponentResponse,
  ): IxSelectValue;
  abstract getFormComponentType(): ComponentType<unknown>;
  abstract fetchOptions(): Observable<Option[]>;

  ngAfterViewInit(): void {
    if (!this.ixSelect) {
      return;
    }
    this.ixSelect.options = this.options.asObservable();
    this.ixSelect.ngOnChanges();
    this.ixSelect.controlDirective.control.valueChanges.pipe(
      distinctUntilChanged(),
      filter(Boolean),
      filter((newValue: number | string) => newValue === addNewIxSelectValue),
      switchMap(() => this.chainedSlideIn.pushComponent(this.getFormComponentType(), this.formComponentIsWide)),
      filter((response: ChainedComponentResponse) => !response.error),
      tap(
        (response) => this.ixSelect.controlDirective.control.setValue(
          this.getValueFromChainedResponse(response),
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
