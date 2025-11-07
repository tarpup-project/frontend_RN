 export interface UserLeaderboardInterface {
    totalActivities: number;
    totalPoints: number;
    pointMonthDiff: number;
    position: {
      rank: number;
      totalUsers: number;
    };
    createdPrompts: {
      count: number;
      weight: number;
      total: number;
    };
    successfulMatches: {
      count: number;
      weight: number;
      total: number;
    };
    referrals: {
      count: number;
      weight: number;
      total: number;
    };
    joinedGroups: {
      count: number;
      weight: number;
      total: number;
    };
  }