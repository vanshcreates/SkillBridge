import { User } from "../models/user.model.js";

// Industry benchmark rates and labor estimates for traditional Indian craftsmanship
const CRAFT_BENCHMARKS = {
  textiles: {
    label: "Textiles & Handloom",
    avgLaborHoursPerUnit: 10,
    minHourlyRate: 180,
    recommendedHourlyRate: 260,
    materialCostRatio: 0.3,
    ecoKeywords: [
      "organic",
      "handloom",
      "khadi",
      "cotton",
      "silk",
      "vegetable dye",
      "natural dye",
      "block print",
      "chanderi",
      "zari",
      "embroidery",
      "linen",
    ],
  },
  pottery: {
    label: "Pottery & Ceramics",
    avgLaborHoursPerUnit: 6,
    minHourlyRate: 150,
    recommendedHourlyRate: 220,
    materialCostRatio: 0.25,
    ecoKeywords: [
      "clay",
      "terracotta",
      "blue pottery",
      "earthenware",
      "ceramic",
      "lead-free",
      "non-toxic",
      "natural glaze",
      "sun-dried",
    ],
  },
  woodcraft: {
    label: "Woodcraft & Carving",
    avgLaborHoursPerUnit: 14,
    minHourlyRate: 200,
    recommendedHourlyRate: 300,
    materialCostRatio: 0.4,
    ecoKeywords: [
      "teak",
      "sheesham",
      "rosewood",
      "reclaimed wood",
      "carving",
      "beeswax",
      "linseed oil",
      "sustainable timber",
      "hand-carved",
    ],
  },
  jewelry: {
    label: "Jewelry & Metalcraft",
    avgLaborHoursPerUnit: 8,
    minHourlyRate: 220,
    recommendedHourlyRate: 340,
    materialCostRatio: 0.45,
    ecoKeywords: [
      "brass",
      "silver",
      "dhokra",
      "filigree",
      "lost-wax",
      "recycled metal",
      "copper",
      "bronze",
      "handcrafted",
    ],
  },
  leathercraft: {
    label: "Leather & Footwear",
    avgLaborHoursPerUnit: 8,
    minHourlyRate: 180,
    recommendedHourlyRate: 270,
    materialCostRatio: 0.38,
    ecoKeywords: [
      "vegetable tanned",
      "eco leather",
      "cruelty-free",
      "hand-stitched",
      "mojari",
      "traditional dye",
    ],
  },
  default: {
    label: "Handmade Craft",
    avgLaborHoursPerUnit: 8,
    minHourlyRate: 160,
    recommendedHourlyRate: 240,
    materialCostRatio: 0.32,
    ecoKeywords: [
      "handmade",
      "sustainable",
      "organic",
      "eco-friendly",
      "traditional",
      "artisan",
      "natural",
      "biodegradable",
    ],
  },
};

/**
 * Identify matching benchmark category from text/string
 */
function getBenchmark(category = "") {
  const cat = String(category).toLowerCase();
  if (cat.includes("textile") || cat.includes("fabric") || cat.includes("cotton") || cat.includes("weav") || cat.includes("print") || cat.includes("embroidery")) {
    return CRAFT_BENCHMARKS.textiles;
  }
  if (cat.includes("potter") || cat.includes("clay") || cat.includes("ceramic") || cat.includes("terracotta")) {
    return CRAFT_BENCHMARKS.pottery;
  }
  if (cat.includes("wood") || cat.includes("carv") || cat.includes("timber") || cat.includes("furniture")) {
    return CRAFT_BENCHMARKS.woodcraft;
  }
  if (cat.includes("jewel") || cat.includes("metal") || cat.includes("brass") || cat.includes("silver") || cat.includes("dhokra")) {
    return CRAFT_BENCHMARKS.jewelry;
  }
  if (cat.includes("leather") || cat.includes("shoe") || cat.includes("bag")) {
    return CRAFT_BENCHMARKS.leathercraft;
  }
  return CRAFT_BENCHMARKS.default;
}

/**
 * Parse human duration string into approximate days
 */
export function parseDurationToDays(durationStr, fallbackDeadline = null) {
  if (typeof durationStr === "number" && durationStr > 0) {
    return durationStr;
  }

  const str = String(durationStr || "").toLowerCase().trim();
  const daysMatch = str.match(/(\d+)\s*day/);
  if (daysMatch) return parseInt(daysMatch[1], 10);

  const weeksMatch = str.match(/(\d+)\s*week/);
  if (weeksMatch) return parseInt(weeksMatch[1], 10) * 7;

  const monthsMatch = str.match(/(\d+)\s*month/);
  if (monthsMatch) return parseInt(monthsMatch[1], 10) * 30;

  if (fallbackDeadline) {
    const diffTime = new Date(fallbackDeadline).getTime() - Date.now();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) return diffDays;
  }

  return 30; // sensible default
}

/**
 * Comprehensive analysis for an Industry Project or Production Request
 */
export async function analyzeResponsibleProject({
  title = "",
  category = "",
  description = "",
  quantity = 1,
  unitPrice = 0,
  duration = "30 days",
  deadline = null,
  specifications = "",
}) {
  const benchmark = getBenchmark(category || title);
  const qty = Math.max(1, Number(quantity) || 1);
  const price = Math.max(0, Number(unitPrice) || 0);
  const durationDays = parseDurationToDays(duration, deadline);

  // 1. Labor & Material Cost Estimation
  const estimatedLaborHoursPerUnit = benchmark.avgLaborHoursPerUnit;
  const totalLaborHours = estimatedLaborHoursPerUnit * qty;
  const estimatedMaterialCostPerUnit = Math.round(price * benchmark.materialCostRatio) || Math.round(price * 0.35);
  const estimatedTotalMaterialCost = estimatedMaterialCostPerUnit * qty;

  // Suggested price based on recommended fair hourly wage
  const suggestedPricePerUnit = Math.max(
    Math.round(
      estimatedLaborHoursPerUnit * benchmark.recommendedHourlyRate +
        (estimatedLaborHoursPerUnit * benchmark.recommendedHourlyRate * 0.45)
    ),
    200
  );

  // 2. Fair Wage Rating
  const netEarningsPerUnit = Math.max(0, price - estimatedMaterialCostPerUnit);
  const effectiveHourlyRate = estimatedLaborHoursPerUnit > 0
    ? Math.round(netEarningsPerUnit / estimatedLaborHoursPerUnit)
    : 0;

  let fairWageRating = "Fair Wage Verified";
  let fairWageScore = 85;

  if (effectiveHourlyRate >= benchmark.recommendedHourlyRate * 1.1) {
    fairWageRating = "Premium Partner (Generous Compensation)";
    fairWageScore = 98;
  } else if (effectiveHourlyRate >= benchmark.recommendedHourlyRate) {
    fairWageRating = "Fair Wage Verified (Above Market Standard)";
    fairWageScore = 92;
  } else if (effectiveHourlyRate >= benchmark.minHourlyRate) {
    fairWageRating = "Fair Wage Verified";
    fairWageScore = 80;
  } else {
    fairWageRating = "Below Recommended Artisan Wage Threshold";
    fairWageScore = Math.max(35, Math.min(68, Math.round((effectiveHourlyRate / benchmark.minHourlyRate) * 75)));
  }

  // 3. Time Duration & Feasibility Assessment
  // Assuming 1 full-time artisan works 7 productive craft hours / day, 6 days / week
  const realisticWorkingDaysNeeded = Math.ceil((totalLaborHours / 7) * 1.15) + 2; // with quality buffer
  const suggestedDurationDays = Math.max(realisticWorkingDaysNeeded, 5);

  let feasibilityScore = 88;
  let feasibilityStatus = "High Feasibility";

  if (durationDays >= realisticWorkingDaysNeeded) {
    feasibilityScore = 95;
    feasibilityStatus = "Optimal Timeline (High Feasibility)";
  } else if (durationDays >= realisticWorkingDaysNeeded * 0.75) {
    feasibilityScore = 78;
    feasibilityStatus = "Moderate Feasibility (Fast-Paced)";
  } else {
    feasibilityScore = Math.max(30, Math.round((durationDays / realisticWorkingDaysNeeded) * 70));
    feasibilityStatus = "Challenging Timeline (Rushed Production)";
  }

  // 4. Sustainability & Responsible Craft Index
  const fullText = `${title} ${description} ${specifications} ${category}`.toLowerCase();
  let matchedEcoCount = 0;
  benchmark.ecoKeywords.forEach((kw) => {
    if (fullText.includes(kw.toLowerCase())) matchedEcoCount++;
  });

  const hasEcoFriendlyMaterials = matchedEcoCount >= 1 || fullText.includes("organic") || fullText.includes("natural");
  const hasTraditionalPreservation = true; // SkillBridge focuses on traditional craft preservation
  const hasLowCarbon = !fullText.includes("plastic") && !fullText.includes("synthetic");

  let sustainabilityScore = 75;
  if (hasEcoFriendlyMaterials) sustainabilityScore += 12;
  if (hasLowCarbon) sustainabilityScore += 8;
  if (fairWageScore >= 80) sustainabilityScore += 5;
  sustainabilityScore = Math.min(100, sustainabilityScore);

  let badge = "Fair Craft Certified";
  if (sustainabilityScore >= 92 && fairWageScore >= 90) {
    badge = "Gold Responsible Artisan Partner 🌟";
  } else if (sustainabilityScore >= 85) {
    badge = "Silver Eco-Craft Champion 🌿";
  } else if (fairWageScore >= 80) {
    badge = "Fair Wage Verified Maker ⚖️";
  }

  // 5. Intelligent Artisan Recommendation
  // Look up registered artisans in database
  let recommendedArtisans = [];
  try {
    const artisans = await User.find({ accountType: "artisan" }).select("-password");

    const scoredArtisans = artisans.map((artisan) => {
      let score = 65; // base score
      const reasons = [];

      const artisanCategory = (artisan.artCategory || "").toLowerCase();
      const projectCat = (category || "").toLowerCase();
      const projTitle = title.toLowerCase();

      // Check category match
      if (
        (artisanCategory && projectCat.includes(artisanCategory)) ||
        (artisanCategory && projTitle.includes(artisanCategory)) ||
        (projectCat && artisanCategory.includes(projectCat))
      ) {
        score += 25;
        reasons.push(`Mastery in ${artisan.artCategory || "matching craft"}`);
      } else {
        reasons.push("Versatile traditional craft skills");
      }

      // Check experience
      const expStr = (artisan.experience || "").toLowerCase();
      if (expStr.includes("10") || expStr.includes("master") || expStr.includes("8") || expStr.includes("7")) {
        score += 10;
        reasons.push(`Veteran artisan experience (${artisan.experience})`);
      } else if (artisan.experience) {
        score += 5;
        reasons.push(`Demonstrated craftsmanship (${artisan.experience})`);
      }

      if (artisan.city) {
        reasons.push(`Located in craft hub ${artisan.city}`);
      }

      return {
        artisanId: artisan._id,
        name: artisan.name,
        email: artisan.email,
        artCategory: artisan.artCategory || "Traditional Craft",
        experience: artisan.experience || "Skilled Artisan",
        city: artisan.city || "India",
        matchScore: Math.min(99, score),
        matchReasons: reasons,
      };
    });

    // Sort by highest match score
    scoredArtisans.sort((a, b) => b.matchScore - a.matchScore);
    recommendedArtisans = scoredArtisans.slice(0, 5);
  } catch (err) {
    console.warn("Could not query artisans for recommendations:", err.message);
  }

  // Summary message
  const summary =
    fairWageScore >= 80 && feasibilityScore >= 75
      ? `This project represents a highly responsible and sustainable collaboration with Indian artisans. Fair compensation (approx. ₹${effectiveHourlyRate}/hr) and reasonable ${durationDays}-day timeline promote dignified livelihoods and superior craftsmanship.`
      : `Project analysis complete. For best quality and artisan commitment, an offer near ₹${suggestedPricePerUnit}/unit and a duration of at least ${suggestedDurationDays} days are recommended.`;

  return {
    feasibilityScore,
    feasibilityStatus,
    fairWageRating,
    fairWageScore,
    effectiveHourlyRate,
    estimatedLaborHours: totalLaborHours,
    estimatedLaborHoursPerUnit,
    estimatedMaterialCost: estimatedTotalMaterialCost,
    estimatedMaterialCostPerUnit,
    suggestedPricePerUnit,
    suggestedDurationDays,
    durationDays,
    sustainabilityIndex: {
      score: sustainabilityScore,
      ecoFriendlyMaterials: hasEcoFriendlyMaterials,
      traditionalTechniquePreservation: hasTraditionalPreservation,
      lowCarbonFootprint: hasLowCarbon,
      badge,
    },
    analysisSummary: summary,
    recommendedArtisans,
  };
}

