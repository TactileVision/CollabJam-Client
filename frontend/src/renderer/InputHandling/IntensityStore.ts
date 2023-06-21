const intensities = new Map<string, { value?: number, locked: boolean }>();

export const resolveIntensity = (unresolved: number | string): number => {
  return typeof unresolved === "number" ? unresolved : getIntensity(unresolved)
}

export const getIntensity = (name: string, defaultIntensity = 0.0): number => {
  return intensities.get(name)?.value || defaultIntensity
}

export const setIntensity = (name: string, intensity: number) => {
  if(intensities.get(name)?.locked) return;

  intensities.set(name, { value: intensity, locked: false });
}

export const lockIntensity = (name: string) => {
  const existingIntensity = intensities.get(name) || {};
  intensities.set(name, { ...existingIntensity, locked: true })
}

export const unlockIntensity = (name: string) => {
  if(intensities.has(name)) {
    intensities.set(name, { value: 0, locked: false })
  }
}