const intensities = new Map<string, number>();

export const resolveIntensity = (unresolved: number | string): number => {
  return typeof unresolved === "number" ? unresolved : getIntensity(unresolved)
}

export const getIntensity = (name: string, defaultIntensity = 0.0): number => {
  return intensities.get(name) || defaultIntensity
}

export const setIntensity = (name: string, intensity: number) => intensities.set(name, intensity);