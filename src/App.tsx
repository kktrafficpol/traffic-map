
import { useEffect, useRef, useState } from 'react'
import {
  importLibrary,
  setOptions,
} from '@googlemaps/js-api-loader'
import './App.css'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const mapRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function initMap() {
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

        if (cancelled || !mapRef.current) return

        const map = new Map(mapRef.current, {
          center: { lat: 16.439583883871066, lng: 102.82860338687897 },
          zoom: 12,
          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        })

        const trafficLayer = new TrafficLayer()
        trafficLayer.setMap(map)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setError(
            'โหลดแผนที่ไม่สำเร็จ กรุณาตรวจสอบ API Key, Billing และ Console'
          )
        }
      }
    }

    void initMap()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Traffic Map</h1>
          <p>Google Maps + Real-time Traffic</p>
        </div>
        <span className="status">Traffic Layer</span>
      </header>

      {error && <div className="error">{error}</div>}

      <div
        ref={mapRef}
        className="map"
        aria-label="Google Maps showing traffic conditions"
      />

      <footer>
        แผนที่ขอนแก่น · สามารถเลื่อน ซูม และเปลี่ยนพื้นที่ได้
      </footer>
    </main>
  )
}
