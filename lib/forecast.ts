export interface ForecastData {
  wearRate: number
  monthsRemaining: number
  predictedReplacementDate: Date
  confidence: number
}

export function forecastBrushLife(
  historicalData: Array<{
    date: Date
    measurement: number
  }>,
): ForecastData | null {
  if (historicalData.length < 2) {
    return null
  }

  // Sort by date
  const sortedData = historicalData.sort((a, b) => a.date.getTime() - b.date.getTime())

  // Calculate wear rates between consecutive measurements
  const wearRates: number[] = []
  for (let i = 1; i < sortedData.length; i++) {
    const timeDiff = (sortedData[i].date.getTime() - sortedData[i - 1].date.getTime()) / (1000 * 60 * 60 * 24 * 30) // months
    const wearDiff = sortedData[i - 1].measurement - sortedData[i].measurement
    if (timeDiff > 0 && wearDiff >= 0) {
      wearRates.push(wearDiff / timeDiff) // mm per month
    }
  }

  if (wearRates.length === 0) {
    return null
  }

  const avgWearRate = wearRates.reduce((a, b) => a + b) / wearRates.length
  const currentMeasurement = sortedData[sortedData.length - 1].measurement
  const minThreshold = 20 // mm minimum before replacement

  if (avgWearRate <= 0 || currentMeasurement <= minThreshold) {
    return null
  }

  const monthsRemaining = (currentMeasurement - minThreshold) / avgWearRate
  const predictedDate = new Date()
  predictedDate.setMonth(predictedDate.getMonth() + monthsRemaining)

  // Calculate confidence based on data consistency
  const variance = wearRates.reduce((acc, rate) => acc + Math.pow(rate - avgWearRate, 2), 0) / wearRates.length
  const confidence = Math.max(0, Math.min(100, 100 - (variance / avgWearRate) * 100))

  return {
    wearRate: avgWearRate,
    monthsRemaining: Math.max(0, monthsRemaining),
    predictedReplacementDate: predictedDate,
    confidence,
  }
}
