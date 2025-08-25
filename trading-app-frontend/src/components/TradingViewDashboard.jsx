import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Nav, Alert, Badge } from 'react-bootstrap';
import { BarChart3, Activity, DollarSign, TrendingUp, Settings, Maximize, Minimize, Clock, AlertTriangle } from 'lucide-react';
import TradingView from './TradingView';
import OrderEntry from './OrderEntry';
import MarketData from './MarketData';
import './TradingView.css';

const TradingViewDashboard = () => {
  const [activeTab, setActiveTab] = useState('chart');
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [currentPrice, setCurrentPrice] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [marketStatus, setMarketStatus] = useState('open');
  const [connectionStatus, setConnectionStatus] = useState('connected');

  // Simulate market status
  useEffect(() => {
    const checkMarketStatus = () => {
      const now = new Date();
      const hour = now.getHours();
      const day = now.getDay();
      
      // Simple market hours check (9:30 AM - 4:00 PM EST, Monday-Friday)
      if (day >= 1 && day <= 5 && hour >= 9 && hour <= 16) {
        setMarketStatus('open');
      } else {
        setMarketStatus('closed');
      }
    };

    checkMarketStatus();
    const interval = setInterval(checkMarketStatus, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Simulate connection status
  useEffect(() => {
    const connectionInterval = setInterval(() => {
      // Randomly simulate connection issues (5% chance)
      if (Math.random() < 0.05) {
        setConnectionStatus('reconnecting');
        setTimeout(() => setConnectionStatus('connected'), 2000);
      }
    }, 10000);

    return () => clearInterval(connectionInterval);
  }, []);

  // Handle symbol selection from market data
  const handleSymbolSelect = (symbolData) => {
    setSelectedSymbol({
      value: symbolData.symbol,
      label: `${symbolData.name} (${symbolData.symbol})`,
      sector: symbolData.sector
    });
    setCurrentPrice(symbolData.price);
    setActiveTab('chart');
  };

  // Handle order submission
  const handleOrderSubmit = (order) => {
    console.log('Order submitted:', order);
    // In a real application, this would send the order to your broker's API
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`trading-view-dashboard ${isFullscreen ? 'fullscreen' : ''}`} style={{ minHeight: '100vh', background: '#0f0f0f' }}>
      <Container fluid className="p-0">
        {/* Header */}
        <Card className="bg-dark text-light border-secondary rounded-0">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <BarChart3 className="me-3" size={24} />
              <h4 className="mb-0">Trading Post Pro</h4>
              <Badge 
                bg={marketStatus === 'open' ? 'success' : 'secondary'} 
                className="ms-3"
              >
                Market {marketStatus === 'open' ? 'Open' : 'Closed'}
              </Badge>
              <Badge 
                bg={
                  connectionStatus === 'connected' ? 'success' :
                  connectionStatus === 'reconnecting' ? 'warning' : 'danger'
                } 
                className="ms-2"
              >
                {connectionStatus === 'connected' ? '🟢' : 
                 connectionStatus === 'reconnecting' ? '🟡' : '🔴'} 
                {connectionStatus.charAt(0).toUpperCase() + connectionStatus.slice(1)}
              </Badge>
            </div>
            <div className="d-flex align-items-center gap-2">
              <small className="text-muted">
                Last Update: {new Date().toLocaleTimeString()}
              </small>
              <Button 
                variant="outline-secondary" 
                size="sm"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
              </Button>
            </div>
          </Card.Header>
        </Card>

        {/* Navigation Tabs */}
        <Card className="bg-dark text-light border-secondary rounded-0 border-top-0">
          <Card.Body className="p-2">
            <Nav variant="pills" className="justify-content-center">
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'chart'}
                  onClick={() => setActiveTab('chart')}
                  className={activeTab === 'chart' ? 'bg-primary' : 'text-light'}
                >
                  <BarChart3 size={16} className="me-1" />
                  Chart Analysis
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'trading'}
                  onClick={() => setActiveTab('trading')}
                  className={activeTab === 'trading' ? 'bg-primary' : 'text-light'}
                >
                  <DollarSign size={16} className="me-1" />
                  Order Entry
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'market'}
                  onClick={() => setActiveTab('market')}
                  className={activeTab === 'market' ? 'bg-primary' : 'text-light'}
                >
                  <Activity size={16} className="me-1" />
                  Market Data
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'dashboard'}
                  onClick={() => setActiveTab('dashboard')}
                  className={activeTab === 'dashboard' ? 'bg-primary' : 'text-light'}
                >
                  <TrendingUp size={16} className="me-1" />
                  Dashboard
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Card.Body>
        </Card>

        {/* Main Content */}
        <div className="p-3">
          {/* Market Status Alert */}
          {marketStatus === 'closed' && (
            <Alert variant="warning" className="mb-3">
              <Clock className="me-2" size={16} />
              Market is currently closed. Orders will be queued for the next trading session.
            </Alert>
          )}

          {connectionStatus !== 'connected' && (
            <Alert variant="danger" className="mb-3">
              <AlertTriangle className="me-2" size={16} />
              {connectionStatus === 'reconnecting' ? 
                'Reconnecting to market data feed...' : 
                'Connection lost. Please check your internet connection.'}
            </Alert>
          )}

          {/* Tab Content */}
          {activeTab === 'chart' && (
            <TradingView />
          )}

          {activeTab === 'trading' && (
            <OrderEntry 
              currentSymbol={selectedSymbol}
              currentPrice={currentPrice}
              onOrderSubmit={handleOrderSubmit}
            />
          )}

          {activeTab === 'market' && (
            <MarketData onSymbolSelect={handleSymbolSelect} />
          )}

          {activeTab === 'dashboard' && (
            <Row>
              {/* Combined Dashboard View */}
              <Col md={8}>
                <div style={{ height: '400px' }}>
                  <TradingView />
                </div>
              </Col>
              <Col md={4}>
                <OrderEntry 
                  currentSymbol={selectedSymbol}
                  currentPrice={currentPrice}
                  onOrderSubmit={handleOrderSubmit}
                />
              </Col>
              <Col md={12} className="mt-3">
                <MarketData onSymbolSelect={handleSymbolSelect} />
              </Col>
            </Row>
          )}
        </div>

        {/* Footer */}
        <Card className="bg-dark text-light border-secondary rounded-0 mt-auto">
          <Card.Footer className="text-center">
            <Row>
              <Col md={3}>
                <small className="text-muted">
                  <strong>Platform:</strong> Trading Post Pro v2.0
                </small>
              </Col>
              <Col md={3}>
                <small className="text-muted">
                  <strong>Data Provider:</strong> Real-time Market Data
                </small>
              </Col>
              <Col md={3}>
                <small className="text-muted">
                  <strong>Latency:</strong> &lt;50ms
                </small>
              </Col>
              <Col md={3}>
                <small className="text-muted">
                  <strong>Server:</strong> US East
                </small>
              </Col>
            </Row>
          </Card.Footer>
        </Card>
      </Container>
    </div>
  );
};

export default TradingViewDashboard;