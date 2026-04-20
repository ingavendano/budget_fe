import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OnboardingBanner } from './onboarding-banner';

describe('OnboardingBanner', () => {
  let component: OnboardingBanner;
  let fixture: ComponentFixture<OnboardingBanner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OnboardingBanner],
    }).compileComponents();

    fixture = TestBed.createComponent(OnboardingBanner);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});


