import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SigninFormComponent } from 'app/views/sessions/signin/signin-form/signin-form.component';

describe('SigninFormComponent', () => {
  let component: SigninFormComponent;
  let fixture: ComponentFixture<SigninFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SigninFormComponent],
    })
      .compileComponents();

    fixture = TestBed.createComponent(SigninFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
