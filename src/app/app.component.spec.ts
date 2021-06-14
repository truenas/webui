// app.component.spec.ts
import {
  createComponentFactory,
  Spectator,
} from '@ngneat/spectator/jest';
import { AppComponent } from './app.component';

// with Spectator:
describe('AppComponent', () => {
  const createComponent = createComponentFactory({
    component: AppComponent,
  });

  let spectator: Spectator<AppComponent>;

  beforeEach(() => spectator = createComponent());
  it('should create the app', () => {
    const app = spectator.component;
    expect(app).toBeTruthy();
  });
  // more 'it' blocks
});
