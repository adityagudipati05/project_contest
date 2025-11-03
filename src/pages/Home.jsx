import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { getStatistics, getDetectedSites } from "../services/api";

function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentSites, setRecentSites] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = () => {
    const statistics = getStatistics();
    setStats(statistics);

    // Get 3 most recent sites
    const sites = getDetectedSites();
    const sorted = sites.sort(
      (a, b) =>
        new Date(b.detectedDate || 0) - new Date(a.detectedDate || 0)
    );
    setRecentSites(sorted.slice(0, 3));
  };

  const handleProceed = () => navigate("/site-check");

  return (
    <Container fluid className="py-5">
      <Row className="justify-content-center g-4">
        {/* Welcome Section */}
        <Col xs={12} md={8} lg={7}>
          <Card className="shadow-sm border-0 rounded-4 h-100">
            <Card.Body className="p-4 d-flex flex-column justify-content-between">
              <div>
                <h2 className="fw-bold mb-3">Welcome 👋</h2>
                <p className="text-secondary mb-4">
                  Empowering sustainable urban planning through AI-driven satellite imagery.
                  Detect and report illegal constructions effortlessly with{" "}
                  <b>AI-UrbanVision</b> for HYDRAA.
                </p>
                <div className="mb-3">
                  <h5 className="fw-bold">Key Features:</h5>
                  <ul className="text-secondary">
                    <li>🛰 AI-powered change detection using satellite imagery</li>
                    <li>🗺️ GIS validation against protected zones (waterbodies, green belts)</li>
                    <li>⚠️ Automated risk categorization (High/Medium/Low)</li>
                    <li>📊 Interactive dashboard with real-time monitoring</li>
                    <li>📄 Comprehensive reports with before/after evidence</li>
                  </ul>
                </div>
              </div>

              <div className="d-flex justify-content-center gap-3 mt-3">
                <Button variant="primary" className="px-4 py-2" onClick={handleProceed}>
                  🚀 Check New Site
                </Button>
                <Button
                  variant="outline-secondary"
                  className="px-4 py-2"
                  onClick={() => navigate("/dashboard")}
                >
                  📊 View Dashboard
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Statistics & Recent Activity */}
        <Col xs={12} md={4} lg={4}>
          {/* Statistics Section */}
          <Card className="shadow-sm border-0 rounded-4 mb-3">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-3">Statistics 📊</h5>
              {stats ? (
                <>
                  <div className="mb-3">
                    <div className="d-flex justify-content-between">
                      <span>Total Sites:</span>
                      <strong>{stats.total}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span className="text-danger">High Risk:</span>
                      <strong className="text-danger">{stats.byRiskLevel.HIGH}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span className="text-warning">Medium Risk:</span>
                      <strong className="text-warning">{stats.byRiskLevel.MEDIUM}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span className="text-success">Low Risk:</span>
                      <strong className="text-success">{stats.byRiskLevel.LOW}</strong>
                    </div>
                  </div>
                  <hr />
                  <div>
                    <div className="d-flex justify-content-between">
                      <span>Pending:</span>
                      <strong className="text-warning">{stats.byStatus.PENDING || 0}</strong>
                    </div>
                    <div className="d-flex justify-content-between mt-2">
                      <span>Resolved:</span>
                      <strong className="text-success">{stats.byStatus.RESOLVED || 0}</strong>
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-muted">Loading statistics...</p>
              )}
            </Card.Body>
          </Card>

          {/* Recent Activity Section */}
          <Card className="shadow-sm border-0 rounded-4">
            <Card.Body className="p-4">
              <h5 className="fw-bold mb-3">Recent Activity 🕒</h5>
              {recentSites.length > 0 ? (
                <ul className="list-unstyled mb-0">
                  {recentSites.map((site, idx) => (
                    <li key={idx} className="mb-2">
                      <small>
                        <strong>{site.type}</strong> - {site.district}
                        <br />
                        <span
                          className={`badge bg-${
                            site.riskLevel === "HIGH"
                              ? "danger"
                              : site.riskLevel === "MEDIUM"
                              ? "warning"
                              : "success"
                          }`}
                        >
                          {site.riskLevel}
                        </span>{" "}
                        <span className="text-muted">
                          {new Date(site.detectedDate).toLocaleDateString()}
                        </span>
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted mb-0">
                  No recent activity. Check a new site to get started!
                </p>
              )}
              <Button
                variant="outline-primary"
                size="sm"
                className="mt-3 w-100"
                onClick={() => navigate("/history")}
              >
                View Full History
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Home;
