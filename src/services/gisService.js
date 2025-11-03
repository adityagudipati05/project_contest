/**
 * GIS Data Service
 * Loads and processes GeoJSON data for spatial analysis
 */

import * as turf from '@turf/turf';

/**
 * Load GeoJSON file
 */
export const loadGeoJSON = async (filePath) => {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to load ${filePath}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error loading GeoJSON from ${filePath}:`, error);
    return null;
  }
};

/**
 * Load all critical GIS layers
 * Tries multiple paths to handle different deployment scenarios
 */
export const loadGISLayers = async () => {
  // Try different possible paths
  const basePaths = [
    '/hyderabad-open-gis-data-master',
    '/GENERAL LAYERS',
    './hyderabad-open-gis-data-master'
  ];
  
  const loadWithFallback = async (relativePath) => {
    for (const basePath of basePaths) {
      try {
        const data = await loadGeoJSON(`${basePath}/${relativePath}`);
        if (data) return data;
      } catch (e) {
        // Try next path
      }
    }
    // Return empty feature collection if all paths fail
    return { type: 'FeatureCollection', features: [] };
  };
  
  const layers = {
    waterbodies: await loadWithFallback('GENERAL LAYERS/Waterbodies/Waterbodies.geojson'),
    waterways: await loadWithFallback('GENERAL LAYERS/Waterways/Hyderabad_Waterways.geojson'),
    vulnerableLocalities: await loadWithFallback('3. Disaster Resilience/3.1 Flooding Risk Management/Vulnerable Localities.geojson'),
    greenCover: await loadWithFallback('6. Environment/6.1 Public Parks/GHMC _ HMDA Parks.geojson'),
    channels: await loadWithFallback('3. Disaster Resilience/3.1 Flooding Risk Management/Channels_Strahler order 3.geojson'),
    contours: await loadWithFallback('3. Disaster Resilience/3.1 Flooding Risk Management/Hyderabad Countours.geojson')
  };
  
  return layers;
};

/**
 * Check if a point is within a protected zone
 */
export const checkProtectedZone = (lat, lng, layers) => {
  const point = turf.point([lng, lat]);
  const results = {
    inWaterbody: false,
    inWaterway: false,
    inVulnerableZone: false,
    inGreenBelt: false,
    nearChannel: false,
    violations: []
  };
  
  // Check waterbodies
  if (layers.waterbodies) {
    for (const feature of layers.waterbodies.features || []) {
      if (turf.booleanPointInPolygon(point, feature)) {
        results.inWaterbody = true;
        results.violations.push({
          type: 'Waterbody Encroachment',
          feature: feature.properties?.name || 'Unnamed Waterbody',
          severity: 'HIGH'
        });
        break;
      }
    }
  }
  
  // Check waterways
  if (layers.waterways) {
    for (const feature of layers.waterways.features || []) {
      const buffer = turf.buffer(feature, 50, { units: 'meters' });
      if (turf.booleanPointInPolygon(point, buffer)) {
        results.inWaterway = true;
        results.violations.push({
          type: 'Waterway Buffer Violation',
          feature: feature.properties?.name || 'Waterway',
          severity: 'HIGH',
          distance: 'within 50m buffer'
        });
        break;
      }
    }
  }
  
  // Check vulnerable localities (flood risk zones)
  if (layers.vulnerableLocalities) {
    for (const feature of layers.vulnerableLocalities.features || []) {
      if (turf.booleanPointInPolygon(point, feature)) {
        results.inVulnerableZone = true;
        results.violations.push({
          type: 'Flood Risk Zone',
          feature: feature.properties?.name || 'Vulnerable Locality',
          severity: 'HIGH'
        });
        break;
      }
    }
  }
  
  // Check green belts/parks
  if (layers.greenCover) {
    for (const feature of layers.greenCover.features || []) {
      if (turf.booleanPointInPolygon(point, feature)) {
        results.inGreenBelt = true;
        results.violations.push({
          type: 'Green Belt Encroachment',
          feature: feature.properties?.name || 'Park/Green Space',
          severity: 'MEDIUM'
        });
        break;
      }
    }
  }
  
  // Check proximity to channels (within 100m)
  if (layers.channels) {
    for (const feature of layers.channels.features || []) {
      const distance = turf.pointToLineDistance(point, feature, { units: 'meters' });
      if (distance < 100) {
        results.nearChannel = true;
        results.violations.push({
          type: 'Channel Proximity',
          feature: 'Drainage Channel',
          severity: distance < 50 ? 'HIGH' : 'MEDIUM',
          distance: `${Math.round(distance)}m`
        });
        break;
      }
    }
  }
  
  return results;
};

/**
 * Calculate risk level based on violations
 */
export const calculateRiskLevel = (violations) => {
  if (violations.length === 0) {
    return { level: 'LOW', score: 0 };
  }
  
  let score = 0;
  violations.forEach(v => {
    if (v.severity === 'HIGH') score += 10;
    else if (v.severity === 'MEDIUM') score += 5;
    else score += 2;
  });
  
  if (score >= 10) return { level: 'HIGH', score };
  if (score >= 5) return { level: 'MEDIUM', score };
  return { level: 'LOW', score };
};

/**
 * Get district name from coordinates
 */
export const getDistrict = (lat, lng) => {
  // Approximate district boundaries
  // Hyderabad: 17.3-17.5, 78.4-78.6
  // Rangareddy: 17.2-17.6, 78.2-78.8
  // Sangareddy: 17.6-18.0, 77.8-78.2
  // Vikarabad: 17.2-17.8, 77.5-78.2
  // Medchal: 17.5-18.0, 78.4-78.8
  
  if (lat >= 17.3 && lat <= 17.5 && lng >= 78.4 && lng <= 78.6) return 'Hyderabad';
  if (lat >= 17.5 && lat <= 18.0 && lng >= 78.4 && lng <= 78.8) return 'Medchal';
  if (lat >= 17.6 && lat <= 18.0 && lng >= 77.8 && lng <= 78.2) return 'Sangareddy';
  if (lat >= 17.2 && lat <= 17.8 && lng >= 77.5 && lng <= 78.2) return 'Vikarabad';
  if (lat >= 17.2 && lat <= 17.6 && lng >= 78.2 && lng <= 78.8) return 'Rangareddy';
  
  return 'Unknown';
};
