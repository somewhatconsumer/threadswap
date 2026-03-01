const defaultCenter = { lat: 37.7749, lng: -122.4194 } // San Francisco fallback

export function getDefaultCenter(): { lat: number; lng: number } {
  return { ...defaultCenter }
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      resolve(defaultCenter)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(defaultCenter),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    )
  })
}
