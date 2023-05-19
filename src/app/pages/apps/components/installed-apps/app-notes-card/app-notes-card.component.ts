import {
  ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild,
} from '@angular/core';
import { ChartRelease } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-app-notes-card',
  templateUrl: './app-notes-card.component.html',
  styleUrls: ['./app-notes-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppNotesCardComponent implements OnChanges {
  @Input() app: ChartRelease;
  @Input() maxHeight = 250;
  @ViewChild('notes', { static: true, read: ElementRef }) notes: ElementRef<HTMLElement>;

  isCollapsed = true;

  get showMoreLess(): boolean {
    return this.notes.nativeElement.offsetHeight >= this.maxHeight;
  }

  ngOnChanges(): void {
    this.isCollapsed = true;
    this.notes.nativeElement.style.maxHeight = `${this.maxHeight}px`;
  }

  changeCollapsed(): void {
    this.isCollapsed = !this.isCollapsed;
    this.notes.nativeElement.style.maxHeight = this.isCollapsed ? `${this.maxHeight}px` : 'none';
  }
}
