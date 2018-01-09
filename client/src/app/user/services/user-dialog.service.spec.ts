import { TestBed, inject } from '@angular/core/testing';

import { UserDialogService } from './user-dialog.service';

describe('UserDialogService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UserDialogService]
    });
  });

  it('should be created', inject([UserDialogService], (service: UserDialogService) => {
    expect(service).toBeTruthy();
  }));
});
