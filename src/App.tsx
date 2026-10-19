
import { useEffect, useRef, useState } from 'react'
import {
  importLibrary,
  setOptions,
} from '@googlemaps/js-api-loader'
import './App.css'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const REFRESH_INTERVAL_MS = 2 * 60 * 1000

export default function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null)

  useEffect(() => {
    const container = mapRef.current
    if (!container) return

    let cancelled = false
    let map: google.maps.Map | null = null
    let trafficLayer: google.maps.TrafficLayer | null = null
    let TrafficLayerCtor: typeof google.maps.TrafficLayer | null = null
    let timer: number | undefined

    // Recreating the layer is what reliably makes Google re-fetch traffic
    // tiles; toggling setMap(null) on the same instance often serves cached
    // ones. The new layer goes on before the old comes off so nothing blinks.
    function refreshTraffic() {
      if (cancelled || !map || !TrafficLayerCtor) return

      const next = new TrafficLayerCtor()
      next.setMap(map)
      trafficLayer?.setMap(null)
      trafficLayer = next
      setUpdatedAt(new Date())
    }

    function stopTimer() {
      if (timer !== undefined) {
        window.clearInterval(timer)
        timer = undefined
      }
    }

    function startTimer() {
      stopTimer()
      timer = window.setInterval(refreshTraffic, REFRESH_INTERVAL_MS)
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        // Don't burn quota refreshing tiles nobody is looking at.
        stopTimer()
        return
      }

      // A backgrounded tab can come back arbitrarily stale.
      refreshTraffic()
      startTimer()
    }

    async function initMap(el: HTMLDivElement) {
      if (!apiKey) {
        setError('ไม่พบ Google Maps API Key')
        return
      }

      try {
        setOptions({
          key: apiKey,
          v: 'weekly',
        })

        const { Map, TrafficLayer } =
          await importLibrary('maps') as google.maps.MapsLibrary

        if (cancelled) return

        map = new Map(el, {
          center: { lat: 16.439583883871066, lng: 102.82860338687897 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        TrafficLayerCtor = TrafficLayer
        refreshTraffic()

        if (!document.hidden) startTimer()
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError(
            'โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบ API Key, Billing และ Console'
          )
        }
      }
    }

    void initMap(container)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      cancelled = true
      stopTimer()
      document.removeEventListener('visibilitychange', handleVisibilityChange)

      trafficLayer?.setMap(null)
      trafficLayer = null

      if (map) {
        google.maps.event.clearInstanceListeners(map)
        map = null
      }

      // Google leaves its DOM behind, which would stack up under StrictMode's
      // double mount and on any future remount.
      container.replaceChildren()
    }
  }, [])

  return (
    <main className="app">

      {error && <div className="error">{error}</div>}

      <div
        ref={mapRef}
        className="map"
        aria-label="Google Maps showing traffic conditions"
      />

      {updatedAt && (
        <div className="updated" aria-live="polite">
          อัปเดตเมื่อ{' '}
          {updatedAt.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      )}
    </main>
  )
}
