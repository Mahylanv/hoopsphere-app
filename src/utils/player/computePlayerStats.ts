// src/utils/computePlayerStats.ts

export type PlayerMatch = {
    points: number;
    threes: number;
    two_int: number;
    two_ext: number;
    ft_made: number;
    fouls_committed: number;
  };
  
  export type PlayerAverages = {
    pts: number;
    threes: number;
    twoInt: number;
    twoExt: number;
    lf: number;
    fouls: number;
    gamesPlayed: number;
  };
  
  export function computePlayerStats(matches: PlayerMatch[]): PlayerAverages {
    if (matches.length === 0) {
      return {
        pts: 0,
        threes: 0,
        twoInt: 0,
        twoExt: 0,
        lf: 0,
        fouls: 0,
        gamesPlayed: 0,
      };
    }
  
    const total = matches.reduce(
      (acc, m) => {
        acc.points += m.points || 0;
        acc.threes += m.threes || 0;
        acc.twoInt += m.two_int || 0;
        acc.twoExt += m.two_ext || 0;
        acc.lf += m.ft_made || 0;
        acc.fouls += m.fouls_committed || 0;
        return acc;
      },
      {
        points: 0,
        threes: 0,
        twoInt: 0,
        twoExt: 0,
        lf: 0,
        fouls: 0,
      }
    );
  
    const n = matches.length;
  
    return {
      pts: +(total.points / n).toFixed(1),
      threes: +(total.threes / n).toFixed(1),
      twoInt: +(total.twoInt / n).toFixed(1),
      twoExt: +(total.twoExt / n).toFixed(1),
      lf: +(total.lf / n).toFixed(1),
      fouls: +(total.fouls / n).toFixed(1),
      gamesPlayed: n,
    };
  }
  