import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { NavigateAndInteractDirective } from './navigate-and-interact.directive';

@Component({
  template: '<div ixNavigateAndInteract [navigateRoute]="[\'/some-path\']" [navigateHash]="hash"></div>',
})
class TestHostComponent {
  hash = 'testHash';
}

describe('NavigateAndInteractDirective', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;
  const mockRouter = { navigate: jest.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [NavigateAndInteractDirective, TestHostComponent],
      providers: [
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement.query(By.directive(NavigateAndInteractDirective));
    fixture.detectChanges();
  });

  it('should create an instance', () => {
    expect(component).toBeTruthy();
  });

  it('should call router.navigate with correct parameters on click', () => {
    debugElement.triggerEventHandler('click', null);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/some-path'], { fragment: 'testHash' });
  });
});
