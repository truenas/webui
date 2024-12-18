import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  OnInit,
  OnChanges,
  HostBinding, output,
  input, viewChild, Signal,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

/**
 * @deprecated Try ix-basic-search instead.
 */
@UntilDestroy()
@Component({
  selector: 'ix-search-input1',
  templateUrl: './search-input1.component.html',
  styleUrls: ['./search-input1.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxIconComponent,
    TranslateModule,
    MatInputModule,
    TestDirective,
  ],
})
export class SearchInput1Component implements OnInit, OnChanges {
  readonly disabled = input(false);

  readonly value = input('');
  readonly maxLength = input(524288);

  readonly search = output<string>();

  private input: Signal<ElementRef<HTMLInputElement>> = viewChild('ixSearchInput', { read: ElementRef });

  @HostBinding('class.disabled')
  get disabledClass(): boolean {
    return this.disabled();
  }

  @HostListener('click')
  onHostClicked(): void {
    this.input().nativeElement.focus();
  }

  searchValue = '';
  searchValueEmitHandler = new Subject<string>();

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.disabled?.previousValue !== changes.disabled?.currentValue && !!this.searchValue) {
      this.updateSearchValue(this.searchValue);
    }

    if (changes.value?.previousValue !== changes.value?.currentValue) {
      this.searchValue = changes.value.currentValue;
    }
  }

  ngOnInit(): void {
    this.searchValue = this.value();
    this.handleSearchValueChanges();
  }

  onResetInput(): void {
    this.updateSearchValue('');
  }

  onInput(value: string): void {
    this.updateSearchValue(value);
  }

  private handleSearchValueChanges(): void {
    this.searchValueEmitHandler.pipe(
      debounceTime(250),
      distinctUntilChanged(),
      untilDestroyed(this),
    ).subscribe((value: string) => {
      this.search.emit(value);
    });
  }

  private updateSearchValue(value: string): void {
    this.searchValue = value;
    this.searchValueEmitHandler.next(value);
  }
}
