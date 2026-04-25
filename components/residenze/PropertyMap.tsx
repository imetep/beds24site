'use client';

import { useEffect, useRef } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { getTranslations } from '@/lib/i18n';
import type { Locale } from '@/config/i18n';

interface Props {
  latitude: number;
  longitude: number;
  name: string;
  locale?: string;
}

export default function PropertyMap({ latitude, longitude, name, locale = 'it' }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY;
  const t = getTranslations((locale as Locale));
  const label = t.components.propertyMap.label;

  useEffect(() => {
    if (!apiKey || !mapRef.current) return;

    let cancelled = false;
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setOptions({ key: apiKey, v: 'weekly', language: locale });

    Promise.all([
      importLibrary('maps'),
      importLibrary('marker'),
    ]).then(([{ Map }, { Marker }]) => {
      if (cancelled || !mapRef.current) return;
      const position = { lat: latitude, lng: longitude };
      const map = new Map(mapRef.current, {
        center: position,
        zoom: 15,
        gestureHandling: isTouchDevice ? 'greedy' : 'cooperative',
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      new Marker({ map, position, title: name });
    });

    return () => {
      cancelled = true;
    };
  }, [apiKey, latitude, longitude, name, locale]);

  if (!apiKey) return null;

  return (
    <div className="mb-5">
      <h2 className="room-map__title">
        <i className="bi bi-geo-alt-fill me-1" aria-hidden="true" />
        {label}
      </h2>
      <div
        ref={mapRef}
        className="room-map__frame"
        role="application"
        aria-label={name}
      />
    </div>
  );
}
