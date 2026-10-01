/**
 * Geometry and Distance utilities for RouteMind AI
 */

export function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

// Generate realistic polyline coordinates between origin and destination with natural curves
export function generateCurvedPath(startLat, startLng, endLat, endLng, curveOffset = 0, numPoints = 25) {
  const points = [];
  // Midpoint
  const midLat = (startLat + endLat) / 2;
  const midLng = (startLng + endLng) / 2;

  // Vector perpendicular
  const dx = endLng - startLng;
  const dy = endLat - startLat;
  const normalLat = -dx * curveOffset;
  const normalLng = dy * curveOffset;

  const controlLat = midLat + normalLat;
  const controlLng = midLng + normalLng;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    // Quadratic Bezier interpolation
    const lat = (1 - t) * (1 - t) * startLat + 2 * (1 - t) * t * controlLat + t * t * endLat;
    const lng = (1 - t) * (1 - t) * startLng + 2 * (1 - t) * t * controlLng + t * t * endLng;
    // Add small realistic micro-wiggles to mimic roads
    const jitterLat = (Math.sin(i * 1.5) * 0.003) * (i > 0 && i < numPoints ? 1 : 0);
    const jitterLng = (Math.cos(i * 1.8) * 0.003) * (i > 0 && i < numPoints ? 1 : 0);

    points.push([parseFloat((lat + jitterLat).toFixed(6)), parseFloat((lng + jitterLng).toFixed(6))]);
  }

  return points;
}

export function formatMinutesToTimeStr(mins) {
  const hours = Math.floor(mins / 60);
  const m = mins % 60;
  if (hours === 0) return `${m} min`;
  return `${hours} hr ${m > 0 ? `${m} min` : ''}`.trim();
}

export function formatTimeWithAMPM(date) {
  const d = new Date(date);
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}
