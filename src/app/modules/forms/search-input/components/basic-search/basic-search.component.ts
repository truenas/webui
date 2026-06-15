import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, input, model, output, viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnIconComponent, TnInputComponent, TnTestIdDirective, TnTooltipDirective,
} from '@truenas/ui-components';

@Component({
  selector: 'ix-basic-search',
  templateUrl: './basic-search.component.html',
  styleUrls: ['./basic-search.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconComponent,
    TnInputComponent,
    TnTooltipDirective,
    TnTestIdDirective,
    FormsModule,
    TranslateModule,
  ],
})
export class BasicSearchComponent implements AfterViewInit {
  readonly query = model<string>();
  readonly allowAdvanced = input(false);
  readonly placeholder = input<string>('');

  readonly switchToAdvanced = output();
  readonly queryChange = output<string>();
  readonly runSearch = output();

  private readonly searchInput = viewChild(TnInputComponent);

  ngAfterViewInit(): void {
    this.focusInput();
  }

  protected resetInput(): void {
    this.query.set('');
    this.queryChange.emit('');
    this.runSearch.emit();
    this.focusInput();
  }

  private focusInput(): void {
    this.searchInput()?.inputEl()?.nativeElement?.focus();
  }
}
