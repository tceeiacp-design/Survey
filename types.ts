
export type UserRole = 'ADMIN' | 'SURVEYOR';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface SurveySubmission {
  id: string;
  surveyorId: string;
  surveyorName: string;
  timestamp: number;
  location?: GeoLocation;
  
  // Section A: General Information
  generalInfo: {
    respondentName: string;
    role: string;
    establishmentType: string;
    otherEstablishmentType?: string;
    shopNumber: string; // "Shop / Stall number / Location"
    operatingHours: string;
    workerCount: number;
  };

  // Section B: Waste Generation Details
  wasteGeneration: {
    wasteTypes: string[]; // Biodegradable, Plastic, etc.
    otherWasteType?: string;
    quantity: string; // <5kg, 5-10kg, etc.
    seasonalVariation: string;
    seasonalMonths?: string;
  };

  // Section C: Waste Segregation Practices
  segregation: {
    doesSegregate: boolean; // Yes/No
    segregationMethod?: string; // Wet/Dry etc.
    reasonsForNotSegregating?: string[]; // Lack of awareness, etc.
    otherReason?: string;
    hasColorCodedBins: boolean;
  };

  // Section D: Storage and Handling
  storage: {
    storageType: string; // Open dumping, Plastic bins, etc.
    removalFrequency: string; // Multiple times, Once a day...
    storageIssues: string[]; // Bad odour, Flies...
  };

  // Section E: Collection and Transportation
  collection: {
    collector: string; // Madurai Corp, Private...
    collectionFrequency: string; // Daily...
    collectionMode: string; // Handcart...
    isSegregatedCollected: string; // Yes, No, Not applicable
  };

  // Section F: Treatment and Disposal Awareness
  awareness: {
    disposalLocation: string; // Composting yard, etc.
    processingMethodAwareness: string; // Composting, Recycling...
    compostingWillingness: string; // Yes, No, Maybe
  };

  // Section G: Plastic Waste Management
  plastic: {
    typesUsed: string[]; // Single-use, Packaging...
    ruleAwareness: string; // Aware, Partially...
    disposalPractice: string; // Mixed, Sold...
  };

  // Section H: Health, Safety, and Environmental
  healthSafety: {
    healthIssuesNoticed: boolean;
    healthIssueDetails?: string;
    protectiveEquipmentUsage: string; // Regularly...
    cleanlinessRating: string; // Very good...
  };

  // Section I: Suggestions
  suggestions: {
    improvementIdeas: string;
    supportRequired: string;
    willingnessToCooperate: boolean;
  };
}

export interface WasteAuditEntry {
  stallId: string;
  biodegradable: number;
  recyclable: number; // Paper/Metal/Glass
  plastic: number;
  hazardous: number;
  total: number;
  notes: string;
}

export interface WasteCompositionItem {
  component: string; // Leafy, Rotten Fruits, etc.
  percentage: number;
  remarks: string;
}

export interface WasteFlowStage {
  stage: string; // Waste Generation, Temporary Storage, etc.
  observedPractice: string;
  issuesIdentified: string;
}

export interface AuditSubmission {
  id: string;
  surveyorId: string;
  surveyorName: string;
  timestamp: number;
  location?: GeoLocation;
  
  // Section 1: General Details
  auditDate: string;
  marketZone: string;
  stallCategory: string;
  stallsCovered: number;
  auditTime: string; // Morning / Afternoon / Evening

  // Section 2: Stall-wise Measurement
  entries: WasteAuditEntry[];

  // Section 3: Waste Composition Sampling (10% Sample Method)
  wasteComposition: {
    leafyWaste: WasteCompositionItem;
    rottenFruits: WasteCompositionItem;
    packagingWaste: WasteCompositionItem;
    multiLayerPlastics: WasteCompositionItem;
    petBottles: WasteCompositionItem;
    otherMixed: WasteCompositionItem;
  };

  // Section 4: Waste Flow Mapping
  wasteFlow: {
    generation: WasteFlowStage;
    storage: WasteFlowStage;
    collection: WasteFlowStage;
    transport: WasteFlowStage;
    disposal: WasteFlowStage;
  };

  // Section 6: Overall Assessment Summary
  assessment: {
    totalWasteGenerated: string; // "kg/day"
    highWasteClusters: string;
    keyProblems: string;
    improvementOpportunities: string;
  };
}
