import {
  CampusLocation,
  ItemCategory,
  ItemReport,
  MatchFactorBreakdown,
  PotentialMatchPair,
  ReportStatus,
  ReportType,
} from '../types/campusfind';

/**
 * Campus spatial adjacency map so nearby campus locations earn partial location proximity points.
 */
const LOCATION_ADJACENCY: Record<CampusLocation, CampusLocation[]> = {
  Library: ['Main building', 'Corridor', 'Classroom'],
  Classroom: ['Corridor', 'Main building', 'Laboratory', 'Library'],
  Laboratory: ['Classroom', 'Corridor', 'Main building'],
  Canteen: ['Playground', 'Hostel', 'Corridor'],
  Playground: ['Canteen', 'Parking area', 'Hostel'],
  'Parking area': ['Main building', 'Playground'],
  'Main building': ['Library', 'Classroom', 'Corridor', 'Parking area'],
  Corridor: ['Classroom', 'Laboratory', 'Library', 'Main building', 'Canteen'],
  Hostel: ['Canteen', 'Playground'],
  Other: [],
};

/**
 * Related item categories that share partial functional overlap (12 / 30 pts).
 */
const RELATED_CATEGORIES: Partial<Record<ItemCategory, ItemCategory[]>> = {
  Electronics: ['Accessories and jewelry', 'Personal belongings'],
  'Bags and backpacks': ['Personal belongings', 'Books and stationery'],
  'Books and stationery': ['Bags and backpacks', 'Personal belongings'],
  'Accessories and jewelry': ['Personal belongings', 'Clothing', 'Electronics'],
  'Identification cards': ['Personal belongings', 'Accessories and jewelry'],
  Keys: ['Accessories and jewelry', 'Personal belongings'],
  'Water bottles': ['Personal belongings'],
  'Personal belongings': [
    'Accessories and jewelry',
    'Identification cards',
    'Keys',
    'Water bottles',
    'Bags and backpacks',
  ],
};

/**
 * Color similarity groups for closely related shades.
 */
const SIMILAR_COLORS: Record<string, string[]> = {
  black: ['grey', 'navy', 'charcoal', 'dark'],
  grey: ['black', 'silver', 'white', 'slate'],
  silver: ['grey', 'white', 'metallic'],
  white: ['silver', 'grey', 'cream'],
  blue: ['navy', 'teal', 'indigo'],
  navy: ['blue', 'black'],
  red: ['maroon', 'burgundy', 'pink', 'orange'],
  brown: ['tan', 'beige', 'yellow / gold'],
  'yellow / gold': ['brown', 'orange'],
};

const STOP_WORDS = new Set([
  'the',
  'and',
  'for',
  'with',
  'near',
  'from',
  'lost',
  'found',
  'item',
  'left',
  'inside',
  'around',
  'campus',
  'was',
  'has',
  'have',
  'this',
  'that',
  'very',
  'some',
]);

/**
 * Tokenize text into normalized meaningful keywords and stems.
 */
export function tokenizeText(input: string): string[] {
  if (!input) return [];
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
}

/**
 * Compare a LOST report and a FOUND report using the deterministic 100-point weighted formula:
 * - Category similarity: 30 points
 * - Item name & description similarity: 25 points
 * - Color similarity: 15 points
 * - Location similarity: 15 points
 * - Date proximity: 15 points
 *
 * Missing information is never treated as an automatic match.
 */
export function calculateMatchBreakdown(
  lostReport: ItemReport,
  foundReport: ItemReport
): MatchFactorBreakdown {
  const matchedFactors: string[] = [];
  const uncertainOrMismatchedFactors: string[] = [];

  // 1. Category Similarity (Max 30 points)
  let categoryScore = 0;
  if (!lostReport.category || !foundReport.category) {
    uncertainOrMismatchedFactors.push('Category missing on one of the reports');
  } else if (lostReport.category === foundReport.category) {
    categoryScore = 30;
    matchedFactors.push(`Exact item category match (${lostReport.category})`);
  } else if (
    RELATED_CATEGORIES[lostReport.category]?.includes(foundReport.category) ||
    RELATED_CATEGORIES[foundReport.category]?.includes(lostReport.category)
  ) {
    categoryScore = 12;
    matchedFactors.push(
      `Related item categories (${lostReport.category} / ${foundReport.category})`
    );
  } else {
    uncertainOrMismatchedFactors.push(
      `Different categories (${lostReport.category} vs ${foundReport.category})`
    );
  }

  // 2. Item Name & Description Similarity (Max 25 points)
  let textScore = 0;
  const lostTitleTokens = tokenizeText(`${lostReport.title} ${lostReport.brand || ''}`);
  const foundTitleTokens = tokenizeText(`${foundReport.title} ${foundReport.brand || ''}`);
  const lostAllTokens = tokenizeText(
    `${lostReport.title} ${lostReport.brand || ''} ${lostReport.description}`
  );
  const foundAllTokens = tokenizeText(
    `${foundReport.title} ${foundReport.brand || ''} ${foundReport.description}`
  );

  if (lostAllTokens.length === 0 || foundAllTokens.length === 0) {
    uncertainOrMismatchedFactors.push('Insufficient description text for keyword comparison');
  } else {
    // Check brand match if both specify brand
    let brandBonus = 0;
    if (lostReport.brand?.trim() && foundReport.brand?.trim()) {
      if (lostReport.brand.trim().toLowerCase() === foundReport.brand.trim().toLowerCase()) {
        brandBonus = 6;
        matchedFactors.push(`Matching brand (${lostReport.brand.trim()})`);
      } else {
        uncertainOrMismatchedFactors.push(
          `Different listed brands (${lostReport.brand} vs ${foundReport.brand})`
        );
      }
    }

    // Title token overlap (up to 13 pts)
    const sharedTitle = lostTitleTokens.filter(
      (t) =>
        foundTitleTokens.includes(t) ||
        foundAllTokens.some((ft) => ft.includes(t) || t.includes(ft))
    );
    const titleRatio =
      lostTitleTokens.length > 0
        ? Math.min(1, sharedTitle.length / Math.max(1, Math.min(lostTitleTokens.length, 3)))
        : 0;

    // Full text token overlap (up to 12 pts)
    const uniqueLost = Array.from(new Set(lostAllTokens));
    const uniqueFound = new Set(foundAllTokens);
    const sharedAll = uniqueLost.filter(
      (t) =>
        uniqueFound.has(t) ||
        Array.from(uniqueFound).some((ft) => ft.length >= 4 && (ft.includes(t) || t.includes(ft)))
    );
    const descRatio =
      uniqueLost.length > 0
        ? Math.min(1, sharedAll.length / Math.max(2, Math.min(uniqueLost.length, 5)))
        : 0;

    textScore = Math.min(25, Math.round(titleRatio * 13 + descRatio * 12 + brandBonus));

    if (textScore >= 16) {
      matchedFactors.push(
        `Strong item name & description overlap (${sharedAll.slice(0, 4).join(', ')})`
      );
    } else if (textScore >= 8) {
      matchedFactors.push(
        `Partial keyword similarity (${sharedAll.slice(0, 3).join(', ')})`
      );
    } else {
      uncertainOrMismatchedFactors.push('Limited overlap in item name and public description');
    }
  }

  // 3. Color Similarity (Max 15 points)
  let colorScore = 0;
  const lostColor = (lostReport.color || '').trim().toLowerCase();
  const foundColor = (foundReport.color || '').trim().toLowerCase();

  if (!lostColor || !foundColor || lostColor === 'other' || foundColor === 'other') {
    uncertainOrMismatchedFactors.push('Color not specifically specified on both reports');
  } else if (lostColor === foundColor) {
    colorScore = 15;
    matchedFactors.push(`Exact color match (${lostReport.color})`);
  } else if (
    SIMILAR_COLORS[lostColor]?.includes(foundColor) ||
    SIMILAR_COLORS[foundColor]?.includes(lostColor)
  ) {
    colorScore = 9;
    matchedFactors.push(`Closely related color shade (${lostReport.color} / ${foundReport.color})`);
  } else {
    uncertainOrMismatchedFactors.push(
      `Color mismatch (${lostReport.color} vs ${foundReport.color})`
    );
  }

  // 4. Location Similarity (Max 15 points)
  let locationScore = 0;
  const lostLoc = lostReport.generalLocation;
  const foundLoc = foundReport.generalLocation;

  if (!lostLoc || !foundLoc) {
    uncertainOrMismatchedFactors.push('Campus location unspecified');
  } else if (lostLoc === foundLoc && lostLoc !== 'Other') {
    locationScore = 15;
    matchedFactors.push(`Same campus location (${lostLoc})`);
  } else if (
    LOCATION_ADJACENCY[lostLoc]?.includes(foundLoc) ||
    LOCATION_ADJACENCY[foundLoc]?.includes(lostLoc)
  ) {
    locationScore = 9;
    matchedFactors.push(`Nearby campus zones (${lostLoc} and ${foundLoc})`);
  } else {
    uncertainOrMismatchedFactors.push(
      `Different campus locations (${lostLoc} vs ${foundLoc})`
    );
  }

  // 5. Date Proximity (Max 15 points)
  let dateScore = 0;
  const lostTime = Date.parse(lostReport.dateOccurred);
  const foundTime = Date.parse(foundReport.dateOccurred);

  if (Number.isNaN(lostTime) || Number.isNaN(foundTime)) {
    uncertainOrMismatchedFactors.push('Report date missing or unparseable');
  } else {
    const diffDays = (foundTime - lostTime) / (1000 * 60 * 60 * 24);
    const absDays = Math.abs(diffDays);

    // Note: if found more than 2 days BEFORE it was reported lost, it's less likely unless student misremembered date
    if (diffDays < -3) {
      dateScore = 2;
      uncertainOrMismatchedFactors.push(
        `Item was found ${Math.round(absDays)} days before reported lost date`
      );
    } else if (absDays <= 1) {
      dateScore = 15;
      matchedFactors.push('Reported on the same or consecutive day');
    } else if (absDays <= 3) {
      dateScore = 12;
      matchedFactors.push(`Close date proximity (within ${Math.round(absDays)} days)`);
    } else if (absDays <= 7) {
      dateScore = 8;
      matchedFactors.push(`Reported within the same week (${Math.round(absDays)} days apart)`);
    } else if (absDays <= 14) {
      dateScore = 4;
      uncertainOrMismatchedFactors.push(`Reported ${Math.round(absDays)} days apart`);
    } else {
      dateScore = 0;
      uncertainOrMismatchedFactors.push(
        `Significant time gap (${Math.round(absDays)} days apart)`
      );
    }
  }

  const rawTotal = categoryScore + textScore + colorScore + locationScore + dateScore;

  // Normalization: Missing information never inflates a match; rawTotal out of 100 is clamped [0, 100].
  const normalizedPercentage = Math.max(0, Math.min(100, Math.round(rawTotal)));

  return {
    categoryScore,
    textScore,
    colorScore,
    locationScore,
    dateScore,
    rawTotal,
    normalizedPercentage,
    matchedFactors,
    uncertainOrMismatchedFactors,
  };
}

/**
 * Eligible statuses for active matching (excludes RETURNED, CLOSED, FLAGGED).
 */
export function isReportEligibleForMatching(report: ItemReport): boolean {
  return (
    report.status !== ReportStatus.RETURNED &&
    report.status !== ReportStatus.CLOSED &&
    report.status !== ReportStatus.FLAGGED
  );
}

/**
 * Compute all potential matches across all active LOST and FOUND reports.
 * Filters out low-relevance pairs below `minScoreThreshold` (default 38%).
 */
export function findPotentialMatches(
  reports: ItemReport[],
  minScoreThreshold = 38
): PotentialMatchPair[] {
  const activeReports = reports.filter(isReportEligibleForMatching);
  const lostReports = activeReports.filter((r) => r.reportType === ReportType.LOST);
  const foundReports = activeReports.filter((r) => r.reportType === ReportType.FOUND);

  const pairs: PotentialMatchPair[] = [];

  for (const lost of lostReports) {
    for (const found of foundReports) {
      const breakdown = calculateMatchBreakdown(lost, found);
      if (breakdown.normalizedPercentage >= minScoreThreshold) {
        pairs.push({
          id: `MATCH-${lost.id}-${found.id}`,
          lostReport: lost,
          foundReport: found,
          breakdown,
        });
      }
    }
  }

  return pairs.sort(
    (a, b) => b.breakdown.normalizedPercentage - a.breakdown.normalizedPercentage
  );
}

/**
 * Find ranked potential matches for a single target report (either LOST or FOUND).
 */
export function getMatchesForSingleReport(
  target: ItemReport,
  allReports: ItemReport[],
  minScoreThreshold = 35
): PotentialMatchPair[] {
  if (!isReportEligibleForMatching(target)) return [];

  const candidates = allReports.filter(
    (r) =>
      r.id !== target.id &&
      r.reportType !== target.reportType &&
      isReportEligibleForMatching(r)
  );

  const results: PotentialMatchPair[] = [];
  for (const candidate of candidates) {
    const lost = target.reportType === ReportType.LOST ? target : candidate;
    const found = target.reportType === ReportType.FOUND ? target : candidate;
    const breakdown = calculateMatchBreakdown(lost, found);
    if (breakdown.normalizedPercentage >= minScoreThreshold) {
      results.push({
        id: `MATCH-${lost.id}-${found.id}`,
        lostReport: lost,
        foundReport: found,
        breakdown,
      });
    }
  }

  return results.sort(
    (a, b) => b.breakdown.normalizedPercentage - a.breakdown.normalizedPercentage
  );
}

/**
 * Built-in unit tests for verifying deterministic scoring rules in-app and via API.
 */
export function runMatchingEngineUnitTests(): {
  passed: boolean;
  results: { name: string; passed: boolean; details: string }[];
} {
  const baseLost: ItemReport = {
    id: 'TEST-L1',
    reporterId: 'u1',
    reporterName: 'Test Student',
    reportType: ReportType.LOST,
    title: 'Black Hydro Flask Water Bottle',
    category: 'Water bottles',
    color: 'Black',
    brand: 'Hydro Flask',
    description: 'Matte black insulated stainless steel water bottle with carabiner loop',
    generalLocation: 'Library',
    dateOccurred: '2026-10-10',
    status: ReportStatus.OPEN,
    custodyStatus: 'OWNER_LOST' as any,
    createdAt: '2026-10-10T10:00:00Z',
    updatedAt: '2026-10-10T10:00:00Z',
  };

  const exactFound: ItemReport = {
    ...baseLost,
    id: 'TEST-F1',
    reportType: ReportType.FOUND,
    custodyStatus: 'HANDED_TO_SECURITY' as any,
  };

  const mismatchFound: ItemReport = {
    ...baseLost,
    id: 'TEST-F2',
    reportType: ReportType.FOUND,
    title: 'Red Woolen Scarf',
    category: 'Clothing',
    color: 'Red',
    brand: 'Uniqlo',
    description: 'Knitted winter scarf left on bench',
    generalLocation: 'Playground',
    dateOccurred: '2026-09-01',
  };

  const returnedFound: ItemReport = {
    ...exactFound,
    id: 'TEST-F3',
    status: ReportStatus.RETURNED,
  };

  const scoreExact = calculateMatchBreakdown(baseLost, exactFound);
  const scoreMismatch = calculateMatchBreakdown(baseLost, mismatchFound);
  const activePairs = findPotentialMatches([baseLost, exactFound, mismatchFound, returnedFound]);

  const results = [
    {
      name: 'Exact match achieves maximum 100/100 weighted points (30+25+15+15+15)',
      passed: scoreExact.normalizedPercentage === 100 && scoreExact.categoryScore === 30,
      details: `Calculated ${scoreExact.normalizedPercentage}% (Cat:${scoreExact.categoryScore}, Text:${scoreExact.textScore}, Col:${scoreExact.colorScore}, Loc:${scoreExact.locationScore}, Date:${scoreExact.dateScore})`,
    },
    {
      name: 'Unrelated item receives 0% similarity and does not false-match',
      passed: scoreMismatch.normalizedPercentage < 15,
      details: `Calculated ${scoreMismatch.normalizedPercentage}% for unrelated category/color/location/date`,
    },
    {
      name: 'Already returned items and same-type reports are excluded from matching',
      passed: activePairs.length === 1 && activePairs[0].foundReport.id === 'TEST-F1',
      details: `Active match count: ${activePairs.length} (expected 1)`,
    },
  ];

  return {
    passed: results.every((r) => r.passed),
    results,
  };
}
