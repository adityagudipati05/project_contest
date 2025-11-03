import React, { useState, useEffect } from "react";
import { Card, Table, Badge, Button, Form, Row, Col, InputGroup } from "react-bootstrap";
import { getDetectedSites, filterSites } from "../services/api";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin } from "lucide-react";

function History() {
  const navigate = useNavigate();
  const [sites, setSites] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    riskLevel: "",
    district: "",
    status: ""
  });

  useEffect(() => {
    loadHistory();
  }, [filters]);

  const loadHistory = () => {
    const filtered = filterSites(filters);
    // Sort by detected date (newest first)
    const sorted = filtered.sort((a, b) => 
      new Date(b.detectedDate || 0) - new Date(a.detectedDate || 0)
    );
    setSites(sorted);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const getRiskBadgeVariant = (risk) => {
    return risk === "HIGH" ? "danger" : risk === "MEDIUM" ? "warning" : "success";
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case "PENDING": return "warning";
      case "UNDER_INVESTIGATION": return "info";
      case "ACTION_TAKEN": return "primary";
      case "RESOLVED": return "success";
      default: return "secondary";
    }
  };

  return (
    <div className="container-fluid py-4">
      <Row className="mb-4">
        <Col>
          <h2 className="fw-bold">📜 History</h2>
          <p className="text-muted">View all analyzed sites and detection history</p>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="g-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text><Search size={16} /></InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Search sites..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select
                value={filters.riskLevel}
                onChange={(e) => handleFilterChange("riskLevel", e.target.value)}
              >
                <option value="">All Risk Levels</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.district}
                onChange={(e) => handleFilterChange("district", e.target.value)}
              >
                <option value="">All Districts</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Rangareddy">Rangareddy</option>
                <option value="Sangareddy">Sangareddy</option>
                <option value="Vikarabad">Vikarabad</option>
                <option value="Medchal">Medchal</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <Form.Select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="UNDER_INVESTIGATION">Under Investigation</option>
                <option value="ACTION_TAKEN">Action Taken</option>
                <option value="RESOLVED">Resolved</option>
              </Form.Select>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* History Table */}
      <Card className="shadow-sm">
        <Card.Header className="bg-light">
          <h5 className="mb-0">Detection History ({sites.length} sites)</h5>
        </Card.Header>
        <Card.Body>
          {sites.length === 0 ? (
            <div className="text-center py-5 text-muted">
              <p>No sites found in history. Try checking a new area or adjusting filters.</p>
              <Button variant="primary" onClick={() => navigate("/site-check")}>
                Check New Site
              </Button>
            </div>
          ) : (
            <Table responsive hover>
              <thead>
                <tr>
                  <th>Site ID</th>
                  <th>Type</th>
                  <th>District</th>
                  <th>Coordinates</th>
                  <th>Risk Level</th>
                  <th>Status</th>
                  <th>Detected Date</th>
                  <th>Violations</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sites.map((site) => (
                  <tr key={site.id}>
                    <td>
                      <small className="font-monospace">{site.id.substring(0, 8)}...</small>
                    </td>
                    <td>{site.type}</td>
                    <td>{site.district}</td>
                    <td>
                      <small>
                        <MapPin size={12} className="me-1" />
                        {site.coordinates.lat.toFixed(4)}, {site.coordinates.lng.toFixed(4)}
                      </small>
                    </td>
                    <td>
                      <Badge bg={getRiskBadgeVariant(site.riskLevel)}>
                        {site.riskLevel}
                      </Badge>
                    </td>
                    <td>
                      <Badge bg={getStatusBadgeVariant(site.status)}>
                        {site.status.replace("_", " ")}
                      </Badge>
                    </td>
                    <td>
                      <small>
                        <Calendar size={12} className="me-1" />
                        {new Date(site.detectedDate).toLocaleDateString()}
                      </small>
                    </td>
                    <td>
                      {site.violations && site.violations.length > 0 ? (
                        <Badge bg="danger">{site.violations.length}</Badge>
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <Button
                        size="sm"
                        variant="outline-primary"
                        onClick={() => navigate(`/reports?id=${site.id}`)}
                      >
                        View Report
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </div>
  );
}

export default History;