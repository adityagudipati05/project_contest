# MapTiler Integration Setup Guide

## Overview

The system now integrates with **MapTiler's Hyderabad satellite datasets** for improved accuracy:
- **Satellite 2016 dataset**: For historical imagery (2006 baseline comparison)
- **Satellite Highres dataset**: For current high-resolution imagery

Reference: https://www.maptiler.com/on-prem-datasets/dataset/osm/asia/india/hyderabad/

## Setup Instructions

### Option 1: Using MapTiler API Key (Recommended)

1. **Get a MapTiler API Key**:
   - Sign up at https://www.maptiler.com/
   - Free tier includes 100,000 requests/month
   - Go to your account dashboard to get your API key

2. **Add API Key to Environment**:
   - Create a `.env` file in project root:
   ```
   REACT_APP_MAPTILER_KEY=your_api_key_here
   ```

3. **Restart Development Server**:
   ```bash
   npm run dev
   ```

### Option 2: Self-Hosted MapTiler Server

If you have MapTiler Server running:
- Update `MAPTILER_API_KEY` or server URL in `src/services/satelliteService.js`
- Use your self-hosted tile server endpoint

### Option 3: Use Without API Key (Limited)

The system will attempt to use MapTiler tiles without a key, but:
- May have rate limits
- Some layers may not be accessible
- Falls back to Esri World Imagery automatically

## Dataset Details

### Satellite 2016 Dataset
- **Coverage**: Hyderabad, India
- **Resolution**: High-resolution satellite imagery from 2016
- **Use Case**: Historical baseline comparison (2006-2016)
- **Format**: Raster tiles (JPG/PNG)

### Satellite Highres Dataset
- **Coverage**: Hyderabad, India  
- **Resolution**: Latest high-resolution satellite imagery
- **Use Case**: Current imagery for change detection
- **Format**: Raster tiles (JPG/PNG)

## How It Works

1. **Automatic Detection**: System detects if coordinates are in Hyderabad region (17.0-18.0°N, 77.5-79.0°E)

2. **Historical Imagery**: 
   - Uses Satellite 2016 dataset for dates ≤ 2016
   - Perfect for 2006 baseline comparison

3. **Current Imagery**:
   - Uses Satellite Highres dataset for current dates
   - Latest high-resolution imagery

4. **Fallback**: If MapTiler unavailable, automatically uses Esri World Imagery

## Verification

Check browser console for:
- `🛰️ Using MapTiler Satellite 2016 for historical imagery` - Historical dataset active
- `🛰️ Using MapTiler Satellite Highres for current imagery` - Current dataset active
- `✅ MapTiler composite complete: X tiles loaded` - Success
- `📍 Location outside Hyderabad` - Using Esri fallback

## API Usage

MapTiler tile format:
```
https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key={YOUR_KEY}
```

For Hyderabad-specific datasets, the system automatically:
- Detects Hyderabad region coordinates
- Selects appropriate dataset (2016 vs Highres)
- Composites multiple tiles into centered image
- Falls back gracefully if tiles unavailable

## Benefits

✅ **Better Accuracy**: Hyderabad-specific datasets with precise coverage
✅ **Historical Data**: 2016 dataset for historical comparisons
✅ **High Resolution**: High-res current imagery for detailed analysis
✅ **Automatic**: Works seamlessly with existing system
✅ **Fallback**: Always works even without MapTiler access

---

**Note**: MapTiler integration enhances accuracy specifically for Hyderabad region. For other locations, the system uses Esri World Imagery as fallback.
