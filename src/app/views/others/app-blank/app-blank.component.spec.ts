import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppBlankComponent } from './app-blank.component';

describe('AppBlankComponent', () => {
  let component: AppBlankComponent;
  let fixture: ComponentFixture<AppBlankComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppBlankComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppBlankComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
