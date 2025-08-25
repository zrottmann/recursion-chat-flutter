import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Badge } from 'react-bootstrap';
import { toast } from 'react-toastify';

const DesignCustomizer = () => {
  const defaultColors = {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    dark: '#343a40',
    light: '#f8f9fa'
  };

  const [colors, setColors] = useState(defaultColors);
  const [savedColors, setSavedColors] = useState(defaultColors);
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'unsaved'
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const saveTimeoutRef = useRef(null);
  const hasUnsavedChangesRef = useRef(false);

  // Load saved colors on component mount
  useEffect(() => {
    const loadedColors = loadColorsFromStorage();
    if (loadedColors) {
      setColors(loadedColors);
      setSavedColors(loadedColors);
      applyColors(loadedColors);
      console.log('🎨 Loaded saved colors:', loadedColors);
    }
  }, []);

  // Auto-save with debouncing (500ms after last change)
  useEffect(() => {
    if (!autoSaveEnabled) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if colors have changed
    const hasChanged = JSON.stringify(colors) !== JSON.stringify(savedColors);
    hasUnsavedChangesRef.current = hasChanged;

    if (hasChanged) {
      setSaveStatus('unsaved');
      
      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        autoSaveColors();
      }, 500); // Save after 500ms of inactivity
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [colors, savedColors, autoSaveEnabled]);

  // Save on component unmount (when navigating away)
  useEffect(() => {
    return () => {
      if (hasUnsavedChangesRef.current) {
        // Synchronous save on unmount
        localStorage.setItem('customColors', JSON.stringify(colors));
        console.log('💾 Auto-saved on navigation');
      }
    };
  }, [colors]);

  // Save on browser refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (hasUnsavedChangesRef.current) {
        // Save immediately
        localStorage.setItem('customColors', JSON.stringify(colors));
        
        // Optional: Show browser's default confirmation dialog
        // Uncomment if you want to warn users before closing
        // e.preventDefault();
        // e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [colors]);

  // Load colors from localStorage
  const loadColorsFromStorage = () => {
    const saved = localStorage.getItem('customColors');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (error) {
        console.error('Error loading saved colors:', error);
        return null;
      }
    }
    return null;
  };

  // Auto-save function
  const autoSaveColors = useCallback(() => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('customColors', JSON.stringify(colors));
      setSavedColors(colors);
      setSaveStatus('saved');
      hasUnsavedChangesRef.current = false;
      console.log('✅ Auto-saved colors');
      
      // Show subtle notification
      toast.success('Colors auto-saved', {
        position: 'bottom-right',
        autoClose: 1000,
        hideProgressBar: true,
        closeButton: false,
        style: { fontSize: '14px' }
      });
    } catch (error) {
      console.error('Error auto-saving colors:', error);
      setSaveStatus('unsaved');
      toast.error('Failed to auto-save colors');
    }
  }, [colors]);

  // Apply colors to CSS variables
  const applyColors = useCallback((colorScheme) => {
    const root = document.documentElement;
    Object.entries(colorScheme).forEach(([key, value]) => {
      root.style.setProperty(`--bs-${key}`, value);
      root.style.setProperty(`--${key}`, value);
    });
    updateBootstrapColors(colorScheme);
  }, []);

  const updateBootstrapColors = (colorScheme) => {
    let styleEl = document.getElementById('custom-theme-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'custom-theme-styles';
      document.head.appendChild(styleEl);
    }

    styleEl.innerHTML = `
      .btn-primary {
        background-color: ${colorScheme.primary} !important;
        border-color: ${colorScheme.primary} !important;
      }
      .btn-primary:hover {
        background-color: ${darkenColor(colorScheme.primary, 10)} !important;
        border-color: ${darkenColor(colorScheme.primary, 10)} !important;
      }
      .btn-secondary {
        background-color: ${colorScheme.secondary} !important;
        border-color: ${colorScheme.secondary} !important;
      }
      .btn-success {
        background-color: ${colorScheme.success} !important;
        border-color: ${colorScheme.success} !important;
      }
      .btn-danger {
        background-color: ${colorScheme.danger} !important;
        border-color: ${colorScheme.danger} !important;
      }
      .btn-warning {
        background-color: ${colorScheme.warning} !important;
        border-color: ${colorScheme.warning} !important;
      }
      .btn-info {
        background-color: ${colorScheme.info} !important;
        border-color: ${colorScheme.info} !important;
      }
      .bg-primary {
        background-color: ${colorScheme.primary} !important;
      }
      .text-primary {
        color: ${colorScheme.primary} !important;
      }
      .border-primary {
        border-color: ${colorScheme.primary} !important;
      }
      .navbar {
        background-color: ${colorScheme.dark} !important;
      }
      .card-header {
        background-color: ${colorScheme.light} !important;
        border-bottom-color: ${colorScheme.secondary} !important;
      }
      a {
        color: ${colorScheme.primary};
      }
      a:hover {
        color: ${darkenColor(colorScheme.primary, 15)};
      }
    `;
  };

  const darkenColor = (color, percent) => {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = ((num >> 16) & 0xFF) - amt;
    const G = ((num >> 8) & 0x00FF) - amt;
    const B = (num & 0x0000FF) - amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  };

  const handleColorChange = (colorKey, value) => {
    const newColors = { ...colors, [colorKey]: value };
    setColors(newColors);
    applyColors(newColors);
  };

  const manualSaveColors = () => {
    // Clear any pending auto-save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    setSaveStatus('saving');
    try {
      localStorage.setItem('customColors', JSON.stringify(colors));
      setSavedColors(colors);
      setSaveStatus('saved');
      hasUnsavedChangesRef.current = false;
      toast.success('Colors saved successfully!');
      console.log('💾 Manually saved colors');
    } catch (error) {
      console.error('Error saving colors:', error);
      setSaveStatus('unsaved');
      toast.error('Failed to save colors');
    }
  };

  const resetColors = () => {
    setColors(defaultColors);
    setSavedColors(defaultColors);
    applyColors(defaultColors);
    localStorage.removeItem('customColors');
    setSaveStatus('saved');
    hasUnsavedChangesRef.current = false;
    toast.info('Colors reset to defaults');
  };

  const exportColors = () => {
    const dataStr = JSON.stringify(colors, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `theme-colors-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('Theme exported successfully!');
  };

  const importColors = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedColors = JSON.parse(e.target.result);
          setColors(importedColors);
          applyColors(importedColors);
          setSaveStatus('unsaved');
          toast.success('Theme imported! Auto-saving...');
        } catch (error) {
          console.error('Error importing colors:', error);
          toast.error('Invalid theme file');
        }
      };
      reader.readAsText(file);
    }
  };

  // Get status badge color and text
  const getStatusBadge = () => {
    switch (saveStatus) {
      case 'saved':
        return <Badge bg="success">✓ All changes saved</Badge>;
      case 'saving':
        return <Badge bg="warning">⏳ Saving...</Badge>;
      case 'unsaved':
        return <Badge bg="danger">● Unsaved changes</Badge>;
      default:
        return null;
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col lg={8} className="mx-auto">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Design Customizer</h3>
              <div className="d-flex align-items-center gap-3">
                {getStatusBadge()}
                <Form.Check
                  type="switch"
                  id="auto-save-switch"
                  label="Auto-save"
                  checked={autoSaveEnabled}
                  onChange={(e) => setAutoSaveEnabled(e.target.checked)}
                  className="mb-0"
                />
              </div>
            </Card.Header>
            <Card.Body>
              <Alert variant="success" className="d-flex align-items-center">
                <span className="me-2">🚀</span>
                <div>
                  <strong>Intelligent Auto-Save Enabled!</strong><br />
                  <small>Your colors are automatically saved as you change them. No need to click save!</small>
                </div>
              </Alert>

              <p className="text-muted mb-4">
                Customize your Trading Post color scheme. Changes are saved automatically after you stop editing.
              </p>

              <Row>
                {colors && typeof colors === 'object' && Object.entries(colors).map(([key, value]) => (
                  <Col md={6} lg={3} key={key} className="mb-3">
                    <Form.Group>
                      <Form.Label className="text-capitalize d-flex justify-content-between">
                        {key} Color
                        {colors[key] !== defaultColors[key] && (
                          <small className="text-primary">Modified</small>
                        )}
                      </Form.Label>
                      <div className="d-flex align-items-center">
                        <Form.Control
                          type="color"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          style={{ width: '60px', marginRight: '10px' }}
                        />
                        <Form.Control
                          type="text"
                          value={value}
                          onChange={(e) => handleColorChange(key, e.target.value)}
                          pattern="^#[0-9A-Fa-f]{6}$"
                          size="sm"
                        />
                      </div>
                      <div 
                        className="mt-2 p-2 rounded text-center"
                        style={{ 
                          backgroundColor: value,
                          color: key === 'light' || key === 'warning' ? '#000' : '#fff',
                          fontSize: '12px'
                        }}
                      >
                        Preview
                      </div>
                    </Form.Group>
                  </Col>
                ))}
              </Row>

              <hr className="my-4" />

              <div className="d-flex justify-content-between flex-wrap gap-2">
                <div>
                  <Button 
                    variant="success" 
                    onClick={manualSaveColors}
                    className="me-2"
                    disabled={saveStatus === 'saved'}
                  >
                    💾 Save Now
                  </Button>
                  <Button 
                    variant="secondary" 
                    onClick={resetColors}
                    className="me-2"
                  >
                    ↺ Reset to Defaults
                  </Button>
                </div>
                <div>
                  <Button 
                    variant="info" 
                    onClick={exportColors}
                    className="me-2"
                  >
                    📥 Export Theme
                  </Button>
                  <label className="btn btn-warning mb-0">
                    📤 Import Theme
                    <input 
                      type="file" 
                      accept=".json"
                      onChange={importColors}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
              </div>

              <Alert variant="info" className="mt-4 mb-0">
                <strong>✨ Smart Features:</strong>
                <ul className="mb-0 mt-2">
                  <li>Auto-saves after 0.5 seconds of inactivity</li>
                  <li>Saves when you navigate away from this page</li>
                  <li>Saves when you close or refresh your browser</li>
                  <li>Visual indicator shows save status in real-time</li>
                </ul>
              </Alert>
            </Card.Body>
          </Card>

          {/* Preview Section */}
          <Card className="mt-4">
            <Card.Header>
              <h4 className="mb-0">Live Preview</h4>
            </Card.Header>
            <Card.Body>
              <div className="d-flex flex-wrap gap-2 mb-3">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="success">Success</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="warning">Warning</Button>
                <Button variant="info">Info</Button>
                <Button variant="dark">Dark</Button>
                <Button variant="light">Light</Button>
              </div>
              
              <Alert variant="primary">This is a primary alert with your custom color!</Alert>
              <Alert variant="success">Success alert with custom styling</Alert>
              
              <div className="progress mt-3">
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ width: '60%', backgroundColor: colors.primary }}
                >
                  60%
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DesignCustomizer;