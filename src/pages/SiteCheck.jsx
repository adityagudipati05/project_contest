import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import { analyzeSite, parseCoordinates } from "../services/api";
import { Alert, Spinner, Card, Button, Row, Col } from "react-bootstrap";
import { loadGISLayers } from "../services/gisService";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Component to center map
function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

export default function SiteCheck() {
  const [coordinates, setCoordinates] = useState("");
  const [radius, setRadius] = useState("2");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [mapCenter, setMapCenter] = useState([17.3850, 78.4867]); // Default: Hyderabad
  const [mapZoom, setMapZoom] = useState(13);
  const [gisLayers, setGisLayers] = useState(null);
  const [imageLoading, setImageLoading] = useState({ before: false, after: false });

  useEffect(() => {
    // Load GIS layers on mount
    loadGISLayers().then(setGisLayers).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    
    if (!coordinates.trim()) {
      setError("Please enter coordinates");
      return;
    }

    const { lat, lng } = parseCoordinates(coordinates);
    if (!lat || !lng) {
      setError("Invalid coordinates format. Use: lat,lng (e.g., 17.3850, 78.4867)");
      return;
    }

    setLoading(true);
    setMapCenter([lat, lng]);
    setMapZoom(Math.max(12, 15 - parseFloat(radius || 2)));

    try {
      const analysisResult = await analyzeSite(coordinates, radius);
      setResult(analysisResult);
      
      if (analysisResult.hasChange && analysisResult.sites) {
        // Center on first detected site if any
        if (analysisResult.sites.length > 0) {
          const firstSite = analysisResult.sites[0];
          setMapCenter([firstSite.coordinates.lat, firstSite.coordinates.lng]);
        }
      }
    } catch (err) {
      setError(err.message || "Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel) => {
    switch (riskLevel) {
      case "HIGH": return "#dc3545";
      case "MEDIUM": return "#ffc107";
      case "LOW": return "#28a745";
      default: return "#6c757d";
    }
  };

  return (
    <div className="container-fluid py-4">
      <div className="row">
        <div className="col-12 col-lg-4 mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <h4 className="mb-0">🛰 Satellite Site Check</h4>
            </Card.Header>
            <Card.Body>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Coordinates</label>
            <input
              type="text"
                    placeholder="lat, lng (e.g., 17.3850, 78.4867)"
              value={coordinates}
              onChange={(e) => setCoordinates(e.target.value)}
              className="form-control"
                    required
                  />
                  <small className="text-muted">
                    Enter coordinates within Hyderabad region
                  </small>
                </div>
                
                <div className="mb-3">
                  <label className="form-label">Radius (km)</label>
            <input
              type="number"
                    placeholder="2"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              className="form-control"
                    min="0.5"
                    max="10"
                    step="0.5"
                  />
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  className="w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Analyzing...
                    </>
                  ) : (
                    "🔍 Check Site"
                  )}
                </Button>
          </form>

              {error && (
                <Alert variant="danger" className="mt-3">
                  {error}
                </Alert>
              )}

              {result && (
                <div className="mt-4">
                  {result.method && (
                    <Alert variant="info" className="mb-2">
                      <small>
                        <strong>🔬 Detection Method:</strong> {result.method}
                        {result.method.includes('UNet') && result.changeRegions && (
                          <span> • {result.changeRegions} change regions detected</span>
                        )}
                        {result.method.includes('UNet') && result.buildingsDetected && (
                          <span> • {result.buildingsDetected} buildings identified</span>
                        )}
                      </small>
                    </Alert>
                  )}
                  {(imageLoading.before || imageLoading.after) && (
                    <Alert variant="info" className="mb-2">
                      <small>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Loading satellite imagery from NASA GIBS / Esri...
                      </small>
                    </Alert>
                  )}
                  {result.hasChange ? (
                    <>
                      <Alert variant="warning" className="mb-3">
                        <strong>⚠️ Changes Detected!</strong>
                        <br />
                        Found {result.sites.length} potential construction site(s)
                      </Alert>
                      
                      <div className="mb-3">
                        <h6>Detected Sites:</h6>
                        {result.sites.map((site, idx) => (
                          <Card key={idx} className="mb-2">
                            <Card.Body className="p-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <strong>{site.type}</strong>
                                  <br />
                                  <small className="text-muted">
                                    {site.district} • {Math.round(site.area)}m²
                                  </small>
                                </div>
                                <span
                                  className={`badge bg-${site.riskLevel === 'HIGH' ? 'danger' : site.riskLevel === 'MEDIUM' ? 'warning' : 'success'}`}
                                >
                                  {site.riskLevel}
                                </span>
                              </div>
                              {site.violations && site.violations.length > 0 && (
                                <div className="mt-2">
                                  <small>
                                    <strong>Violations:</strong> {site.violations.map(v => v.type).join(", ")}
                                  </small>
                                </div>
                              )}
                            </Card.Body>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Alert variant="success">
                      ✅ No significant construction changes detected
                      <br />
                      <small>Confidence: {(result.confidence * 100).toFixed(1)}%</small>
                    </Alert>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </div>

        <div className="col-12 col-lg-8">
          <Card className="shadow-sm" style={{ height: "600px" }}>
            <Card.Body className="p-0 position-relative">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <MapCenter center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; Esri'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                />
                
                {/* Search area circle */}
                {coordinates && !loading && (() => {
                  const { lat, lng } = parseCoordinates(coordinates);
                  if (lat && lng) {
                    return (
                      <Circle
                        center={[lat, lng]}
                        radius={parseFloat(radius || 2) * 1000}
                        pathOptions={{
                          color: "#007bff",
                          fillColor: "#007bff",
                          fillOpacity: 0.1,
                          weight: 2
                        }}
                      />
                    );
                  }
                  return null;
                })()}

                {/* Detected sites markers */}
                {result?.sites?.map((site, idx) => (
                  <Marker
                    key={idx}
                    position={[site.coordinates.lat, site.coordinates.lng]}
                  >
                    <Popup>
                      <div>
                        <strong>{site.type}</strong>
                        <br />
                        Risk: <span style={{ color: getRiskColor(site.riskLevel) }}>
                          {site.riskLevel}
                        </span>
                        <br />
                        District: {site.district}
                        <br />
                        Area: {Math.round(site.area)}m²
                        {site.violations && site.violations.length > 0 && (
                          <>
                            <br />
                            <small>
                              Violations: {site.violations.map(v => v.type).join(", ")}
                            </small>
                          </>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card.Body>
          </Card>
          
          {/* Before/After Image Comparison */}
          {result && (result.beforeImage || result.afterImage) && (
            <Card className="mt-3 shadow-sm">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">🛰 Before/After Satellite Imagery Comparison</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <div className="text-center mb-2">
                      <strong>Before Image</strong>
                      <br />
                      <small className="text-muted">
                        {result.beforeImageYear ? (
                          <>
                            Historical Baseline: <strong>{result.beforeImageYear}</strong>
                            {result.yearsBack && (
                              <span> (~{result.yearsBack} years ago)</span>
                            )}
                          </>
                        ) : (
                          result.beforeImageDate ? 
                            new Date(result.beforeImageDate).toLocaleDateString() : 
                            "Historical (2006)"
                        )}
                      </small>
                    </div>
                    {result.beforeImage ? (
                      <div className="border rounded overflow-hidden position-relative" style={{ height: "300px" }}>
                        {imageLoading.before && (
                          <div className="position-absolute top-50 start-50 translate-middle">
                            <Spinner animation="border" variant="primary" />
                          </div>
                        )}
                        <img
                          src={result.beforeImage}
                          alt="Before - Historical Satellite Image"
                          className="img-fluid w-100 h-100"
                          style={{ objectFit: "cover", opacity: imageLoading.before ? 0.5 : 1, minHeight: "300px" }}
                          onLoad={(e) => {
                            console.log('✅ Before image loaded successfully');
                            setImageLoading(prev => ({ ...prev, before: false }));
                          }}
                          onLoadStart={() => {
                            console.log('🔄 Loading before image...');
                            setImageLoading(prev => ({ ...prev, before: true }));
                          }}
                          onError={(e) => {
                            console.error('❌ Before image failed to load');
                            setImageLoading(prev => ({ ...prev, before: false }));
                            // Try alternative: show a test image
                            if (e.target.src && !e.target.src.includes('placeholder')) {
                              e.target.style.backgroundColor = '#f0f0f0';
                              e.target.style.display = 'flex';
                              e.target.style.alignItems = 'center';
                              e.target.style.justifyContent = 'center';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border rounded d-flex align-items-center justify-content-center bg-light" style={{ height: "300px" }}>
                        <div className="text-center">
                          <Spinner animation="border" className="mb-2" />
                          <p className="text-muted mb-0">Loading historical imagery...</p>
                        </div>
                      </div>
                    )}
                  </Col>
                  <Col md={6}>
                    <div className="text-center mb-2">
                      <strong>After Image</strong>
                      <br />
                      <small className="text-muted">
                        Current ({result.analysisDate ? new Date(result.analysisDate).toLocaleDateString() : "Today"})
                      </small>
                    </div>
                    {result.afterImage ? (
                      <div className="border rounded overflow-hidden position-relative" style={{ height: "300px" }}>
                        {imageLoading.after && (
                          <div className="position-absolute top-50 start-50 translate-middle">
                            <Spinner animation="border" variant="primary" />
                          </div>
                        )}
                        <img
                          src={result.afterImage}
                          alt="After - Current Satellite Image"
                          className="img-fluid w-100 h-100"
                          style={{ objectFit: "cover", opacity: imageLoading.after ? 0.5 : 1, minHeight: "300px" }}
                          onLoad={(e) => {
                            console.log('✅ After image loaded successfully');
                            setImageLoading(prev => ({ ...prev, after: false }));
                          }}
                          onLoadStart={() => {
                            console.log('🔄 Loading after image...');
                            setImageLoading(prev => ({ ...prev, after: true }));
                          }}
                          onError={(e) => {
                            console.error('❌ After image failed to load');
                            setImageLoading(prev => ({ ...prev, after: false }));
                            if (e.target.src && !e.target.src.includes('placeholder')) {
                              e.target.style.backgroundColor = '#f0f0f0';
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="border rounded d-flex align-items-center justify-content-center bg-light" style={{ height: "300px" }}>
                        <div className="text-center">
                          <Spinner animation="border" className="mb-2" />
                          <p className="text-muted mb-0">Loading current imagery...</p>
                        </div>
          </div>
                    )}
                  </Col>
                </Row>
                <Alert variant="info" className="mt-3 mb-0">
                  <small>
                    <strong>Analysis Note:</strong> These satellite images compare the area from the historical baseline ({result.beforeImageYear || '2006'}) with current imagery. 
                    This {result.yearsBack || '18+'} year comparison period provides maximum accuracy in detecting illegal constructions and encroachments. 
                    The AI change detection system analyzes these images to identify new structures.
                  </small>
                </Alert>
              </Card.Body>
            </Card>
          )}

          {result?.hasChange && result.sites && (
            <Card className="mt-3 shadow-sm">
              <Card.Body>
                <h6>📊 Analysis Summary</h6>
                <Row>
                  <Col md={6}>
                    <p><strong>Analysis Date:</strong> {new Date(result.analysisDate).toLocaleString()}</p>
                    <p><strong>Sites Detected:</strong> {result.sites.length}</p>
                    <p>
                      <strong>Risk Breakdown:</strong>
                      <br />
                      HIGH: {result.sites.filter(s => s.riskLevel === 'HIGH').length}
                      {" | "}
                      MEDIUM: {result.sites.filter(s => s.riskLevel === 'MEDIUM').length}
                      {" | "}
                      LOW: {result.sites.filter(s => s.riskLevel === 'LOW').length}
                    </p>
                  </Col>
                  <Col md={6}>
                    <Button
                      variant="outline-primary"
                      onClick={() => window.location.href = "/dashboard"}
                    >
                      View All Sites in Dashboard
                    </Button>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}