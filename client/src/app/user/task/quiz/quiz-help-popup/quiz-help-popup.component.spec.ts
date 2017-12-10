import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { UserQuizHelpPopupComponent } from './quiz-help-popup.component';

describe('QuizHelpPopupComponent', () => {
  let component: UserQuizHelpPopupComponent;
  let fixture: ComponentFixture<UserQuizHelpPopupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ UserQuizHelpPopupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UserQuizHelpPopupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
