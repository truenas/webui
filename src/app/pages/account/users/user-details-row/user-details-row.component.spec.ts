import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UserDetailsRowComponent } from './user-details-row.component';

describe('UserDetailsRowComponent', () => {
  let component: UserDetailsRowComponent;
  let fixture: ComponentFixture<UserDetailsRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserDetailsRowComponent],
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UserDetailsRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
