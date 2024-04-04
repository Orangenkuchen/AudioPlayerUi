import { TestBed } from '@angular/core/testing';

import { AudioPlayerServiceService } from './audio-player-service.service';

describe('AudioPlayerServiceService', () => {
  let service: AudioPlayerServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AudioPlayerServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
