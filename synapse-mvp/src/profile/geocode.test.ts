import { describe, expect, it } from 'vitest';
import { osmEmbedUrl, parsePhotonResponse } from './geocode';

describe('geocode helpers', () => {
  it('reads Photon features into labeled coordinates', () => {
    const places = parsePhotonResponse({
      features: [
        {
          geometry: { coordinates: [-73.9857, 40.7484] },
          properties: { name: 'Empire State Building', city: 'New York', country: 'United States' },
        },
      ],
    });
    expect(places).toEqual([
      {
        label: 'Empire State Building, New York, United States',
        lat: 40.7484,
        lon: -73.9857,
      },
    ]);
  });

  it('builds an OpenStreetMap embed URL for a marker', () => {
    const url = osmEmbedUrl(40.75, -73.98);
    expect(url).toContain('openstreetmap.org/export/embed.html');
    expect(url).toContain('marker=');
  });
});
