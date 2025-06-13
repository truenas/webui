import { of, Observable, firstValueFrom } from 'rxjs';
import { UnsavedFormGuard, CanComponentDeactivate } from './unsaved-form.guard';

describe('UnsavedFormGuard', () => {
  let guard: UnsavedFormGuard;

  beforeEach(() => {
    guard = new UnsavedFormGuard();
  });

  it('should return true if component has no canDeactivate method', () => {
    const fakeComponent = {} as CanComponentDeactivate;
    expect(guard.canDeactivate(fakeComponent)).toBe(true);
  });

  it('should return true if canDeactivate returns true', () => {
    const fakeComponent: CanComponentDeactivate = {
      canDeactivate: () => true,
    };
    expect(guard.canDeactivate(fakeComponent)).toBe(true);
  });

  it('should return true if canDeactivate returns observable of true', async () => {
    const fakeComponent: CanComponentDeactivate = {
      canDeactivate: () => of(true),
    };
    const result = await firstValueFrom(guard.canDeactivate(fakeComponent) as Observable<boolean>);
    expect(result).toBe(true);
  });

  it('should return false if canDeactivate returns observable of false', async () => {
    const fakeComponent: CanComponentDeactivate = {
      canDeactivate: () => of(false),
    };
    const result = await firstValueFrom(guard.canDeactivate(fakeComponent) as Observable<boolean>);
    expect(result).toBe(false);
  });
});
