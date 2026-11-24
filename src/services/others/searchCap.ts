/**
 * Mixes results from different services, keeping each service's own ranking: every service's best result, then every
 * service's second best, and so on (services in the order they first appear). Without this, the first page of a
 * multi-service search would hold only the first service's vendors.
 */
export function interleaveByService<T>(matches: T[], serviceOf: (match: T) => number): T[] {
  const queues = new Map<number, T[]>();
  for (const match of matches) {
    const service = serviceOf(match);
    queues.set(service, [...(queues.get(service) ?? []), match]);
  }
  const longest = Math.max(0, ...[...queues.values()].map((queue) => queue.length));
  return Array.from({ length: longest }, (_, rank) => [...queues.values()].flatMap((queue) => rank < queue.length ? [queue[rank]] : [])).flat();
}

/**
 * The vendors a free search unlocks: in each service, the best `perService` matches after the top pick (top picks
 * stay locked previews). `matches` must be in ranked order, as saved in a search.
 */
export function pickFreeUnlocks(matches: { vendorId: number; serviceId: number; isTopPick: boolean }[], perService: number): number[] {
  const counts = new Map<number, number>();
  return matches.flatMap((match) => {
    if (match.isTopPick) return [];
    const count = counts.get(match.serviceId) ?? 0;
    counts.set(match.serviceId, count + 1);
    return count < perService ? [match.vendorId] : [];
  });
}

/**
 * Keeps each service's best `perService` results (results are ranked best first within each service).
 * The original order is kept, so every service keeps its top pick.
 */
export function capMatches<T>(matches: T[], serviceOf: (match: T) => number, perService: number): T[] {
  const counts = new Map<number, number>();
  return matches.filter((match) => {
    const service = serviceOf(match);
    const count = counts.get(service) ?? 0;
    counts.set(service, count + 1);
    return count < perService;
  });
}
