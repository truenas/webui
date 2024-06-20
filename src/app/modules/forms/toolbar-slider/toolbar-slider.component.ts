import {
  ChangeDetectionStrategy, Component, input, model,
} from '@angular/core';
import { MatSlider, MatSliderThumb } from '@angular/material/slider';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@Component({
  selector: 'ix-toolbar-slider',
  styleUrls: ['./toolbar-slider.component.scss'],
  templateUrl: './toolbar-slider.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatSlider,
    MatSliderThumb,
    TestIdModule,
  ],
})
export class ToolbarSliderComponent {
  readonly min = input<number>();
  readonly max = input<number>();
  readonly step = input<number>(1);
  readonly label = input<number>(1);
  readonly name = input<number>(1);

  readonly value = model<number>();

  onChange(updatedValue: string): void {
    this.value.set(Number(updatedValue));
  }
}
