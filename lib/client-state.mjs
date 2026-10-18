export function createRefreshGate() {
  let generation = 0;
  return {
    begin: () => ++generation,
    isCurrent: (request) => request === generation,
  };
}
export function notifySafely(factory, title, body, onClick) {
  try {
    const notice = factory(title, {
      body,
      icon: './favicon.svg',
      tag: 'club-updates',
    });
    notice.onclick = onClick;
    return true;
  } catch {
    return false;
  }
}
export function buildLibrary(suggestions, claims, practiced = []) {
  return Array.from(
    new Map(
      [...practiced, ...suggestions, ...claims.slice().reverse()].map((p) => [
        p.url,
        p,
      ]),
    ).values(),
  );
}
export function emptyClubData(dates) {
  return {
    signedIn: false,
    profile: null,
    roster: [],
    claims: [],
    inbox: [],
    solved: [],
    practiced: [],
    dates,
  };
}
