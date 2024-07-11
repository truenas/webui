import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  HostListener, Input,
  Output,
  ViewChild,
  OnInit,
  OnChanges,
  HostBinding,
} from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

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
    IxIconModule,
    TranslateModule,
    MatInputModule,
    TestIdModule,
  ],
})
export class SearchInput1Component implements OnInit, OnChanges {
  @HostBinding('class.disabled')
  @Input() disabled = false;
  @Input() value = '';
  @Input() maxLength = 524288;
  @Output() search = new EventEmitter<string>();

  @ViewChild('ixSearchInput') input: ElementRef<HTMLInputElement>;

  @HostListener('click')
  onHostClicked(): void {
    this.input.nativeElement.focus();
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
    this.searchValue = this.value;
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
