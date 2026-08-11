export type Confidence = "High" | "Medium" | "Low";
export type TargetTaxon = "Plants" | "Fungi" | "Birds" | "Insects";
export type DataStatus = "live" | "demo-snapshot";

export interface TaxonCounts {
  Plants: number;
  Fungi: number;
  Birds: number;
  Insects: number;
}

export interface CellMetrics {
  recentRecords: number;
  priorRecords: number;
  annualizedPriorRecords: number;
  recentTaxa: TaxonCounts;
  priorTaxa: TaxonCounts;
  densityGap: number;
  coverageChange: number;
  targetGap: number;
}

export interface HabitatCell {
  id: string;
  polygon: [number, number][];
  center: [number, number];
  areaKm2: number;
  gapScore: number | null;
  confidence: Confidence;
  targetTaxon: TargetTaxon;
  explanation: string;
  metrics: CellMetrics;
}

export interface ClimateContext {
  comparisonMonth: string;
  temperatureAnomalyC: number | null;
  precipitationPercentile: number | null;
  currentTemperatureC: number | null;
  baselineTemperatureC: number | null;
  currentPrecipitationMm: number | null;
  baselinePrecipitationMm: number | null;
  summary: string;
}

export interface SurveyWindow {
  date: string;
  score: number;
  temperatureMaxC: number;
  precipitationProbability: number;
  windMaxKph: number;
  label: string;
}

export interface HabitatAnalysis {
  id: string;
  area: {
    label: string;
    latitude: number;
    longitude: number;
    radiusKm: number;
  };
  generatedAt: string;
  sourceTimestamps: {
    gbif: string;
    weather: string;
  };
  dataStatus: DataStatus;
  dataStatusMessage: string;
  rankingSuppressed: boolean;
  rankingMessage: string;
  cells: HabitatCell[];
  climate: ClimateContext;
  surveyWindows: SurveyWindow[];
  sources: {
    gbif: string;
    weather: string;
    basemap: string;
  };
}

export interface Mission {
  id: string;
  areaLabel: string;
  latitude: number;
  longitude: number;
  h3Cell: string;
  polygon: [number, number][];
  targetTaxon: TargetTaxon;
  analysisSnapshot: {
    gapScore: number | null;
    confidence: Confidence;
    explanation: string;
    dataStatus: DataStatus;
    generatedAt: string;
    metrics?: CellMetrics;
  };
  surveyWindow?: SurveyWindow;
  scheduledDate: string;
  durationMinutes: number;
  status: "planned" | "completed";
  evidenceUrl?: string;
  createdAt: string;
  completedAt?: string;
}

export interface GeocodeResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  timezone?: string;
}
