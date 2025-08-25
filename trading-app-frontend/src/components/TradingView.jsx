import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { createChart, ColorType, CrosshairMode, LineStyle, PriceScaleMode } from 'lightweight-charts';
import { Container, Row, Col, Card, Button, Form, Badge, Alert, Modal, Spinner } from 'react-bootstrap';
import { Search, TrendingUp, BarChart3, Settings, Star, Bell, Download, Upload, Maximize, Minimize, RefreshCw } from 'lucide-react';
import Select from 'react-select';
import './TradingView.css';

// Mock market data - in production this would come from a real API
const generateMockData = (symbol, days = 365) => {
  const data = [];
  const now = Date.now();
  let price = Math.random() * 100 + 50; // Starting price between 50-150
  
  for (let i = days; i >= 0; i--) {
    const time = Math.floor((now - i * 24 * 60 * 60 * 1000) / 1000);
    const change = (Math.random() - 0.5) * 0.04; // +/-2% daily change
    price = Math.max(price * (1 + change), 0.01); // Prevent negative prices
    
    const open = price;
    const high = price * (1 + Math.random() * 0.02);
    const low = price * (1 - Math.random() * 0.02);
    const close = low + Math.random() * (high - low);
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      time,
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
    
    price = close;
  }
  
  return data.sort((a, b) => a.time - b.time);
};

// Technical indicator calculations
const calculateSMA = (data, period) => {
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    const sum = data.slice(i - period + 1, i + 1).reduce((acc, item) => acc + item.close, 0);
    sma.push({
      time: data[i].time,
      value: parseFloat((sum / period).toFixed(2))
    });
  }
  return sma;
};

const calculateEMA = (data, period) => {
  const ema = [];
  const multiplier = 2 / (period + 1);
  let emaValue = data[0].close;
  
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      emaValue = data[i].close;
    } else {
      emaValue = (data[i].close * multiplier) + (emaValue * (1 - multiplier));
    }
    ema.push({
      time: data[i].time,
      value: parseFloat(emaValue.toFixed(2))
    });
  }
  return ema;
};

const calculateRSI = (data, period = 14) => {
  const rsi = [];
  const changes = [];
  
  for (let i = 1; i < data.length; i++) {
    changes.push(data[i].close - data[i - 1].close);
  }
  
  for (let i = period; i < changes.length; i++) {
    const gains = changes.slice(i - period, i).filter(change => change > 0);
    const losses = changes.slice(i - period, i).filter(change => change < 0).map(loss => Math.abs(loss));
    
    const avgGain = gains.length > 0 ? gains.reduce((sum, gain) => sum + gain, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, loss) => sum + loss, 0) / period : 0;
    
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    const rsiValue = 100 - (100 / (1 + rs));
    
    rsi.push({
      time: data[i + 1].time,
      value: parseFloat(rsiValue.toFixed(2))
    });
  }
  return rsi;
};

const calculateBollingerBands = (data, period = 20, stdDev = 2) => {
  const sma = calculateSMA(data, period);
  const bands = { upper: [], middle: [], lower: [] };
  
  for (let i = 0; i < sma.length; i++) {
    const dataIndex = i + period - 1;
    const prices = data.slice(dataIndex - period + 1, dataIndex + 1).map(item => item.close);
    const mean = sma[i].value;
    const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / period;
    const standardDeviation = Math.sqrt(variance);
    
    bands.upper.push({
      time: sma[i].time,
      value: parseFloat((mean + stdDev * standardDeviation).toFixed(2))
    });
    bands.middle.push(sma[i]);
    bands.lower.push({
      time: sma[i].time,
      value: parseFloat((mean - stdDev * standardDeviation).toFixed(2))
    });
  }
  return bands;
};

const calculateMACD = (data, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
  const fastEMA = calculateEMA(data, fastPeriod);
  const slowEMA = calculateEMA(data, slowPeriod);
  const macdLine = [];
  
  const startIndex = slowPeriod - 1;
  for (let i = startIndex; i < data.length; i++) {
    const fastIndex = i - (slowPeriod - fastPeriod);
    if (fastIndex >= 0 && fastIndex < fastEMA.length) {
      const macdValue = fastEMA[fastIndex].value - slowEMA[i - startIndex].value;
      macdLine.push({
        time: data[i].time,
        value: parseFloat(macdValue.toFixed(4))
      });
    }
  }
  
  const signalLine = calculateEMA(macdLine.map(item => ({ close: item.value, time: item.time })), signalPeriod);
  const histogram = [];
  
  for (let i = 0; i < signalLine.length; i++) {
    const macdIndex = i + signalPeriod - 1;
    if (macdIndex < macdLine.length) {
      histogram.push({
        time: macdLine[macdIndex].time,
        value: parseFloat((macdLine[macdIndex].value - signalLine[i].value).toFixed(4))
      });
    }
  }
  
  return { macdLine, signalLine, histogram };
};

const SYMBOLS = [
  { value: 'AAPL', label: '🍎 Apple Inc. (AAPL)', sector: 'Technology' },
  { value: 'GOOGL', label: '🔍 Alphabet Inc. (GOOGL)', sector: 'Technology' },
  { value: 'MSFT', label: '💻 Microsoft Corp. (MSFT)', sector: 'Technology' },
  { value: 'AMZN', label: '📦 Amazon.com Inc. (AMZN)', sector: 'Consumer Discretionary' },
  { value: 'TSLA', label: '🚗 Tesla Inc. (TSLA)', sector: 'Consumer Discretionary' },
  { value: 'NVDA', label: '🎮 NVIDIA Corp. (NVDA)', sector: 'Technology' },
  { value: 'META', label: '📱 Meta Platforms (META)', sector: 'Technology' },
  { value: 'NFLX', label: '📺 Netflix Inc. (NFLX)', sector: 'Communication Services' },
  { value: 'SPY', label: '📊 SPDR S&P 500 ETF (SPY)', sector: 'ETF' },
  { value: 'QQQ', label: '💹 Invesco QQQ Trust (QQQ)', sector: 'ETF' },
  { value: 'BTC-USD', label: '₿ Bitcoin USD (BTC-USD)', sector: 'Cryptocurrency' },
  { value: 'ETH-USD', label: '⟠ Ethereum USD (ETH-USD)', sector: 'Cryptocurrency' }
];

const TIMEFRAMES = [
  { value: '1m', label: '1m', seconds: 60 },
  { value: '5m', label: '5m', seconds: 300 },
  { value: '15m', label: '15m', seconds: 900 },
  { value: '1h', label: '1H', seconds: 3600 },
  { value: '4h', label: '4H', seconds: 14400 },
  { value: '1d', label: '1D', seconds: 86400 },
  { value: '1w', label: '1W', seconds: 604800 },
  { value: '1M', label: '1M', seconds: 2592000 }
];

const CHART_TYPES = [
  { value: 'candlestick', label: 'Candlestick', icon: '📊' },
  { value: 'line', label: 'Line', icon: '📈' },
  { value: 'area', label: 'Area', icon: '🏔️' },
  { value: 'bars', label: 'OHLC Bars', icon: '📊' }
];

const INDICATORS = [
  { value: 'sma', label: 'Simple Moving Average (SMA)', category: 'Trend' },
  { value: 'ema', label: 'Exponential Moving Average (EMA)', category: 'Trend' },
  { value: 'rsi', label: 'Relative Strength Index (RSI)', category: 'Momentum' },
  { value: 'macd', label: 'MACD', category: 'Momentum' },
  { value: 'bollinger', label: 'Bollinger Bands', category: 'Volatility' },
  { value: 'volume', label: 'Volume', category: 'Volume' }
];

const TradingView = () => {
  const chartContainerRef = useRef();
  const chart = useRef();
  const candlestickSeries = useRef();
  const volumeSeries = useRef();
  const indicatorSeries = useRef({});
  const updateIndicatorsRef = useRef();
  
  const [currentSymbol, setCurrentSymbol] = useState(SYMBOLS[0]);
  const [currentTimeframe, setCurrentTimeframe] = useState(TIMEFRAMES[5]); // 1D default
  const [chartType, setChartType] = useState('candlestick');
  const [watchlist, setWatchlist] = useState([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
  const [activeIndicators, setActiveIndicators] = useState(['volume']);
  const [showIndicatorModal, setShowIndicatorModal] = useState(false);
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [marketData, setMarketData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [drawingMode, setDrawingMode] = useState(false);
  const [selectedTool, setSelectedTool] = useState('trendline');
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Chart theme and styling
  const chartOptions = useMemo(() => ({
    layout: {
      background: { type: ColorType.Solid, color: '#1a1a1a' },
      textColor: '#d1d5db',
    },
    grid: {
      vertLines: { color: '#374151', style: LineStyle.Dotted, visible: true },
      horzLines: { color: '#374151', style: LineStyle.Dotted, visible: true },
    },
    crosshair: {
      mode: CrosshairMode.Normal,
      vertLine: {
        width: 1,
        color: '#6b7280',
        style: LineStyle.Dashed,
      },
      horzLine: {
        width: 1,
        color: '#6b7280',
        style: LineStyle.Dashed,
      },
    },
    rightPriceScale: {
      borderColor: '#374151',
      textColor: '#d1d5db',
      mode: PriceScaleMode.Normal,
    },
    timeScale: {
      borderColor: '#374151',
      timeVisible: true,
      secondsVisible: false,
    },
    watermark: {
      visible: true,
      fontSize: 24,
      horzAlign: 'center',
      vertAlign: 'center',
      color: 'rgba(171, 71, 188, 0.3)',
      text: 'Trading Post Pro',
    },
  }), []);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    try {
      // Create chart with error handling
      const chartInstance = createChart(chartContainerRef.current, {
        ...chartOptions,
        width: chartContainerRef.current.clientWidth,
        height: 600,
      });

      // Verify chart was created successfully
      if (!chartInstance) {
        console.error('Failed to create chart instance');
        return;
      }

      chart.current = chartInstance;

      // Add candlestick series with error handling
      try {
        candlestickSeries.current = chart.current.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
      } catch (error) {
        console.error('Failed to add candlestick series:', error);
      }

      // Add volume series with error handling
      try {
        volumeSeries.current = chart.current.addHistogramSeries({
          color: '#6b7280',
          priceFormat: { type: 'volume' },
          priceScaleId: 'volume',
        });

        chart.current.priceScale('volume').applyOptions({
          scaleMargins: { top: 0.8, bottom: 0 },
        });
      } catch (error) {
        console.error('Failed to add volume series:', error);
      }

      // Load initial data
      loadMarketData(currentSymbol.value);

      // Handle resize
      const handleResize = () => {
        if (chart.current && chartContainerRef.current) {
          try {
            chart.current.applyOptions({
              width: chartContainerRef.current.clientWidth,
            });
          } catch (error) {
            console.error('Error resizing chart:', error);
          }
        }
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        if (chart.current) {
          try {
            chart.current.remove();
          } catch (error) {
            console.error('Error removing chart:', error);
          }
          chart.current = null;
          candlestickSeries.current = null;
          volumeSeries.current = null;
        }
      };
    } catch (error) {
      console.error('Failed to initialize chart:', error);
      setIsLoading(false);
    }
  }, [chartOptions]);

  // Load market data for a symbol
  const loadMarketData = useCallback(async (symbol) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const data = generateMockData(symbol);
      setMarketData(prev => ({ ...prev, [symbol]: data }));
      
      // Only update chart if series are initialized
      if (candlestickSeries.current && volumeSeries.current) {
        try {
          candlestickSeries.current.setData(data);
          volumeSeries.current.setData(data.map(item => ({
            time: item.time,
            value: item.volume,
            color: item.close >= item.open ? '#10b98150' : '#ef444450'
          })));
          
          if (updateIndicatorsRef.current) {
            updateIndicatorsRef.current(data);
          }
        } catch (error) {
          console.error('Error updating chart data:', error);
        }
      } else {
        console.warn('Chart series not initialized yet, skipping data update');
        // Store data for later update when chart is ready
        setTimeout(() => {
          if (candlestickSeries.current && volumeSeries.current) {
            try {
              candlestickSeries.current.setData(data);
              volumeSeries.current.setData(data.map(item => ({
                time: item.time,
                value: item.volume,
                color: item.close >= item.open ? '#10b98150' : '#ef444450'
              })));
              if (updateIndicatorsRef.current) {
                updateIndicatorsRef.current(data);
              }
            } catch (error) {
              console.error('Error updating chart data on retry:', error);
            }
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error loading market data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update technical indicators
  const updateIndicators = useCallback((data) => {
    if (!chart.current) {
      console.warn('Chart not initialized, skipping indicator update');
      return;
    }

    // Clear existing indicator series
    Object.values(indicatorSeries.current).forEach(series => {
      try {
        if (chart.current && series) {
          chart.current.removeSeries(series);
        }
      } catch (e) {
        // Series might already be removed
      }
    });
    indicatorSeries.current = {};

    activeIndicators.forEach(indicator => {
      let indicatorData;
      let seriesOptions = {};

      switch (indicator) {
        case 'sma':
          indicatorData = calculateSMA(data, 20);
          seriesOptions = {
            color: '#3b82f6',
            lineWidth: 2,
            title: 'SMA(20)'
          };
          indicatorSeries.current[indicator] = chart.current.addLineSeries(seriesOptions);
          indicatorSeries.current[indicator].setData(indicatorData);
          break;

        case 'ema':
          indicatorData = calculateEMA(data, 20);
          seriesOptions = {
            color: '#f59e0b',
            lineWidth: 2,
            title: 'EMA(20)'
          };
          indicatorSeries.current[indicator] = chart.current.addLineSeries(seriesOptions);
          indicatorSeries.current[indicator].setData(indicatorData);
          break;

        case 'rsi':
          indicatorData = calculateRSI(data);
          seriesOptions = {
            color: '#8b5cf6',
            lineWidth: 2,
            priceScaleId: 'rsi',
            title: 'RSI(14)'
          };
          indicatorSeries.current[indicator] = chart.current.addLineSeries(seriesOptions);
          indicatorSeries.current[indicator].setData(indicatorData);
          
          chart.current.priceScale('rsi').applyOptions({
            scaleMargins: { top: 0.7, bottom: 0.05 },
            borderVisible: false,
          });
          break;

        case 'bollinger':
          const bands = calculateBollingerBands(data);
          indicatorSeries.current[`${indicator}_upper`] = chart.current.addLineSeries({
            color: '#ec4899',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            title: 'BB Upper'
          });
          indicatorSeries.current[`${indicator}_middle`] = chart.current.addLineSeries({
            color: '#6b7280',
            lineWidth: 1,
            title: 'BB Middle'
          });
          indicatorSeries.current[`${indicator}_lower`] = chart.current.addLineSeries({
            color: '#ec4899',
            lineWidth: 1,
            lineStyle: LineStyle.Dashed,
            title: 'BB Lower'
          });
          
          indicatorSeries.current[`${indicator}_upper`].setData(bands.upper);
          indicatorSeries.current[`${indicator}_middle`].setData(bands.middle);
          indicatorSeries.current[`${indicator}_lower`].setData(bands.lower);
          break;

        case 'macd':
          const macd = calculateMACD(data);
          indicatorSeries.current[`${indicator}_line`] = chart.current.addLineSeries({
            color: '#06b6d4',
            lineWidth: 2,
            priceScaleId: 'macd',
            title: 'MACD'
          });
          indicatorSeries.current[`${indicator}_signal`] = chart.current.addLineSeries({
            color: '#f59e0b',
            lineWidth: 2,
            priceScaleId: 'macd',
            title: 'Signal'
          });
          indicatorSeries.current[`${indicator}_histogram`] = chart.current.addHistogramSeries({
            color: '#6b7280',
            priceScaleId: 'macd',
            title: 'Histogram'
          });
          
          indicatorSeries.current[`${indicator}_line`].setData(macd.macdLine);
          indicatorSeries.current[`${indicator}_signal`].setData(macd.signalLine);
          indicatorSeries.current[`${indicator}_histogram`].setData(macd.histogram);
          
          chart.current.priceScale('macd').applyOptions({
            scaleMargins: { top: 0.6, bottom: 0.05 },
            borderVisible: false,
          });
          break;
      }
    });
  }, [activeIndicators]);

  // Store updateIndicators in ref to avoid circular dependencies
  useEffect(() => {
    updateIndicatorsRef.current = updateIndicators;
  }, [updateIndicators]);

  // Handle symbol change
  const handleSymbolChange = (selectedOption) => {
    setCurrentSymbol(selectedOption);
    loadMarketData(selectedOption.value);
  };

  // Handle timeframe change
  const handleTimeframeChange = (timeframe) => {
    setCurrentTimeframe(timeframe);
    if (marketData[currentSymbol.value]) {
      // In a real app, you'd load different timeframe data
      loadMarketData(currentSymbol.value);
    }
  };

  // Toggle indicator
  const toggleIndicator = (indicator) => {
    setActiveIndicators(prev => {
      if (prev.includes(indicator)) {
        return prev.filter(ind => ind !== indicator);
      } else {
        return [...prev, indicator];
      }
    });
  };

  // Add to watchlist
  const addToWatchlist = (symbol) => {
    if (!watchlist.find(item => item.value === symbol.value)) {
      setWatchlist(prev => [...prev, symbol]);
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = (symbol) => {
    setWatchlist(prev => prev.filter(item => item.value !== symbol.value));
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setTimeout(() => {
      if (chart.current && chartContainerRef.current) {
        chart.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: isFullscreen ? 600 : window.innerHeight - 200,
        });
      }
    }, 100);
  };

  // Get current price data for symbol
  const getCurrentPrice = (symbol) => {
    const data = marketData[symbol];
    if (!data || data.length === 0) return null;
    const latest = data[data.length - 1];
    const previous = data[data.length - 2];
    const change = previous ? latest.close - previous.close : 0;
    const changePercent = previous ? (change / previous.close) * 100 : 0;
    
    return {
      price: latest.close,
      change,
      changePercent,
      volume: latest.volume
    };
  };

  // Update chart type
  const handleChartTypeChange = (type) => {
    setChartType(type);
    if (!chart.current || !marketData[currentSymbol.value]) return;

    // Remove current series
    if (candlestickSeries.current) {
      chart.current.removeSeries(candlestickSeries.current);
    }

    const data = marketData[currentSymbol.value];

    switch (type) {
      case 'candlestick':
        candlestickSeries.current = chart.current.addCandlestickSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          borderVisible: false,
          wickUpColor: '#10b981',
          wickDownColor: '#ef4444',
        });
        candlestickSeries.current.setData(data);
        break;
      case 'line':
        candlestickSeries.current = chart.current.addLineSeries({
          color: '#3b82f6',
          lineWidth: 2,
        });
        candlestickSeries.current.setData(data.map(item => ({
          time: item.time,
          value: item.close
        })));
        break;
      case 'area':
        candlestickSeries.current = chart.current.addAreaSeries({
          topColor: 'rgba(59, 130, 246, 0.4)',
          bottomColor: 'rgba(59, 130, 246, 0.04)',
          lineColor: '#3b82f6',
          lineWidth: 2,
        });
        candlestickSeries.current.setData(data.map(item => ({
          time: item.time,
          value: item.close
        })));
        break;
      case 'bars':
        candlestickSeries.current = chart.current.addBarSeries({
          upColor: '#10b981',
          downColor: '#ef4444',
          openVisible: true,
          thinBars: false,
        });
        candlestickSeries.current.setData(data);
        break;
    }
  };

  return (
    <div className={`trading-view ${isFullscreen ? 'fullscreen' : ''}`}>
      <Container fluid className="p-3">
        <Row>
          {/* Sidebar - Watchlist & Controls */}
          <Col md={3} className="mb-3">
            <Card className="h-100 bg-dark text-light border-secondary">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <BarChart3 className="me-2" size={16} />
                  Trading Dashboard
                </h6>
                <div>
                  <Button 
                    variant="outline-secondary" 
                    size="sm" 
                    className="me-2"
                    onClick={toggleFullscreen}
                  >
                    {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowIndicatorModal(true)}>
                    <Settings size={14} />
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                {/* Symbol Search */}
                <div className="mb-3">
                  <label className="form-label small">Search Symbol</label>
                  <Select
                    value={currentSymbol}
                    onChange={handleSymbolChange}
                    options={SYMBOLS}
                    className="react-select"
                    classNamePrefix="react-select"
                    isSearchable
                    placeholder="Search symbols..."
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#374151',
                        borderColor: '#6b7280',
                        color: '#fff'
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#374151',
                        color: '#fff'
                      }),
                      option: (base, state) => ({
                        ...base,
                        backgroundColor: state.isFocused ? '#4b5563' : '#374151',
                        color: '#fff'
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: '#fff'
                      }),
                      input: (base) => ({
                        ...base,
                        color: '#fff'
                      })
                    }}
                  />
                </div>

                {/* Chart Type Selector */}
                <div className="mb-3">
                  <label className="form-label small">Chart Type</label>
                  <div className="btn-group w-100" role="group">
                    {CHART_TYPES.map(type => (
                      <Button
                        key={type.value}
                        variant={chartType === type.value ? "primary" : "outline-secondary"}
                        size="sm"
                        onClick={() => handleChartTypeChange(type.value)}
                        title={type.label}
                      >
                        {type.icon}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Timeframes */}
                <div className="mb-3">
                  <label className="form-label small">Timeframe</label>
                  <div className="btn-group-vertical w-100" role="group">
                    <div className="row g-1">
                      {TIMEFRAMES.map(tf => (
                        <div key={tf.value} className="col-3">
                          <Button
                            variant={currentTimeframe.value === tf.value ? "primary" : "outline-secondary"}
                            size="sm"
                            className="w-100"
                            onClick={() => handleTimeframeChange(tf)}
                          >
                            {tf.label}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Watchlist */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label small mb-0">Watchlist</label>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={() => addToWatchlist(currentSymbol)}
                      disabled={watchlist.find(item => item.value === currentSymbol.value)}
                    >
                      <Star size={12} />
                    </Button>
                  </div>
                  <div className="watchlist-container" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                    {watchlist.map(symbol => {
                      const priceData = getCurrentPrice(symbol.value);
                      return (
                        <div key={symbol.value} className="watchlist-item p-2 mb-1 bg-secondary rounded">
                          <div className="d-flex justify-content-between align-items-center">
                            <div className="flex-grow-1" onClick={() => handleSymbolChange(symbol)} style={{ cursor: 'pointer' }}>
                              <small className="fw-bold">{symbol.value}</small>
                              {priceData && (
                                <div className="d-flex justify-content-between">
                                  <small>${priceData.price.toFixed(2)}</small>
                                  <small className={priceData.change >= 0 ? 'text-success' : 'text-danger'}>
                                    {priceData.change >= 0 ? '+' : ''}{priceData.changePercent.toFixed(2)}%
                                  </small>
                                </div>
                              )}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeFromWatchlist(symbol.value)}
                              className="ms-2"
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Active Indicators */}
                <div>
                  <label className="form-label small">Active Indicators</label>
                  <div className="d-flex flex-wrap gap-1">
                    {activeIndicators.map(indicator => (
                      <Badge 
                        key={indicator} 
                        bg="primary" 
                        className="d-flex align-items-center gap-1"
                      >
                        {indicator.toUpperCase()}
                        <span 
                          style={{ cursor: 'pointer' }}
                          onClick={() => toggleIndicator(indicator)}
                        >
                          ×
                        </span>
                      </Badge>
                    ))}
                    {activeIndicators.length === 0 && (
                      <small className="text-muted">No indicators active</small>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Chart Area */}
          <Col md={9}>
            <Card className="bg-dark text-light border-secondary">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <TrendingUp className="me-2" size={20} />
                  <h5 className="mb-0">{currentSymbol.label}</h5>
                  {isLoading && <Spinner animation="border" size="sm" className="ms-2" />}
                </div>
                <div className="d-flex gap-2">
                  <Button variant="outline-secondary" size="sm" onClick={() => setShowAlertModal(true)}>
                    <Bell size={14} /> Alerts
                  </Button>
                  <Button variant="outline-secondary" size="sm" onClick={() => loadMarketData(currentSymbol.value)}>
                    <RefreshCw size={14} /> Refresh
                  </Button>
                  <Button variant="outline-secondary" size="sm">
                    <Download size={14} /> Export
                  </Button>
                </div>
              </Card.Header>
              <Card.Body className="p-0">
                {/* Price Header */}
                {(() => {
                  const priceData = getCurrentPrice(currentSymbol.value);
                  return priceData && (
                    <div className="p-3 border-bottom border-secondary">
                      <Row>
                        <Col md={8}>
                          <div className="d-flex align-items-center gap-3">
                            <h4 className="mb-0">${priceData.price.toFixed(2)}</h4>
                            <div className={`d-flex align-items-center ${priceData.change >= 0 ? 'text-success' : 'text-danger'}`}>
                              <span className="me-1">{priceData.change >= 0 ? '▲' : '▼'}</span>
                              <span>{priceData.change >= 0 ? '+' : ''}${priceData.change.toFixed(2)}</span>
                              <span className="ms-1">({priceData.changePercent.toFixed(2)}%)</span>
                            </div>
                          </div>
                          <small className="text-muted">
                            Volume: {priceData.volume.toLocaleString()} • {currentTimeframe.label} • {new Date().toLocaleString()}
                          </small>
                        </Col>
                        <Col md={4} className="text-end">
                          <Badge bg={priceData.change >= 0 ? 'success' : 'danger'} className="p-2">
                            {priceData.change >= 0 ? 'Bullish' : 'Bearish'}
                          </Badge>
                        </Col>
                      </Row>
                    </div>
                  );
                })()}

                {/* Chart Container */}
                <div 
                  ref={chartContainerRef} 
                  style={{ 
                    width: '100%', 
                    height: isFullscreen ? 'calc(100vh - 250px)' : '600px',
                    background: '#1a1a1a'
                  }}
                />
                
                {isLoading && (
                  <div className="position-absolute top-50 start-50 translate-middle">
                    <div className="d-flex flex-column align-items-center">
                      <Spinner animation="border" variant="primary" />
                      <small className="mt-2 text-muted">Loading market data...</small>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Indicators Modal */}
        <Modal show={showIndicatorModal} onHide={() => setShowIndicatorModal(false)} className="text-dark">
          <Modal.Header closeButton>
            <Modal.Title>Technical Indicators</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              {INDICATORS.map(indicator => (
                <Col md={6} key={indicator.value} className="mb-2">
                  <Form.Check
                    type="checkbox"
                    id={indicator.value}
                    label={indicator.label}
                    checked={activeIndicators.includes(indicator.value)}
                    onChange={() => toggleIndicator(indicator.value)}
                  />
                  <small className="text-muted d-block">{indicator.category}</small>
                </Col>
              ))}
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowIndicatorModal(false)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Alerts Modal */}
        <Modal show={showAlertModal} onHide={() => setShowAlertModal(false)} className="text-dark">
          <Modal.Header closeButton>
            <Modal.Title>Price Alerts</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Alert variant="info">
              <Bell className="me-2" size={16} />
              Price alerts feature coming soon! Set alerts for price levels, technical indicators, and volume changes.
            </Alert>
            <Form>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Symbol</Form.Label>
                    <Form.Control type="text" placeholder="Enter symbol" value={currentSymbol.value} readOnly />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Alert Type</Form.Label>
                    <Form.Select>
                      <option>Price Above</option>
                      <option>Price Below</option>
                      <option>Volume Spike</option>
                      <option>RSI Overbought</option>
                      <option>RSI Oversold</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mb-3">
                <Form.Label>Target Value</Form.Label>
                <Form.Control type="number" placeholder="Enter target price or value" />
              </Form.Group>
            </Form>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowAlertModal(false)}>
              Cancel
            </Button>
            <Button variant="primary">
              Create Alert
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </div>
  );
};

export default TradingView;