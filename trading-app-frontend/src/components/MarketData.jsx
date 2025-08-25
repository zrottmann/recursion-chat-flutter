import React, { useState, useEffect, useRef } from 'react';
import { Card, Table, Badge, Button, Form, InputGroup, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { Search, TrendingUp, TrendingDown, Activity, Volume2, Clock, Globe, DollarSign } from 'lucide-react';

// Mock market data generator
const generateMarketData = () => {
  const symbols = [
    { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Technology' },
    { symbol: 'MSFT', name: 'Microsoft Corp.', sector: 'Technology' },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
    { symbol: 'NVDA', name: 'NVIDIA Corp.', sector: 'Technology' },
    { symbol: 'META', name: 'Meta Platforms', sector: 'Technology' },
    { symbol: 'NFLX', name: 'Netflix Inc.', sector: 'Communication Services' },
    { symbol: 'SPY', name: 'SPDR S&P 500 ETF', sector: 'ETF' },
    { symbol: 'QQQ', name: 'Invesco QQQ Trust', sector: 'ETF' },
    { symbol: 'BTC-USD', name: 'Bitcoin USD', sector: 'Cryptocurrency' },
    { symbol: 'ETH-USD', name: 'Ethereum USD', sector: 'Cryptocurrency' },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
    { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
    { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
    { symbol: 'WMT', name: 'Walmart Inc.', sector: 'Consumer Staples' },
    { symbol: 'PG', name: 'Procter & Gamble', sector: 'Consumer Staples' },
    { symbol: 'UNH', name: 'UnitedHealth Group', sector: 'Healthcare' },
    { symbol: 'HD', name: 'The Home Depot', sector: 'Consumer Discretionary' },
    { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services' }
  ];

  return symbols.map((stock, index) => {
    const basePrice = Math.random() * 500 + 50;
    const change = (Math.random() - 0.5) * 0.1; // +/-5% change
    const price = basePrice * (1 + change);
    const dailyChange = basePrice * change;
    const changePercent = change * 100;
    const volume = Math.floor(Math.random() * 10000000) + 1000000;
    const marketCap = price * (Math.random() * 5000000000 + 1000000000);
    
    return {
      id: index + 1,
      symbol: stock.symbol,
      name: stock.name,
      sector: stock.sector,
      price: parseFloat(price.toFixed(2)),
      change: parseFloat(dailyChange.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
      volume: volume,
      marketCap: marketCap,
      high52w: parseFloat((price * 1.4).toFixed(2)),
      low52w: parseFloat((price * 0.6).toFixed(2)),
      pe: parseFloat((Math.random() * 40 + 5).toFixed(2)),
      eps: parseFloat((price / (Math.random() * 40 + 5)).toFixed(2)),
      dividend: parseFloat((Math.random() * 5).toFixed(2)),
      lastUpdate: new Date()
    };
  });
};

// Mock news data
const generateNews = () => [
  {
    id: 1,
    headline: "Tech Stocks Rally on Strong Earnings Reports",
    summary: "Major technology companies exceed quarterly expectations...",
    source: "Market Watch",
    timestamp: new Date(Date.now() - 300000),
    sentiment: "positive"
  },
  {
    id: 2,
    headline: "Federal Reserve Maintains Interest Rates",
    summary: "Central bank holds rates steady amid inflation concerns...",
    source: "Reuters",
    timestamp: new Date(Date.now() - 900000),
    sentiment: "neutral"
  },
  {
    id: 3,
    headline: "Oil Prices Surge on Supply Chain Disruptions",
    summary: "Energy sector sees significant gains following supply concerns...",
    source: "Bloomberg",
    timestamp: new Date(Date.now() - 1800000),
    sentiment: "positive"
  },
  {
    id: 4,
    headline: "Cryptocurrency Market Shows Mixed Signals",
    summary: "Bitcoin remains volatile while altcoins gain momentum...",
    source: "CoinDesk",
    timestamp: new Date(Date.now() - 2700000),
    sentiment: "neutral"
  },
  {
    id: 5,
    headline: "Healthcare Stocks Under Pressure from Regulatory Changes",
    summary: "New healthcare policies create uncertainty in the sector...",
    source: "Wall Street Journal",
    timestamp: new Date(Date.now() - 3600000),
    sentiment: "negative"
  }
];

const MarketData = ({ onSymbolSelect }) => {
  const [marketData, setMarketData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'symbol', direction: 'asc' });
  const [selectedSector, setSelectedSector] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [news, setNews] = useState([]);
  const [marketSummary, setMarketSummary] = useState({});
  const [selectedView, setSelectedView] = useState('overview');
  const updateInterval = useRef(null);

  // Initialize data
  useEffect(() => {
    loadMarketData();
    setNews(generateNews());
    
    // Set up real-time updates (every 5 seconds)
    updateInterval.current = setInterval(() => {
      updateMarketData();
    }, 5000);

    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  // Load initial market data
  const loadMarketData = async () => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      const data = generateMarketData();
      setMarketData(data);
      setFilteredData(data);
      calculateMarketSummary(data);
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update market data with price changes
  const updateMarketData = () => {
    setMarketData(prevData => {
      const updatedData = prevData.map(item => {
        // Simulate small price movements
        const priceChange = (Math.random() - 0.5) * 0.02; // +/-1% change
        const newPrice = parseFloat((item.price * (1 + priceChange)).toFixed(2));
        const newChange = parseFloat((newPrice - (item.price - item.change)).toFixed(2));
        const newChangePercent = parseFloat(((newChange / (newPrice - newChange)) * 100).toFixed(2));
        
        return {
          ...item,
          price: newPrice,
          change: newChange,
          changePercent: newChangePercent,
          lastUpdate: new Date()
        };
      });
      
      calculateMarketSummary(updatedData);
      return updatedData;
    });
  };

  // Calculate market summary
  const calculateMarketSummary = (data) => {
    const totalStocks = data.length;
    const gainers = data.filter(item => item.change > 0).length;
    const losers = data.filter(item => item.change < 0).length;
    const unchanged = totalStocks - gainers - losers;
    
    const avgChange = data.reduce((sum, item) => sum + item.changePercent, 0) / totalStocks;
    const totalVolume = data.reduce((sum, item) => sum + item.volume, 0);
    
    setMarketSummary({
      totalStocks,
      gainers,
      losers,
      unchanged,
      avgChange: parseFloat(avgChange.toFixed(2)),
      totalVolume
    });
  };

  // Filter and search data
  useEffect(() => {
    let filtered = marketData.filter(item => {
      const matchesSearch = item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSector = selectedSector === 'all' || item.sector === selectedSector;
      return matchesSearch && matchesSector;
    });

    // Sort data
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    setFilteredData(filtered);
  }, [marketData, searchTerm, selectedSector, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Get unique sectors
  const sectors = ['all', ...new Set(marketData.map(item => item.sector))];

  // Format large numbers
  const formatLargeNumber = (num) => {
    if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return num.toString();
  };

  // Format time ago
  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="market-data">
      <Row>
        <Col md={12}>
          {/* Market Summary */}
          <Card className="bg-dark text-light border-secondary mb-3">
            <Card.Header>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <Activity className="me-2" size={16} />
                  Market Overview
                </h6>
                <div className="d-flex gap-2">
                  <Button
                    variant={selectedView === 'overview' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setSelectedView('overview')}
                  >
                    Overview
                  </Button>
                  <Button
                    variant={selectedView === 'news' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setSelectedView('news')}
                  >
                    News
                  </Button>
                  <Button
                    variant={selectedView === 'heatmap' ? 'primary' : 'outline-secondary'}
                    size="sm"
                    onClick={() => setSelectedView('heatmap')}
                  >
                    Heatmap
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={2}>
                  <div className="text-center">
                    <h5 className="text-success">{marketSummary.gainers || 0}</h5>
                    <small className="text-muted">Gainers</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <h5 className="text-danger">{marketSummary.losers || 0}</h5>
                    <small className="text-muted">Losers</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="text-center">
                    <h5 className="text-secondary">{marketSummary.unchanged || 0}</h5>
                    <small className="text-muted">Unchanged</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h5 className={marketSummary.avgChange >= 0 ? 'text-success' : 'text-danger'}>
                      {marketSummary.avgChange >= 0 ? '+' : ''}{marketSummary.avgChange || 0}%
                    </h5>
                    <small className="text-muted">Avg Change</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="text-center">
                    <h5 className="text-info">{formatLargeNumber(marketSummary.totalVolume || 0)}</h5>
                    <small className="text-muted">Total Volume</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {selectedView === 'overview' && (
        <Row>
          <Col md={12}>
            <Card className="bg-dark text-light border-secondary">
              <Card.Header>
                <Row>
                  <Col md={6}>
                    <h6 className="mb-0">
                      <Globe className="me-2" size={16} />
                      Market Data
                      {isLoading && <Spinner animation="border" size="sm" className="ms-2" />}
                    </h6>
                  </Col>
                  <Col md={6}>
                    <Row>
                      <Col md={6}>
                        <InputGroup size="sm">
                          <InputGroup.Text className="bg-secondary border-secondary">
                            <Search size={14} />
                          </InputGroup.Text>
                          <Form.Control
                            placeholder="Search symbols..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-secondary text-light border-secondary"
                          />
                        </InputGroup>
                      </Col>
                      <Col md={6}>
                        <Form.Select
                          size="sm"
                          value={selectedSector}
                          onChange={(e) => setSelectedSector(e.target.value)}
                          className="bg-secondary text-light border-secondary"
                        >
                          {sectors.map(sector => (
                            <option key={sector} value={sector}>
                              {sector === 'all' ? 'All Sectors' : sector}
                            </option>
                          ))}
                        </Form.Select>
                      </Col>
                    </Row>
                  </Col>
                </Row>
              </Card.Header>
              <Card.Body className="p-0">
                <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                  <Table variant="dark" hover className="mb-0">
                    <thead className="sticky-top">
                      <tr>
                        <th 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('symbol')}
                        >
                          Symbol {sortConfig.key === 'symbol' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th>Name</th>
                        <th 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('price')}
                          className="text-end"
                        >
                          Price {sortConfig.key === 'price' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('change')}
                          className="text-end"
                        >
                          Change {sortConfig.key === 'change' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('changePercent')}
                          className="text-end"
                        >
                          % Change {sortConfig.key === 'changePercent' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('volume')}
                          className="text-end"
                        >
                          Volume {sortConfig.key === 'volume' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th 
                          style={{ cursor: 'pointer' }}
                          onClick={() => handleSort('marketCap')}
                          className="text-end"
                        >
                          Market Cap {sortConfig.key === 'marketCap' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                        </th>
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredData.map(item => (
                        <tr key={item.id} className="align-middle">
                          <td>
                            <div>
                              <strong>{item.symbol}</strong>
                              <br />
                              <Badge bg="secondary" className="small">
                                {item.sector}
                              </Badge>
                            </div>
                          </td>
                          <td>
                            <div>
                              {item.name}
                              <br />
                              <small className="text-muted">
                                P/E: {item.pe} • EPS: ${item.eps}
                              </small>
                            </div>
                          </td>
                          <td className="text-end">
                            <strong>${item.price.toFixed(2)}</strong>
                          </td>
                          <td className={`text-end ${item.change >= 0 ? 'text-success' : 'text-danger'}`}>
                            {item.change >= 0 ? '+' : ''}${item.change.toFixed(2)}
                          </td>
                          <td className={`text-end ${item.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                            <div className="d-flex align-items-center justify-content-end">
                              {item.changePercent >= 0 ? 
                                <TrendingUp size={14} className="me-1" /> : 
                                <TrendingDown size={14} className="me-1" />
                              }
                              {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                            </div>
                          </td>
                          <td className="text-end">
                            <div>
                              <Volume2 size={14} className="me-1" />
                              {formatLargeNumber(item.volume)}
                            </div>
                          </td>
                          <td className="text-end">
                            <DollarSign size={14} className="me-1" />
                            {formatLargeNumber(item.marketCap)}
                          </td>
                          <td className="text-center">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => onSymbolSelect && onSymbolSelect(item)}
                            >
                              Chart
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
                {filteredData.length === 0 && !isLoading && (
                  <div className="text-center p-4 text-muted">
                    No stocks found matching your criteria
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {selectedView === 'news' && (
        <Row>
          <Col md={12}>
            <Card className="bg-dark text-light border-secondary">
              <Card.Header>
                <h6 className="mb-0">
                  <Clock className="me-2" size={16} />
                  Market News
                </h6>
              </Card.Header>
              <Card.Body>
                {news.map(article => (
                  <Alert 
                    key={article.id} 
                    variant={
                      article.sentiment === 'positive' ? 'success' :
                      article.sentiment === 'negative' ? 'danger' : 'info'
                    }
                    className="mb-3"
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="flex-grow-1">
                        <Alert.Heading className="h6">{article.headline}</Alert.Heading>
                        <p className="mb-1">{article.summary}</p>
                        <small className="text-muted">
                          {article.source} • {timeAgo(article.timestamp)}
                        </small>
                      </div>
                      <Badge 
                        bg={
                          article.sentiment === 'positive' ? 'success' :
                          article.sentiment === 'negative' ? 'danger' : 'secondary'
                        }
                        className="ms-3"
                      >
                        {article.sentiment}
                      </Badge>
                    </div>
                  </Alert>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {selectedView === 'heatmap' && (
        <Row>
          <Col md={12}>
            <Card className="bg-dark text-light border-secondary">
              <Card.Header>
                <h6 className="mb-0">
                  <Activity className="me-2" size={16} />
                  Market Heatmap
                </h6>
              </Card.Header>
              <Card.Body>
                <div className="heatmap-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                  {filteredData.slice(0, 20).map(item => (
                    <div
                      key={item.id}
                      className={`heatmap-cell p-3 text-center rounded ${
                        item.changePercent >= 2 ? 'bg-success' :
                        item.changePercent >= 0 ? 'bg-success bg-opacity-50' :
                        item.changePercent >= -2 ? 'bg-danger bg-opacity-50' : 'bg-danger'
                      }`}
                      style={{ 
                        cursor: 'pointer',
                        minHeight: '80px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center'
                      }}
                      onClick={() => onSymbolSelect && onSymbolSelect(item)}
                    >
                      <strong>{item.symbol}</strong>
                      <div>${item.price.toFixed(2)}</div>
                      <small>
                        {item.changePercent >= 0 ? '+' : ''}{item.changePercent.toFixed(2)}%
                      </small>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </div>
  );
};

export default MarketData;