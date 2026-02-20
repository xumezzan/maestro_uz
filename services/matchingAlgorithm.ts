import { Specialist, AIAnalysisResult } from '../types';

export interface MatchingCriteria {
    category?: string;
    tags?: string[];
    location?: string;
    budget?: string | number;
    keyword?: string;
    aiAnalysis?: AIAnalysisResult | null;
}

/**
 * Advanced matching algorithm to score specialists based on specific request criteria.
 * Higher score means a better match.
 */
export const matchSpecialists = (specialists: Specialist[], criteria: MatchingCriteria): Specialist[] => {
    const { category, tags = [], location, keyword, aiAnalysis } = criteria;
    const keywordLower = keyword?.toLowerCase().trim() || '';

    // Get combined tags to check against
    const checkTags = [...tags, ...(aiAnalysis?.relevantTags || [])].map(t => t.toLowerCase());
    const checkCategory = aiAnalysis?.category || category;

    const scoredSpecialists = specialists.map(specialist => {
        let score = 0;

        // 1. Category Match (High Priority)
        if (checkCategory && specialist.category === checkCategory) {
            score += 50;
        }

        // 2. Tags Match
        const specialistTags = specialist.tags.map(t => t.toLowerCase());
        let tagsMatched = 0;
        for (const tag of checkTags) {
            if (specialistTags.includes(tag)) {
                score += 15; // 15 points per exact tag match
                tagsMatched++;
            } else if (specialistTags.some(t => t.includes(tag) || tag.includes(t))) {
                score += 5; // Partial tag match
            }
        }

        // 3. Keyword Match (if user typed something specific)
        if (keywordLower) {
            const nameMatch = specialist.name.toLowerCase().includes(keywordLower);
            const descMatch = specialist.description.toLowerCase().includes(keywordLower);

            if (nameMatch) score += 20;
            if (descMatch) score += 10;

            // If no category matched, and no tags, and no keyword match, score drops to 0 unless AI matched it
            if (!nameMatch && !descMatch && score === 0 && !checkCategory) {
                return { specialist, score: -100 }; // Filter out completely unrelated
            }
        }

        // 4. Location Match
        if (location && specialist.location.toLowerCase().includes(location.toLowerCase())) {
            score += 20;
        } else if (location && location !== 'Ташкент' && location !== 'Toshkent') {
            // Small penalty if looking for specific city but specialist is not there
            score -= 5;
        }

        // 5. Rating and Trust (Multiplier & Bonus)
        // Add raw points scaled from rating (e.g. 5.0 -> 10 points)
        score += (specialist.rating * 2);

        // Add points for experience (reviews count)
        // +1 point per 5 reviews (max +10 points)
        score += Math.min(10, Math.floor(specialist.reviewsCount / 5));

        // Verified badge bonus
        if (specialist.verified) {
            score += 10;
        }

        return { specialist, score };
    });

    // Filter out negative scores and sort by highest score
    const matchedAndSorted = scoredSpecialists
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(item => item.specialist);

    // If strict filtering gives too few results, fallback to returning all top-rated in category
    if (matchedAndSorted.length === 0 && checkCategory) {
        return specialists
            .filter(s => s.category === checkCategory)
            .sort((a, b) => b.rating - a.rating);
    }

    return matchedAndSorted;
};
