import React, { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Badge, Alert, InputGroup, Modal, Table } from 'react-bootstrap';
import { DollarSign, TrendingUp, TrendingDown, Calculator, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const OrderEntry = ({ currentSymbol, currentPrice, onOrderSubmit }) => {
  const [orderType, setOrderType] = useState('market');
  const [side, setSide] = useState('buy');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeInForce, setTimeInForce] = useState('DAY');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [orders, setOrders] = useState([]);
  const [positions, setPositions] = useState([]);
  const [portfolioValue, setPortfolioValue] = useState(100000); // Starting with $100k
  const [buyingPower, setBuyingPower] = useState(50000);

  // Mock portfolio and positions
  useEffect(() => {
    // Mock existing positions
    setPositions([
      {
        id: 1,
        symbol: 'AAPL',
        quantity: 100,
        avgPrice: 175.50,
        currentPrice: 180.25,
        pnl: 475,
        pnlPercent: 2.71,
        marketValue: 18025
      },
      {
        id: 2,
        symbol: 'TSLA',
        quantity: 50,
        avgPrice: 245.00,
        currentPrice: 239.80,
        pnl: -260,
        pnlPercent: -2.12,
        marketValue: 11990
      }
    ]);

    // Mock recent orders
    setOrders([
      {
        id: 1,
        symbol: 'GOOGL',
        side: 'buy',
        quantity: 25,
        orderType: 'limit',
        price: 142.50,
        status: 'filled',
        timestamp: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        symbol: 'MSFT',
        side: 'sell',
        quantity: 75,
        orderType: 'market',
        price: 378.90,
        status: 'pending',
        timestamp: new Date(Date.now() - 1800000).toISOString()
      }
    ]);
  }, []);

  // Calculate order value
  const calculateOrderValue = () => {
    const qty = parseFloat(quantity) || 0;
    const orderPrice = orderType === 'market' ? currentPrice : parseFloat(price) || 0;
    return qty * orderPrice;
  };

  // Calculate buying power after order
  const calculateRemainingBuyingPower = () => {
    if (side === 'sell') return buyingPower;
    return buyingPower - calculateOrderValue();
  };

  // Validate order
  const validateOrder = () => {
    const errors = [];
    
    if (!quantity || parseFloat(quantity) <= 0) {
      errors.push('Quantity must be greater than 0');
    }
    
    if (orderType === 'limit' && (!price || parseFloat(price) <= 0)) {
      errors.push('Limit price must be greater than 0');
    }
    
    if (side === 'buy' && calculateOrderValue() > buyingPower) {
      errors.push('Insufficient buying power');
    }
    
    return errors;
  };

  // Submit order
  const handleSubmitOrder = () => {
    const errors = validateOrder();
    if (errors.length > 0) {
      alert(errors.join('\n'));
      return;
    }
    setShowConfirmModal(true);
  };

  // Confirm order
  const confirmOrder = () => {
    const newOrder = {
      id: orders.length + 1,
      symbol: currentSymbol?.value || 'UNKNOWN',
      side,
      quantity: parseFloat(quantity),
      orderType,
      price: orderType === 'market' ? currentPrice : parseFloat(price),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      timeInForce,
      status: 'pending',
      timestamp: new Date().toISOString()
    };

    setOrders(prev => [newOrder, ...prev]);
    
    // Update buying power
    if (side === 'buy') {
      setBuyingPower(prev => prev - calculateOrderValue());
    }

    // Reset form
    setQuantity('');
    setPrice('');
    setStopLoss('');
    setTakeProfit('');
    setShowConfirmModal(false);

    if (onOrderSubmit) {
      onOrderSubmit(newOrder);
    }
  };

  // Close position
  const closePosition = (position) => {
    if (window.confirm(`Close ${position.quantity} shares of ${position.symbol}?`)) {
      const orderValue = position.quantity * position.currentPrice;
      setBuyingPower(prev => prev + orderValue);
      setPositions(prev => prev.filter(p => p.id !== position.id));
    }
  };

  return (
    <div className="order-entry">
      <Row>
        {/* Order Entry Form */}
        <Col md={6}>
          <Card className="bg-dark text-light border-secondary mb-3">
            <Card.Header>
              <h6 className="mb-0">
                <DollarSign className="me-2" size={16} />
                Order Entry - {currentSymbol?.value || 'Select Symbol'}
              </h6>
              {currentPrice && (
                <small className="text-muted">
                  Current Price: ${currentPrice.toFixed(2)}
                </small>
              )}
            </Card.Header>
            <Card.Body>
              {/* Buy/Sell Toggle */}
              <div className="mb-3">
                <div className="btn-group w-100" role="group">
                  <Button
                    variant={side === 'buy' ? "success" : "outline-success"}
                    onClick={() => setSide('buy')}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <TrendingUp size={16} className="me-1" />
                    BUY
                  </Button>
                  <Button
                    variant={side === 'sell' ? "danger" : "outline-danger"}
                    onClick={() => setSide('sell')}
                    className="d-flex align-items-center justify-content-center"
                  >
                    <TrendingDown size={16} className="me-1" />
                    SELL
                  </Button>
                </div>
              </div>

              {/* Order Type */}
              <Form.Group className="mb-3">
                <Form.Label>Order Type</Form.Label>
                <Form.Select 
                  value={orderType} 
                  onChange={(e) => setOrderType(e.target.value)}
                  className="bg-secondary text-light border-secondary"
                >
                  <option value="market">Market Order</option>
                  <option value="limit">Limit Order</option>
                  <option value="stop">Stop Order</option>
                  <option value="stop-limit">Stop Limit Order</option>
                </Form.Select>
              </Form.Group>

              {/* Quantity */}
              <Form.Group className="mb-3">
                <Form.Label>Quantity</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="number"
                    placeholder="Enter quantity"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-secondary text-light border-secondary"
                  />
                  <InputGroup.Text className="bg-secondary text-light border-secondary">
                    Shares
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>

              {/* Price (for limit orders) */}
              {(orderType === 'limit' || orderType === 'stop-limit') && (
                <Form.Group className="mb-3">
                  <Form.Label>
                    {orderType === 'limit' ? 'Limit Price' : 'Stop Limit Price'}
                  </Form.Label>
                  <InputGroup>
                    <InputGroup.Text className="bg-secondary text-light border-secondary">
                      $
                    </InputGroup.Text>
                    <Form.Control
                      type="number"
                      step="0.01"
                      placeholder="Enter price"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="bg-secondary text-light border-secondary"
                    />
                  </InputGroup>
                </Form.Group>
              )}

              {/* Stop Loss */}
              <Form.Group className="mb-3">
                <Form.Label>Stop Loss (Optional)</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-secondary text-light border-secondary">
                    $
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="Stop loss price"
                    value={stopLoss}
                    onChange={(e) => setStopLoss(e.target.value)}
                    className="bg-secondary text-light border-secondary"
                  />
                </InputGroup>
              </Form.Group>

              {/* Take Profit */}
              <Form.Group className="mb-3">
                <Form.Label>Take Profit (Optional)</Form.Label>
                <InputGroup>
                  <InputGroup.Text className="bg-secondary text-light border-secondary">
                    $
                  </InputGroup.Text>
                  <Form.Control
                    type="number"
                    step="0.01"
                    placeholder="Take profit price"
                    value={takeProfit}
                    onChange={(e) => setTakeProfit(e.target.value)}
                    className="bg-secondary text-light border-secondary"
                  />
                </InputGroup>
              </Form.Group>

              {/* Time in Force */}
              <Form.Group className="mb-3">
                <Form.Label>Time in Force</Form.Label>
                <Form.Select 
                  value={timeInForce} 
                  onChange={(e) => setTimeInForce(e.target.value)}
                  className="bg-secondary text-light border-secondary"
                >
                  <option value="DAY">Day Order</option>
                  <option value="GTC">Good Till Canceled</option>
                  <option value="IOC">Immediate or Cancel</option>
                  <option value="FOK">Fill or Kill</option>
                </Form.Select>
              </Form.Group>

              {/* Order Summary */}
              {quantity && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex justify-content-between">
                    <span>Order Value:</span>
                    <strong>${calculateOrderValue().toLocaleString()}</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <span>Remaining Buying Power:</span>
                    <strong>${calculateRemainingBuyingPower().toLocaleString()}</strong>
                  </div>
                </Alert>
              )}

              {/* Submit Button */}
              <Button 
                variant={side === 'buy' ? 'success' : 'danger'}
                size="lg"
                className="w-100"
                onClick={handleSubmitOrder}
                disabled={!currentSymbol || !quantity}
              >
                <Calculator className="me-2" size={16} />
                {side === 'buy' ? 'Place Buy Order' : 'Place Sell Order'}
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Portfolio & Account Info */}
        <Col md={6}>
          {/* Account Summary */}
          <Card className="bg-dark text-light border-secondary mb-3">
            <Card.Header>
              <h6 className="mb-0">Account Summary</h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="text-center mb-2">
                    <h5 className="text-success">${portfolioValue.toLocaleString()}</h5>
                    <small className="text-muted">Portfolio Value</small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center mb-2">
                    <h5 className="text-info">${buyingPower.toLocaleString()}</h5>
                    <small className="text-muted">Buying Power</small>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <div className="text-center">
                    <h6 className="text-success">+$2,450</h6>
                    <small className="text-muted">Day P&L</small>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="text-center">
                    <h6 className="text-success">+2.5%</h6>
                    <small className="text-muted">Day Return</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Positions */}
          <Card className="bg-dark text-light border-secondary mb-3">
            <Card.Header>
              <h6 className="mb-0">Positions</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {positions.length > 0 ? (
                <Table variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      <th>Symbol</th>
                      <th>Qty</th>
                      <th>Avg Price</th>
                      <th>P&L</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map(position => (
                      <tr key={position.id}>
                        <td>
                          <strong>{position.symbol}</strong>
                          <br />
                          <small className="text-muted">
                            ${position.currentPrice.toFixed(2)}
                          </small>
                        </td>
                        <td>{position.quantity}</td>
                        <td>${position.avgPrice.toFixed(2)}</td>
                        <td>
                          <span className={position.pnl >= 0 ? 'text-success' : 'text-danger'}>
                            ${position.pnl.toFixed(0)}
                            <br />
                            <small>({position.pnlPercent.toFixed(2)}%)</small>
                          </span>
                        </td>
                        <td>
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => closePosition(position)}
                          >
                            Close
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center p-3 text-muted">
                  No open positions
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders */}
      <Row>
        <Col md={12}>
          <Card className="bg-dark text-light border-secondary">
            <Card.Header>
              <h6 className="mb-0">Recent Orders</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {orders.length > 0 ? (
                <Table variant="dark" className="mb-0">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Symbol</th>
                      <th>Side</th>
                      <th>Quantity</th>
                      <th>Type</th>
                      <th>Price</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order.id}>
                        <td>
                          <small>{new Date(order.timestamp).toLocaleTimeString()}</small>
                        </td>
                        <td><strong>{order.symbol}</strong></td>
                        <td>
                          <Badge bg={order.side === 'buy' ? 'success' : 'danger'}>
                            {order.side.toUpperCase()}
                          </Badge>
                        </td>
                        <td>{order.quantity}</td>
                        <td className="text-capitalize">{order.orderType}</td>
                        <td>${order.price.toFixed(2)}</td>
                        <td>
                          <Badge 
                            bg={
                              order.status === 'filled' ? 'success' :
                              order.status === 'pending' ? 'warning' :
                              order.status === 'cancelled' ? 'secondary' : 'danger'
                            }
                          >
                            {order.status.toUpperCase()}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center p-3 text-muted">
                  No recent orders
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Order Confirmation Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} className="text-dark">
        <Modal.Header closeButton>
          <Modal.Title>Confirm Order</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info">
            <AlertTriangle className="me-2" size={16} />
            Please review your order details before submitting.
          </Alert>
          
          <Table striped bordered>
            <tbody>
              <tr>
                <td><strong>Symbol:</strong></td>
                <td>{currentSymbol?.value}</td>
              </tr>
              <tr>
                <td><strong>Side:</strong></td>
                <td className={side === 'buy' ? 'text-success' : 'text-danger'}>
                  {side.toUpperCase()}
                </td>
              </tr>
              <tr>
                <td><strong>Quantity:</strong></td>
                <td>{quantity} shares</td>
              </tr>
              <tr>
                <td><strong>Order Type:</strong></td>
                <td className="text-capitalize">{orderType}</td>
              </tr>
              {(orderType === 'limit' || orderType === 'stop-limit') && (
                <tr>
                  <td><strong>Price:</strong></td>
                  <td>${price}</td>
                </tr>
              )}
              <tr>
                <td><strong>Estimated Value:</strong></td>
                <td><strong>${calculateOrderValue().toLocaleString()}</strong></td>
              </tr>
              {stopLoss && (
                <tr>
                  <td><strong>Stop Loss:</strong></td>
                  <td>${stopLoss}</td>
                </tr>
              )}
              {takeProfit && (
                <tr>
                  <td><strong>Take Profit:</strong></td>
                  <td>${takeProfit}</td>
                </tr>
              )}
              <tr>
                <td><strong>Time in Force:</strong></td>
                <td>{timeInForce}</td>
              </tr>
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
            Cancel
          </Button>
          <Button 
            variant={side === 'buy' ? 'success' : 'danger'} 
            onClick={confirmOrder}
          >
            <CheckCircle className="me-2" size={16} />
            Confirm Order
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default OrderEntry;