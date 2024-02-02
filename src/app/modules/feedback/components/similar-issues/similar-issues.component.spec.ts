import { discardPeriodicTasks, fakeAsync, tick } from '@angular/core/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { SimilarIssuesComponent } from 'app/modules/feedback/components/similar-issues/similar-issues.component';
import { SimilarIssue } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';

describe('SimilarIssuesComponent', () => {
  let spectator: Spectator<SimilarIssuesComponent>;
  let feedbackService: FeedbackService;
  const createComponent = createComponentFactory({
    component: SimilarIssuesComponent,
    providers: [
      mockProvider(FeedbackService, {
        getSimilarIssues: jest.fn(() => of([
          {
            url: 'https://ixsystems.atlassian.net/browse/NAS-125093',
            id: 87844,
            key: 'NAS-125093',
            img: '/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium',
            summaryText: 'Similar tickets screen',
          },
          {
            url: 'https://ixsystems.atlassian.net/browse/NAS-122608',
            id: 79257,
            key: 'NAS-122608',
            img: '/rest/api/2/universal_avatar/view/type/issuetype/avatar/10303?size=medium',
            summaryText: 'Figure out a max limit for similar apps on the UI',
          },
        ])),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    feedbackService = spectator.inject(FeedbackService);
  });

  it('loads similar tickets when title is changed', fakeAsync(() => {
    spectator.setInput('query', 'Similar');
    tick(300);

    expect(feedbackService.getSimilarIssues).toHaveBeenCalledWith('Similar');
  }));

  it('does not check for similar tickets when title is too short', fakeAsync(() => {
    spectator.setInput('query', 't');
    tick(300);

    expect(feedbackService.getSimilarIssues).not.toHaveBeenCalled();
  }));

  it('debounces further changes to title', fakeAsync(() => {
    spectator.setInput('query', 'Similar');
    tick(300);
    spectator.setInput('query', 'Similar another');

    expect(feedbackService.getSimilarIssues).toHaveBeenCalledTimes(1);
    discardPeriodicTasks();
  }));

  it('shows similar tickets', fakeAsync(() => {
    spectator.setInput('query', 'Similar');
    tick(300);
    spectator.detectChanges();

    const similarIssues = spectator.queryAll('.similar-issue');
    expect(similarIssues).toHaveLength(2);
    expect(spectator.query('.similar-issues-title')).toHaveText('The following issues were already reported.');
    expect(spectator.query('.similar-issues-subtitle')).toHaveText('Do any of them look similar?');

    expect(similarIssues[0]).toHaveAttribute('href', 'https://ixsystems.atlassian.net/browse/NAS-125093');
    expect(similarIssues[0]).toHaveDescendantWithText({
      selector: '.issue-summary',
      text: 'Similar tickets screen',
    });
    expect(similarIssues[0].querySelector('.issue-type-icon')).toHaveStyle({
      'background-image': 'url(https://ixsystems.atlassian.net/rest/api/2/universal_avatar/view/type/issuetype/avatar/10311?size=medium)',
    });
  }));

  it('should reset similar issues when query is empty', fakeAsync(() => {
    spectator.setInput('query', 'Similar');
    tick(300);
    spectator.detectChanges();
    expect(feedbackService.getSimilarIssues).toHaveBeenCalledWith('Similar');
    expect(spectator.queryAll('.similar-issue')).toHaveLength(2);

    spectator.setInput('query', '');
    tick(300);
    spectator.fixture.whenStable().then(() => {
      expect(spectator.queryAll('.similar-issue')).toHaveLength(0);
    });
  }));

  it('should fetch and combine similar issues when query has more than 3 characters', fakeAsync(() => {
    jest.spyOn(feedbackService, 'getSimilarIssues').mockReturnValue(of([
      {
        url: 'https://ixsystems.atlassian.net/browse/NAS-124850',
        id: 79258,
        key: 'NAS-124850',
        img: '/rest/api/2/universal_avatar/view/type/issuetype/avatar/10303?size=medium',
        summaryText: 'GMail OAuth setup not working',
      },
      {
        url: 'https://ixsystems.atlassian.net/browse/NAS-122424',
        id: 79259,
        key: 'NAS-122424',
        img: '/rest/api/2/universal_avatar/view/type/issuetype/avatar/10303?size=medium',
        summaryText: 'Gmail Oauth for alerts keeps expiring',
      },
    ] as SimilarIssue[]));

    spectator.setInput('query', 'gmail');
    tick(300);
    expect(feedbackService.getSimilarIssues).toHaveBeenCalledWith('gmail');
    spectator.fixture.whenStable().then(() => {
      expect(spectator.queryAll('.similar-issue')).toHaveLength(2);
    });

    spectator.setInput('query', 'gmail not working');
    tick(300);
    expect(feedbackService.getSimilarIssues).toHaveBeenCalledWith('gmail not working');
    spectator.fixture.whenStable().then(() => {
      expect(spectator.queryAll('.similar-issue')).toHaveLength(2);
    });

    spectator.setInput('query', '');
    tick(300);
    spectator.fixture.whenStable().then(() => {
      expect(spectator.queryAll('.similar-issue')).toHaveLength(0);
    });
  }));
});
