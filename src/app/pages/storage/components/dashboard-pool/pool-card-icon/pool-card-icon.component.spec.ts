import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';

describe('PoolCardIconComponent', () => {
  let spectator: Spectator<PoolCardIconComponent>;
  const createComponent = createComponentFactory({
    component: PoolCardIconComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders icon when type is safe', () => {
    spectator.setInput('type', PoolCardIconType.Safe);
    expect(spectator.query('mat-icon')).toHaveText('check_circle');
  });

  it('renders icon when type is warn', () => {
    spectator.setInput('type', PoolCardIconType.Warn);
    expect(spectator.query('mat-icon')).toHaveText('error');
  });

  it('renders icon when type is faulted', () => {
    spectator.setInput('type', PoolCardIconType.Faulted);
    expect(spectator.query('mat-icon')).toHaveText('help');
  });

  it('renders icon when type is error', () => {
    spectator.setInput('type', PoolCardIconType.Error);
    expect(spectator.query('mat-icon')).toHaveText('cancel');
  });
});
