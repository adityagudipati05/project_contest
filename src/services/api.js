/**
 * Main API Service
 * Coordinates satellite imagery, change detection, and GIS validation
 */

import { getCurrentImagery, getHistoricalImagery, isWithinHyderabadRegion } from './satelliteService';
import { loadGISLayers, checkProtectedZone, calculateRiskLevel, getDistrict } from './gisService';
import { detectChanges, processDetectedSite } from './changeDetectionService';

// Store detected sites in localStorage (in production, use backend API)
const STORAGE_KEY = 'detected_illegal_sites';

/**
 * Perform complete site analysis
 */
export const analyzeSite = async (coordinates, radius, historicalDate = null) => {
  const { lat, lng } = parseCoordinates(coordinates);
  
  // Validate coordinates
  if (!lat || !lng) {
    throw new Error('Invalid coordinates format. Use: lat,lng');
  }
  
  // Check if within Hyderabad region
  if (!isWithinHyderabadRegion(lat, lng)) {
    throw new Error('Coordinates must be within Hyderabad region (Hyderabad, Rangareddy, Sangareddy, Vikarabad, Medchal)');
  }
  
  // Load GIS layers
  const gisLayers = await loadGISLayers();
  
  // Get imagery - using 2006 as baseline for maximum accuracy
  const [beforeImage, afterImage] = await Promise.all([
    getHistoricalImagery(lat, lng, historicalDate, 2006), // Baseline year 2006
    getCurrentImagery(lat, lng)
  ]);
  
  // Detect changes
  const changeDetection = await detectChanges(beforeImage, afterImage, { lat, lng });
  
  if (!changeDetection.hasChange) {
    return {
      hasChange: false,
      message: 'No significant construction changes detected',
      confidence: changeDetection.confidence,
      beforeImage: beforeImage.url,
      afterImage: afterImage.url,
      beforeImageDate: beforeImage.date,
      beforeImageYear: beforeImage.year,
      yearsBack: beforeImage.yearsBack,
      analysisDate: changeDetection.analysisDate || new Date().toISOString()
    };
  }
  
  // Process each detected change with GIS validation
  const processedSites = await Promise.all(
    changeDetection.changes.map(change => processDetectedSite(change, gisLayers))
  );
  
  // Save to storage
  const existingSites = getDetectedSites();
  const updatedSites = [...existingSites, ...processedSites];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSites));
  
  return {
    hasChange: true,
    sites: processedSites,
    beforeImage: beforeImage.url,
    afterImage: afterImage.url,
    beforeImageDate: beforeImage.date,
    beforeImageYear: beforeImage.year,
    yearsBack: beforeImage.yearsBack,
    analysisDate: changeDetection.analysisDate
  };
};

/**
 * Get all detected sites
 */
export const getDetectedSites = () => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading detected sites:', error);
    return [];
  }
};

/**
 * Get site by ID
 */
export const getSiteById = (id) => {
  const sites = getDetectedSites();
  return sites.find(site => site.id === id);
};

/**
 * Update site status
 */
export const updateSiteStatus = (id, status, remarks = '') => {
  const sites = getDetectedSites();
  const index = sites.findIndex(site => site.id === id);
  
  if (index === -1) return null;
  
  sites[index] = {
    ...sites[index],
    status,
    remarks,
    updatedDate: new Date().toISOString()
  };
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
  return sites[index];
};

/**
 * Delete site
 */
export const deleteSite = (id) => {
  const sites = getDetectedSites();
  const filtered = sites.filter(site => site.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
};

/**
 * Filter sites by criteria
 */
export const filterSites = (filters = {}) => {
  let sites = getDetectedSites();
  
  if (filters.riskLevel) {
    sites = sites.filter(s => s.riskLevel === filters.riskLevel);
  }
  
  if (filters.district) {
    sites = sites.filter(s => s.district === filters.district);
  }
  
  if (filters.status) {
    sites = sites.filter(s => s.status === filters.status);
  }
  
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    sites = sites.filter(s => 
      s.type?.toLowerCase().includes(searchLower) ||
      s.district?.toLowerCase().includes(searchLower) ||
      s.violations?.some(v => v.type?.toLowerCase().includes(searchLower))
    );
  }
  
  return sites;
};

/**
 * Get statistics
 */
export const getStatistics = () => {
  const sites = getDetectedSites();
  
  return {
    total: sites.length,
    byRiskLevel: {
      HIGH: sites.filter(s => s.riskLevel === 'HIGH').length,
      MEDIUM: sites.filter(s => s.riskLevel === 'MEDIUM').length,
      LOW: sites.filter(s => s.riskLevel === 'LOW').length
    },
    byStatus: {
      PENDING: sites.filter(s => s.status === 'PENDING').length,
      UNDER_INVESTIGATION: sites.filter(s => s.status === 'UNDER_INVESTIGATION').length,
      ACTION_TAKEN: sites.filter(s => s.status === 'ACTION_TAKEN').length,
      RESOLVED: sites.filter(s => s.status === 'RESOLVED').length
    },
    byDistrict: sites.reduce((acc, site) => {
      acc[site.district] = (acc[site.district] || 0) + 1;
      return acc;
    }, {})
  };
};

/**
 * Parse coordinates from string
 */
export const parseCoordinates = (coordsString) => {
  if (!coordsString) return { lat: null, lng: null };
  
  const parts = coordsString.split(',').map(s => s.trim());
  if (parts.length !== 2) return { lat: null, lng: null };
  
  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);
  
  if (isNaN(lat) || isNaN(lng)) return { lat: null, lng: null };
  
  return { lat, lng };
};
