import {
  AfterViewInit, DestroyRef, Directive, OnInit, Type, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, merge, Observable,
  distinctUntilChanged, filter, pairwise, startWith, switchMap, take, tap,
} from 'rxjs';
import { Option } from 'app/interfaces/option.interface';
import { IxSelectComponent, IxSelectValue } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';

export const addNewIxSelectValue = 'ADD_NEW';

@Directive()
export abstract class IxSelectWithNewOption<R = unknown> implements OnInit, AfterViewInit {
  formComponentIsWide = false;

  readonly ixSelect = viewChild.required(IxSelectComponent);

  private options = new BehaviorSubject<Option[]>([]);

  private formPanel = inject(FormSidePanelService);
  protected translateService = inject(TranslateService);
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
  abstract getFormComponentType(): Type<unknown>;
  /** Title shown on the `<tn-side-panel>` opened for the "Add New" option. */
  abstract getFormTitle(): string;
  abstract fetchOptions(): Observable<Option[]>;
  /** Inputs applied to the hosted form (e.g. provider filters). Keyed by the form's input name. */
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
        const result$ = this.formPanel.open<R>(
          this.getFormComponentType() as Type<SidePanelForm<R>>,
          {
            title: this.getFormTitle(),
            wide: this.formComponentIsWide,
            inputs: this.getFormInputData(),
          },
        );
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
