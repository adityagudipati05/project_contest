import React, { useState, useEffect } from "react";
import { Card, Row, Col, Badge, Button, Form, Table, Modal, InputGroup } from "react-bootstrap";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { getDetectedSites, filterSites, getStatistics, updateSiteStatus, deleteSite } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Custom marker icons based on risk
const createRiskIcon = (riskLevel) => {
  const color = riskLevel === 'HIGH' ? '#dc3545' : riskLevel === 'MEDIUM' ? '#ffc107' : '#28a745';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
};

function MapCenter({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  return null;
}

function Dashboard() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [filters, setFilters] = useState({
    riskLevel: '',
    district: '',
    status: '',
    search: ''
  });
  const [selectedSite, setSelectedSite] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [mapCenter] = useState([17.3850, 78.4867]);
  const [mapZoom] = useState(11);

  useEffect(() => {
    loadSites();
  }, [filters]);

  const loadSites = () => {
    const filtered = filterSites(filters);
    setSites(filtered);
    setStatistics(getStatistics());
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleStatusUpdate = (siteId, newStatus, remarks) => {
    updateSiteStatus(siteId, newStatus, remarks);
    loadSites();
    setShowModal(false);
  };

  const handleDelete = (siteId) => {
    if (window.confirm('Are you sure you want to delete this site?')) {
      deleteSite(siteId);
      loadSites();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock size={16} className="text-warning" />;
      case 'UNDER_INVESTIGATION': return <AlertTriangle size={16} className="text-info" />;
      case 'ACTION_TAKEN': return <CheckCircle size={16} className="text-primary" />;
      case 'RESOLVED': return <CheckCircle size={16} className="text-success" />;
      default: return <Clock size={16} />;
    }
  };

  const getRiskBadgeVariant = (risk) => {
    return risk === 'HIGH' ? 'danger' : risk === 'MEDIUM' ? 'warning' : 'success';
  };

  return (
    <div className="container-fluid py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">📊 Dashboard</h2>
          <p className="text-muted">Monitor and manage detected illegal construction sites</p>
        </Col>
      </Row>

      {/* Statistics Cards */}
      {statistics && (
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-2">Total Sites</h6>
                <h2 className="fw-bold mb-0">{statistics.total}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-2">High Risk</h6>
                <h2 className="fw-bold text-danger mb-0">{statistics.byRiskLevel.HIGH}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-2">Pending Action</h6>
                <h2 className="fw-bold text-warning mb-0">{statistics.byStatus.PENDING}</h2>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <h6 className="text-muted mb-2">Resolved</h6>
                <h2 className="fw-bold text-success mb-0">{statistics.byStatus.RESOLVED || 0}</h2>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* Filters and Site List */}
        <Col lg={5}>
          <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Filters & Search</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Risk Level</Form.Label>
                    <Form.Select
                      value={filters.riskLevel}
                      onChange={(e) => handleFilterChange('riskLevel', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="HIGH">High</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="LOW">Low</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Status</Form.Label>
                    <Form.Select
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="PENDING">Pending</option>
                      <option value="UNDER_INVESTIGATION">Under Investigation</option>
                      <option value="ACTION_TAKEN">Action Taken</option>
                      <option value="RESOLVED">Resolved</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Row className="g-2 mb-3">
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>District</Form.Label>
                    <Form.Select
                      value={filters.district}
                      onChange={(e) => handleFilterChange('district', e.target.value)}
                    >
                      <option value="">All Districts</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Rangareddy">Rangareddy</option>
                      <option value="Sangareddy">Sangareddy</option>
                      <option value="Vikarabad">Vikarabad</option>
                      <option value="Medchal">Medchal</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group>
                    <Form.Label>Search</Form.Label>
                    <InputGroup>
                      <InputGroup.Text><Search size={16} /></InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search sites..."
                        value={filters.search}
                        onChange={(e) => handleFilterChange('search', e.target.value)}
                      />
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Sites List */}
          <Card className="shadow-sm">
            <Card.Header className="bg-light">
              <h5 className="mb-0">Detected Sites ({sites.length})</h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: "600px", overflowY: "auto" }}>
              {sites.length === 0 ? (
                <div className="text-center py-5 text-muted">
                  <p>No sites found. Try adjusting filters or check a new area.</p>
                  <Button variant="primary" onClick={() => navigate("/site-check")}>
                    Check New Site
                  </Button>
                </div>
              ) : (
                <div className="list-group">
                  {sites.map((site) => (
                    <div
                      key={site.id}
                      className="list-group-item list-group-item-action"
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setSelectedSite(site);
                        setShowModal(true);
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-grow-1">
                          <h6 className="mb-1">{site.type}</h6>
                          <small className="text-muted d-block mb-1">
                            <MapPin size={12} className="me-1" />
                            {site.district} • {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}
                          </small>
                          {site.violations && site.violations.length > 0 && (
                            <small className="text-danger d-block">
                              {site.violations.length} violation(s)
                            </small>
                          )}
                        </div>
                        <div className="text-end">
                          <Badge bg={getRiskBadgeVariant(site.riskLevel)} className="mb-1">
                            {site.riskLevel}
                          </Badge>
                          <br />
                          {getStatusIcon(site.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Map */}
        <Col lg={7}>
          <Card className="shadow-sm" style={{ height: "800px" }}>
            <Card.Body className="p-0">
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
                {sites.map((site) => (
                  <Marker
                    key={site.id}
                    position={[site.coordinates.lat, site.coordinates.lng]}
                    icon={createRiskIcon(site.riskLevel)}
                  >
                    <Popup>
                      <div>
                        <strong>{site.type}</strong>
                        <br />
                        Risk: <Badge bg={getRiskBadgeVariant(site.riskLevel)}>{site.riskLevel}</Badge>
                        <br />
                        District: {site.district}
                        <br />
                        Area: {Math.round(site.area)}m²
                        <br />
                        Status: {site.status}
                        <br />
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="mt-2"
                          onClick={() => {
                            setSelectedSite(site);
                            setShowModal(true);
                            window.document.querySelector('.leaflet-popup-close-button')?.click();
                          }}
                        >
                          View Details
                        </Button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Site Details Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Site Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedSite && (
            <>
              <Row className="mb-3">
                <Col md={6}>
                  <p><strong>Type:</strong> {selectedSite.type}</p>
                  <p><strong>District:</strong> {selectedSite.district}</p>
                  <p><strong>Coordinates:</strong> {selectedSite.coordinates.lat.toFixed(6)}, {selectedSite.coordinates.lng.toFixed(6)}</p>
                  <p><strong>Area:</strong> {Math.round(selectedSite.area)} m²</p>
                </Col>
                <Col md={6}>
                  <p><strong>Risk Level:</strong> <Badge bg={getRiskBadgeVariant(selectedSite.riskLevel)}>{selectedSite.riskLevel}</Badge></p>
                  <p><strong>Status:</strong> {getStatusIcon(selectedSite.status)} {selectedSite.status}</p>
                  <p><strong>Detected:</strong> {new Date(selectedSite.detectedDate).toLocaleDateString()}</p>
                </Col>
              </Row>

              {selectedSite.violations && selectedSite.violations.length > 0 && (
                <div className="mb-3">
                  <h6>Violations Detected:</h6>
                  <ul>
                    {selectedSite.violations.map((violation, idx) => (
                      <li key={idx}>
                        <strong>{violation.type}</strong> - {violation.feature}
                        {violation.distance && ` (${violation.distance})`}
                        <Badge bg="danger" className="ms-2">{violation.severity}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mb-3">
                <h6>Update Status:</h6>
                <Form.Select
                  defaultValue={selectedSite.status}
                  onChange={(e) => {
                    handleStatusUpdate(selectedSite.id, e.target.value, '');
                  }}
                >
                  <option value="PENDING">Pending</option>
                  <option value="UNDER_INVESTIGATION">Under Investigation</option>
                  <option value="ACTION_TAKEN">Action Taken</option>
                  <option value="RESOLVED">Resolved</option>
                </Form.Select>
              </div>

              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    navigate(`/reports?id=${selectedSite.id}`);
                    setShowModal(false);
                  }}
                >
                  View Full Report
                </Button>
                <Button
                  variant="outline-danger"
                  onClick={() => {
                    handleDelete(selectedSite.id);
                    setShowModal(false);
                  }}
                >
                  Delete Site
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}

export default Dashboard;