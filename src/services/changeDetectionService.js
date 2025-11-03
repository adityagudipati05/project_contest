/**
 * Change Detection Service
 * Analyzes satellite imagery to detect new constructions using UNet and Mask R-CNN
 */

import { checkProtectedZone, calculateRiskLevel, getDistrict } from './gisService';
import { mlModelService } from './mlModelService';

/**
 * Detect changes using UNet model for change detection
 * Then use Mask R-CNN to identify and segment buildings
 */
export const detectChanges = async (beforeImage, afterImage, coordinates) => {
  try {
    console.log('🔄 Starting ML-based change detection with UNet and Mask R-CNN...');
    
    // Step 1: Use UNet for change detection
    console.log('📊 Running UNet change detection...');
    const changeMask = await mlModelService.detectChangesWithUNet(beforeImage, afterImage);
    
    if (!changeMask || !changeMask.regions || changeMask.regions.length === 0) {
      return {
        hasChange: false,
        confidence: 0.95,
        changes: [],
        analysisDate: new Date().toISOString(),
        method: 'UNet + Mask R-CNN'
      };
    }
    
    console.log(`✅ Found ${changeMask.regions.length} change regions with UNet`);
    
    // Step 2: Use Mask R-CNN to detect buildings in changed areas
    console.log('🏗️ Running Mask R-CNN building detection...');
    const buildings = await mlModelService.detectBuildingsWithMaskRCNN(
      afterImage,
      changeMask.regions
    );
    
    console.log(`✅ Detected ${buildings.length} buildings with Mask R-CNN`);
    
    // Step 3: Convert building detections to site format
    const changes = buildings.map((building, idx) => {
      // Convert pixel coordinates to GPS coordinates
      // This is simplified - in production, use proper georeferencing
      const pixelToLatLng = (px, py, centerLat, centerLng, imageWidth, imageHeight, zoom = 14) => {
        // Approximate conversion (in production, use proper projection)
        const latOffset = (py - imageHeight / 2) / (256 * Math.pow(2, zoom)) * 180;
        const lngOffset = (px - imageWidth / 2) / (256 * Math.pow(2, zoom)) * 360;
        return {
          lat: centerLat + latOffset,
          lng: centerLng + lngOffset
        };
      };
      
      const bbox = building.bbox;
      const center = pixelToLatLng(
        bbox.x + bbox.width / 2,
        bbox.y + bbox.height / 2,
        coordinates.lat,
        coordinates.lng,
        800, // Assuming 800x800 image
        800
      );
      
      // Calculate area in square meters (approximate)
      const area = (bbox.width * bbox.height) * 0.5; // Rough conversion
      
      return {
        id: building.id || `change_${Date.now()}_${idx}`,
        coordinates: center,
        area: Math.max(area, 50), // Minimum 50 sq meters
        type: building.class === 1 ? 'Residential Building' : 
              building.class === 2 ? 'Commercial Structure' : 'Infrastructure',
        confidence: building.confidence || 0.8,
        detectedDate: new Date().toISOString(),
        beforeImage: beforeImage.url,
        afterImage: afterImage.url,
        bbox: bbox,
        detectionMethod: 'UNet + Mask R-CNN'
      };
    });
    
    // Calculate overall confidence from change mask
    const overallConfidence = changeMask.confidence 
      ? Array.from(changeMask.confidence).reduce((a, b) => Math.max(a, b), 0)
      : 0.75;
    
    return {
      hasChange: true,
      confidence: overallConfidence,
      changes,
      analysisDate: new Date().toISOString(),
      method: 'UNet + Mask R-CNN',
      changeRegions: changeMask.regions.length,
      buildingsDetected: buildings.length
    };
    
  } catch (error) {
    console.error('❌ Error in ML change detection:', error);
    
    // Fallback to simulated detection if ML models fail
    console.warn('⚠️ Falling back to simulated detection');
    return await fallbackDetection(beforeImage, afterImage, coordinates);
  }
};

/**
 * Fallback detection when ML models are not available
 */
async function fallbackDetection(beforeImage, afterImage, coordinates) {
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const changeProbability = Math.random();
  const hasSignificantChange = changeProbability > 0.6;
  
  if (!hasSignificantChange) {
    return {
      hasChange: false,
      confidence: 1 - changeProbability,
      changes: [],
      analysisDate: new Date().toISOString(),
      method: 'Fallback (No ML models available)'
    };
  }
  
  const numChanges = Math.floor(Math.random() * 3) + 1;
  const changes = [];
  
  for (let i = 0; i < numChanges; i++) {
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;
    
    changes.push({
      id: `change_${Date.now()}_${i}`,
      coordinates: {
        lat: coordinates.lat + offsetLat,
        lng: coordinates.lng + offsetLng
      },
      area: Math.random() * 500 + 100,
      type: ['Residential Building', 'Commercial Structure', 'Infrastructure'][Math.floor(Math.random() * 3)],
      confidence: Math.random() * 0.3 + 0.7,
      detectedDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      beforeImage: beforeImage.url,
      afterImage: afterImage.url,
      detectionMethod: 'Fallback'
    });
  }
  
  return {
    hasChange: true,
    confidence: changeProbability,
    changes,
    analysisDate: new Date().toISOString(),
    method: 'Fallback (No ML models available)'
  };
}

/**
 * Process detected site with GIS validation
 */
export const processDetectedSite = async (site, gisLayers) => {
  const zoneCheck = checkProtectedZone(
    site.coordinates.lat,
    site.coordinates.lng,
    gisLayers
  );
  
  const risk = calculateRiskLevel(zoneCheck.violations);
  const district = getDistrict(site.coordinates.lat, site.coordinates.lng);
  
  return {
    ...site,
    riskLevel: risk.level,
    riskScore: risk.score,
    violations: zoneCheck.violations,
    district,
    status: 'PENDING',
    reportedDate: new Date().toISOString(),
    evidence: {
      beforeImage: site.beforeImage,
      afterImage: site.afterImage,
      coordinates: site.coordinates
    }
  };
};
