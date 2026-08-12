import type { SurveyWindow } from "@/lib/types";

export interface DailyForecast {
  time: string[];
  temperature_2m_max: number[];
  precipitation_probability_max?: number[];
  wind_speed_10m_max?: number[];
}

export function rankSurveyWindows(forecast: DailyForecast): SurveyWindow[] {
  return forecast.time.map((date, index) => {
    const temperature = forecast.temperature_2m_max[index];
    const precipitation = forecast.precipitation_probability_max?.[index] ?? 50;
    const wind = forecast.wind_speed_10m_max?.[index] ?? 30;
    const temperaturePenalty = temperature < 5 ? (5 - temperature) * 4 : temperature > 30 ? (temperature - 30) * 4 : 0;
    const score = Math.round(Math.max(0, 100 - precipitation * 0.55 - wind * 0.8 - temperaturePenalty));
    return {
      date,
      score,
      temperatureMaxC: Math.round(temperature),
      precipitationProbability: Math.round(precipitation),
      windMaxKph: Math.round(wind),
      label: score >= 80 ? "Excellent" : score >= 65 ? "Good" : "Fair",
    } satisfies SurveyWindow;
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}
