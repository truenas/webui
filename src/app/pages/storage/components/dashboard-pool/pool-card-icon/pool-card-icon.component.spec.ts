import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { PoolCardIconComponent } from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';

describe('PoolCardIconComponent', () => {
  let spectator: Spectator<PoolCardIconComponent>;
  const createComponent = createComponentFactory({
    component: PoolCardIconComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(IxIconComponent),
    ],
  });

  it('renders icon when type is safe', () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Safe, tooltip: '' },
    });
    expect(spectator.query(IxIconComponent)!.name).toBe('check_circle');
  });

  it('renders icon when type is warn', () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Warn, tooltip: '' },
    });
    expect(spectator.query(IxIconComponent)!.name).toBe('error');
  });

  it('renders icon when type is faulted', () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Faulted, tooltip: '' },
    });
    expect(spectator.query(IxIconComponent)!.name).toBe('help');
  });

  it('renders icon when type is error', () => {
    spectator = createComponent({
      props: { type: PoolCardIconType.Error, tooltip: '' },
    });
    expect(spectator.query(IxIconComponent)!.name).toBe('cancel');
  });
});
