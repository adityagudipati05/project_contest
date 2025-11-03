# AI-UrbanVision: HYDRAA Illegal Construction Detection System

An AI-powered web application that helps Hyderabad's statutory body (HYDRAA) detect and act on illegal constructions that worsen flooding and disrupt sustainable urban growth.

## 🌟 Features

- **🛰️ AI-Powered Change Detection**: Compares old and new satellite imagery to spot newly built structures
- **🗺️ GIS Validation**: Cross-checks detected sites with GIS zoning maps to identify encroachments on:
  - Rivers and nalas (drainage channels)
  - Lakes and waterbodies
  - Green belts and parks
  - Vulnerable flood-risk zones
- **⚠️ Risk Categorization**: Automatically categorizes sites as High, Medium, or Low risk based on violations
- **📊 Interactive Dashboard**: Real-time monitoring with filters, statistics, and interactive maps
- **📄 Comprehensive Reports**: Detailed case files with GPS coordinates, before-after imagery, and evidence snapshots
- **📜 History Tracking**: Complete audit trail of all detected sites and actions taken
- **🔄 Status Management**: Update action statuses (Pending, Under Investigation, Action Taken, Resolved)

## 🏗️ Technology Stack

- **Frontend**: React 19 + Vite
- **Maps**: Leaflet + React-Leaflet
- **Geospatial**: Turf.js for spatial analysis
- **Styling**: Bootstrap 5 + React Bootstrap
- **PDF Generation**: jsPDF
- **Authentication**: Firebase (existing)
- **State Management**: React Context API

## 📦 Installation

1. Clone the repository
```bash
git clone <repository-url>
cd project-contest
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

## 🗺️ GIS Data Setup

The application uses GeoJSON data from the `hyderabad-open-gis-data-master` folder. The system automatically tries to load GIS layers from multiple paths:

- `/hyderabad-open-gis-data-master/GENERAL LAYERS/...`
- `/GENERAL LAYERS/...`
- `./hyderabad-open-gis-data-master/...`

**Note**: For production deployment, ensure GIS files are accessible. You may need to:
- Copy critical files to the `public` folder, or
- Configure your server to serve static files from the workspace root

### Required GIS Layers:
- Waterbodies (`GENERAL LAYERS/Waterbodies/Waterbodies.geojson`)
- Waterways (`GENERAL LAYERS/Waterways/Hyderabad_Waterways.geojson`)
- Vulnerable Localities (`3. Disaster Resilience/3.1 Flooding Risk Management/Vulnerable Localities.geojson`)
- Green Cover/Parks (`6. Environment/6.1 Public Parks/GHMC _ HMDA Parks.geojson`)
- Drainage Channels (`3. Disaster Resilience/3.1 Flooding Risk Management/Channels_Strahler order 3.geojson`)

## 🚀 Usage

### 1. Site Check (`/site-check`)
- Enter coordinates (lat, lng) within Hyderabad region
- Set search radius (km)
- System performs change detection analysis
- Results show detected sites with risk levels and violations

### 2. Dashboard (`/dashboard`)
- View all detected sites on interactive map
- Filter by risk level, district, status
- Update site status
- View statistics and trends

### 3. Reports (`/reports`)
- Detailed case files for each detected site
- Before/after satellite imagery comparison
- Violation details and evidence
- Download PDF reports

### 4. History (`/history`)
- Complete audit trail
- Search and filter historical data
- Quick access to reports

## 🎯 Supported Districts

- Hyderabad
- Rangareddy
- Sangareddy
- Vikarabad
- Medchal

## 🔧 Configuration

### Satellite Imagery
Currently uses Esri World Imagery (free tier). For production:
- Integrate with Sentinel Hub OGC Services
- Use Planet Labs API
- Connect to Google Earth Engine

### Change Detection
Currently simulated. For production:
- Deploy ML models (UNet, Mask R-CNN) on backend
- Use TensorFlow.js for client-side inference
- Or call dedicated ML API service

### API Integration
The services are designed to be easily extended:
- `src/services/satelliteService.js` - Satellite imagery fetching
- `src/services/gisService.js` - GIS data loading and validation
- `src/services/changeDetectionService.js` - Change detection analysis
- `src/services/api.js` - Main API coordination

## 📊 Risk Assessment Algorithm

Sites are categorized based on:
- **HIGH**: Encroachments on waterbodies, waterways (within 50m), or flood-risk zones
- **MEDIUM**: Proximity to channels (50-100m) or green belt violations
- **LOW**: No detected violations

Risk score calculation:
- HIGH violation: +10 points
- MEDIUM violation: +5 points
- LOW violation: +2 points

## 🔒 Data Storage

Currently uses browser localStorage for demo purposes. For production:
- Implement backend API
- Use Firebase Firestore or similar database
- Add user authentication and authorization

## 🛠️ Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 📝 Project Structure

```
src/
├── components/        # Reusable UI components
├── contexts/         # React contexts (Auth, Theme)
├── pages/            # Main application pages
│   ├── Home.jsx
│   ├── SiteCheck.jsx
│   ├── Dashboard.jsx
│   ├── Reports.jsx
│   └── History.jsx
├── services/         # Business logic and API services
│   ├── api.js
│   ├── satelliteService.js
│   ├── gisService.js
│   └── changeDetectionService.js
└── main.jsx          # Application entry point
```

## 🎨 UI Features

- Responsive design (mobile-friendly)
- Dark/light theme support (via ThemeContext)
- Interactive maps with custom markers
- Real-time filtering and search
- PDF report generation
- Toast notifications (via alerts)

## 🔮 Future Enhancements

- [ ] Real satellite imagery API integration
- [ ] ML model deployment for change detection
- [ ] Backend API with database
- [ ] User authentication and roles
- [ ] Email notifications for high-risk sites
- [ ] Mobile app version
- [ ] Advanced analytics and reporting
- [ ] Integration with government systems

## 📄 License

[Your License Here]

## 👥 Contributors

[Your Name/Team]

## 📧 Contact

[Your Contact Information]

---

**Built for HYDRAA - Empowering Sustainable Urban Planning** 🌱