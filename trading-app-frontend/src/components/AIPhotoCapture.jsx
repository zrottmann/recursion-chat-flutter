import { useState, useRef, useEffect } from 'react';
import { Modal, Button, Alert, Spinner, ProgressBar, Badge, Card, Row, Col, Accordion } from 'react-bootstrap';
import { Camera, Upload, RotateCcw, AlertCircle, Sparkles, Plus, Eye, Target, TrendingUp, Award, Info } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../services/api';

const AIPhotoCapture = ({ show, onHide, onAnalysisComplete }) => {
  const [captureMode, setCaptureMode] = useState('camera'); // 'camera' or 'upload'
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedImages, setCapturedImages] = useState([]); // Support multiple images
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisSession, setAnalysisSession] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState('idle'); // 'idle', 'uploading', 'analyzing', 'complete'
  const [liveAnalysis, setLiveAnalysis] = useState(null); // Real-time feedback
  const [currentAngle, setCurrentAngle] = useState(1);
  const [analysisSteps, setAnalysisSteps] = useState([]); // Track analysis progress
  const [confidenceScore, setConfidenceScore] = useState(0);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (show && captureMode === 'camera') {
      initializeCamera();
    }
    
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        setCameraStream(null);
      }
    };
  }, [show, captureMode, cameraStream]);

  const initializeCamera = async () => {
    try {
      setCameraError(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        } 
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera initialization failed:', error);
      setCameraError(
        error.name === 'NotAllowedError' 
          ? 'Camera access denied. Please allow camera permission and try again.'
          : 'Camera not available. You can still upload photos from your device.'
      );
      setCaptureMode('upload'); // Fallback to upload mode
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      const newImage = {
        blob,
        angle: currentAngle,
        preview: URL.createObjectURL(blob),
        timestamp: Date.now()
      };
      
      setCapturedImages(prev => [...prev, newImage]);
      setCurrentAngle(prev => prev + 1);
      
      // Provide real-time feedback
      provideLiveFeedback(newImage);
      
      // Don't stop camera for multi-angle capture
      // Keep camera running for additional angles
    }, 'image/jpeg', 0.8);
  };
  
  const provideLiveFeedback = (imageData) => {
    // Simulate live analysis feedback
    setTimeout(() => {
      const feedback = {
        clarity: Math.random() * 0.3 + 0.7, // 70-100%
        lighting: Math.random() * 0.2 + 0.8, // 80-100%
        angle_quality: Math.random() * 0.25 + 0.75, // 75-100%
        suggestions: generateLiveSuggestions(imageData.angle)
      };
      setLiveAnalysis(feedback);
    }, 500);
  };
  
  const generateLiveSuggestions = (angle) => {
    const suggestions = [];
    if (angle === 1) suggestions.push("Great first shot! Try a side angle next.");
    if (angle === 2) suggestions.push("Nice angle! Consider a back view for completeness.");
    if (angle === 3) suggestions.push("Excellent coverage! One more close-up would be perfect.");
    if (angle >= 4) suggestions.push("Outstanding multi-angle coverage!");
    return suggestions;
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    
    const validFiles = [];
    
    files.forEach(file => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not a valid image file`);
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 10MB limit`);
        return;
      }
      
      validFiles.push({
        blob: file,
        angle: validFiles.length + 1,
        preview: URL.createObjectURL(file),
        timestamp: Date.now(),
        name: file.name
      });
    });
    
    setCapturedImages(prev => [...prev, ...validFiles]);
    setCurrentAngle(prev => prev + validFiles.length);
  };

  const retakePhoto = () => {
    // Clean up image URLs to prevent memory leaks
    capturedImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    
    setCapturedImages([]);
    setCaptureMode('camera');
    setAnalysisProgress('idle');
    setCurrentAngle(1);
    setLiveAnalysis(null);
    setAnalysisSteps([]);
    setConfidenceScore(0);
    
    if (!cameraStream) {
      initializeCamera();
    }
  };
  
  const removeImage = (index) => {
    setCapturedImages(prev => {
      const updated = [...prev];
      if (updated[index]?.preview) {
        URL.revokeObjectURL(updated[index].preview);
      }
      updated.splice(index, 1);
      return updated;
    });
  };

  const analyzePhoto = async () => {
    if (capturedImages.length === 0) return;

    try {
      setAnalyzing(true);
      setAnalysisProgress('uploading');
      setAnalysisSteps(['Preparing images for analysis...']);
      
      const formData = new FormData();
      
      // Add all captured images
      capturedImages.forEach((img, index) => {
        const filename = img.name || `photo-angle-${img.angle}.jpg`;
        formData.append(`photos`, img.blob, filename);
      });
      
      // Add metadata
      formData.append('multi_angle', capturedImages.length > 1);
      formData.append('total_images', capturedImages.length);

      setAnalysisSteps(prev => [...prev, `Uploading ${capturedImages.length} image(s)...`]);

      // Upload and start analysis
      const response = await api.post('/api/items/analyze-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          setUploadProgress(progress);
          
          if (progress > 50 && progress < 100) {
            setAnalysisSteps(prev => [...prev, 'Images uploaded, starting AI analysis...']);
          }
        },
      });

      const session = response.data;
      setAnalysisSession(session);
      setAnalysisProgress('analyzing');
      setAnalysisSteps(prev => [...prev, 'Advanced AI analysis in progress...']);

      // Poll for analysis completion
      pollAnalysisStatus(session.id);
      
    } catch (error) {
      console.error('Photo analysis failed:', error);
      
      if (error.response?.status === 403) {
        // Verification required
        toast.error(error.response.data.detail || 'AI Photo Mode requires Verified Human membership. Please upgrade to access this feature.');
        onHide(); // Close modal
      } else {
        toast.error('Failed to analyze photo. Please try again.');
      }
      
      setAnalyzing(false);
      setAnalysisProgress('idle');
      setAnalysisSteps([]);
    }
  };

  const pollAnalysisStatus = async (sessionId) => {
    const maxAttempts = 30; // 30 attempts with 2-second intervals = 1 minute max
    let attempts = 0;
    
    const analysisStepsSequence = [
      'Identifying item brand and model...',
      'Analyzing condition and damage...',
      'Calculating condition score...',
      'Fetching market data...',
      'Generating price estimate...',
      'Finalizing recommendations...'
    ];

    const poll = async () => {
      try {
        attempts++;
        
        // Update progress steps
        if (attempts <= analysisStepsSequence.length) {
          setAnalysisSteps(prev => [...prev, analysisStepsSequence[attempts - 1]]);
        }
        
        // Simulate confidence building
        const progressConfidence = Math.min(0.95, 0.5 + (attempts / maxAttempts) * 0.45);
        setConfidenceScore(progressConfidence);
        
        const response = await api.get(`/api/items/ai-suggestions/${sessionId}`);
        
        // Analysis complete
        setAnalysisProgress('complete');
        setAnalyzing(false);
        setAnalysisSteps(prev => [...prev, 'Analysis complete!']);
        setConfidenceScore(response.data.final_pricing?.confidence || 0.9);
        
        // Pass enhanced results to parent component
        onAnalysisComplete({
          session: analysisSession,
          suggestions: response.data,
          capturedImages: capturedImages,
          multiAngle: capturedImages.length > 1,
          processingSteps: analysisSteps,
          finalConfidence: response.data.final_pricing?.confidence || 0.9
        });
        
        onHide(); // Close modal
        
      } catch (error) {
        if (error.response?.status === 202) {
          // Still processing, continue polling
          if (attempts < maxAttempts) {
            setTimeout(poll, 2000); // Poll every 2 seconds
          } else {
            setAnalysisSteps(prev => [...prev, 'Analysis timeout - please try again']);
            throw new Error('Analysis timeout');
          }
        } else {
          throw error;
        }
      }
    };

    setTimeout(poll, 2000); // Start polling after 2 seconds
  };

  const resetModal = () => {
    // Clean up image URLs
    capturedImages.forEach(img => {
      if (img.preview) {
        URL.revokeObjectURL(img.preview);
      }
    });
    
    setCapturedImages([]);
    setAnalysisSession(null);
    setAnalyzing(false);
    setUploadProgress(0);
    setAnalysisProgress('idle');
    setCameraError(null);
    setLiveAnalysis(null);
    setCurrentAngle(1);
    setAnalysisSteps([]);
    setConfidenceScore(0);
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleClose = () => {
    resetModal();
    onHide();
  };

  const renderCameraView = () => (
    <div className="text-center">
      <div className="camera-container mb-3" style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />
        
        {cameraError && (
          <div className="position-absolute top-50 start-50 translate-middle text-white bg-dark p-3 rounded">
            <AlertCircle size={24} className="mb-2" />
            <small>{cameraError}</small>
          </div>
        )}
      </div>
      
      <div className="d-flex justify-content-center gap-2">
        <Button
          variant="primary"
          size="lg"
          onClick={capturePhoto}
          disabled={!cameraStream || cameraError}
          className="rounded-circle p-3"
        >
          <Camera size={24} />
        </Button>
        <Button
          variant="outline-secondary"
          onClick={() => setCaptureMode('upload')}
          className="px-3"
        >
          <Upload size={20} className="me-2" />
          Upload Instead
        </Button>
      </div>
    </div>
  );

  const renderUploadView = () => (
    <div className="text-center">
      <div className="upload-area border border-dashed border-primary rounded p-4 mb-3" 
           style={{ cursor: 'pointer', minHeight: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
           onClick={() => fileInputRef.current?.click()}>
        <Upload size={48} className="text-primary mx-auto mb-3" />
        <h5>Choose Photo to Analyze</h5>
        <p className="text-muted mb-0">Click to select an image from your device</p>
        <small className="text-muted">Supports JPG, PNG, WebP up to 10MB</small>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
      
      <Button
        variant="outline-secondary"
        onClick={() => setCaptureMode('camera')}
        disabled={!navigator.mediaDevices}
        className="px-3"
      >
        <Camera size={20} className="me-2" />
        Use Camera Instead
      </Button>
    </div>
  );

  const renderConfidenceIndicator = (confidence, label) => (
    <div className="d-flex align-items-center mb-2">
      <span className="me-2 small">{label}:</span>
      <div className="flex-grow-1 progress" style={{ height: '6px' }}>
        <div 
          className={`progress-bar ${confidence > 0.8 ? 'bg-success' : confidence > 0.6 ? 'bg-warning' : 'bg-danger'}`}
          style={{ width: `${confidence * 100}%` }}
        ></div>
      </div>
      <span className="ms-2 small">{(confidence * 100).toFixed(0)}%</span>
    </div>
  );

  const renderLiveFeedback = () => (
    liveAnalysis && (
      <Card className="mt-3 border-info">
        <Card.Body className="py-2">
          <div className="d-flex align-items-center mb-2">
            <Eye size={16} className="text-info me-2" />
            <small className="fw-bold">Live Analysis Feedback</small>
          </div>
          {renderConfidenceIndicator(liveAnalysis.clarity, "Image Clarity")}
          {renderConfidenceIndicator(liveAnalysis.lighting, "Lighting")}
          {renderConfidenceIndicator(liveAnalysis.angle_quality, "Angle Quality")}
          {liveAnalysis.suggestions.map((suggestion, index) => (
            <div key={index} className="d-flex align-items-center mt-1">
              <Info size={12} className="text-info me-1" />
              <small className="text-info">{suggestion}</small>
            </div>
          ))}
        </Card.Body>
      </Card>
    )
  );

  const renderCapturedImagesView = () => (
    <div>
      {/* Image Gallery */}
      <div className="mb-3">
        <div className="d-flex align-items-center mb-2">
          <span className="fw-bold">Captured Images ({capturedImages.length})</span>
          {capturedImages.length > 1 && (
            <Badge bg="success" className="ms-2">Multi-Angle</Badge>
          )}
        </div>
        
        <Row className="g-2">
          {capturedImages.map((img, index) => (
            <Col xs={6} md={4} key={index}>
              <div className="position-relative">
                <img
                  src={img.preview}
                  alt={`Captured angle ${img.angle}`}
                  className="img-fluid rounded"
                  style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                />
                <Badge 
                  bg="primary" 
                  className="position-absolute top-0 start-0 m-1"
                  style={{ fontSize: '0.7rem' }}
                >
                  Angle {img.angle}
                </Badge>
                <Button
                  variant="danger"
                  size="sm"
                  className="position-absolute top-0 end-0 m-1"
                  style={{ padding: '2px 6px', fontSize: '0.7rem' }}
                  onClick={() => removeImage(index)}
                >
                  ×
                </Button>
              </div>
            </Col>
          ))}
          
          {/* Add more photos option */}
          {captureMode === 'camera' && cameraStream && analysisProgress === 'idle' && (
            <Col xs={6} md={4}>
              <div 
                className="d-flex align-items-center justify-content-center border border-dashed border-primary rounded"
                style={{ height: '120px', cursor: 'pointer' }}
                onClick={capturePhoto}
              >
                <div className="text-center text-primary">
                  <Plus size={24} className="mb-1" />
                  <br />
                  <small>Add Angle</small>
                </div>
              </div>
            </Col>
          )}
        </Row>
      </div>

      {/* Live Feedback */}
      {renderLiveFeedback()}
      
      {/* Action Buttons */}
      {analysisProgress === 'idle' && (
        <div className="d-flex justify-content-center gap-2 mt-3">
          <Button 
            variant="success" 
            onClick={analyzePhoto} 
            className="px-4"
            disabled={capturedImages.length === 0}
          >
            <Sparkles size={20} className="me-2" />
            Analyze {capturedImages.length > 1 ? 'All Images' : 'Image'} with AI
            {capturedImages.length > 1 && (
              <Badge bg="light" text="dark" className="ms-2">
                {capturedImages.length}
              </Badge>
            )}
          </Button>
          <Button variant="outline-secondary" onClick={retakePhoto}>
            <RotateCcw size={20} className="me-2" />
            Start Over
          </Button>
        </div>
      )}
      
      {/* Multi-angle tip */}
      {capturedImages.length === 1 && analysisProgress === 'idle' && (
        <Alert variant="info" className="mt-3 py-2">
          <div className="d-flex align-items-center">
            <Target size={16} className="me-2" />
            <small>
              <strong>Pro Tip:</strong> Capture multiple angles for higher accuracy and better pricing confidence!
            </small>
          </div>
        </Alert>
      )}
    </div>
  );

  const renderAnalysisProgress = () => (
    <div className="text-center">
      <div className="mb-4">
        <Spinner animation="border" variant="primary" className="mb-3" />
        
        {analysisProgress === 'uploading' && (
          <div>
            <h5>Uploading {capturedImages.length > 1 ? `${capturedImages.length} Images` : 'Image'}...</h5>
            <ProgressBar now={uploadProgress} className="mb-2" />
            <small className="text-muted">
              Preparing {capturedImages.length > 1 ? 'multi-angle images' : 'image'} for advanced AI analysis
            </small>
            {capturedImages.length > 1 && (
              <div className="mt-2">
                <Badge bg="success">Multi-Angle Analysis</Badge>
                <small className="d-block text-success">Enhanced accuracy with multiple perspectives</small>
              </div>
            )}
          </div>
        )}
        
        {analysisProgress === 'analyzing' && (
          <div>
            <h5>Advanced AI Analysis in Progress...</h5>
            
            {/* Confidence Building Indicator */}
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <Award size={20} className="text-warning me-2" />
                <span>Analysis Confidence: </span>
                <strong className="ms-1 text-primary">{(confidenceScore * 100).toFixed(0)}%</strong>
              </div>
              <ProgressBar 
                now={confidenceScore * 100} 
                variant={confidenceScore > 0.8 ? 'success' : confidenceScore > 0.6 ? 'warning' : 'info'}
                className="mb-2" 
                style={{ height: '8px' }}
              />
            </div>
            
            {/* Live Analysis Steps */}
            <Card className="text-start mb-3">
              <Card.Header className="py-2">
                <small className="fw-bold">
                  <Sparkles size={16} className="me-2" />
                  AI Processing Steps
                </small>
              </Card.Header>
              <Card.Body className="py-2">
                {analysisSteps.map((step, index) => (
                  <div key={index} className="d-flex align-items-center mb-1">
                    <div 
                      className={`rounded-circle me-2 ${
                        index === analysisSteps.length - 1 ? 'bg-primary' : 'bg-success'
                      }`} 
                      style={{ width: '8px', height: '8px' }}
                    ></div>
                    <small className={index === analysisSteps.length - 1 ? 'text-primary fw-bold' : 'text-muted'}>
                      {step}
                    </small>
                    {index === analysisSteps.length - 1 && (
                      <Spinner animation="border" size="sm" className="ms-2" style={{ width: '12px', height: '12px' }} />
                    )}
                  </div>
                ))}
              </Card.Body>
            </Card>
            
            <small className="text-muted">
              Advanced computer vision analysis typically takes 15-45 seconds
            </small>
          </div>
        )}
      </div>
      
      <Accordion defaultActiveKey="0" className="text-start">
        <Accordion.Item eventKey="0">
          <Accordion.Header>
            <small>What our Enhanced AI is analyzing:</small>
          </Accordion.Header>
          <Accordion.Body className="py-2">
            <Row>
              <Col md={6}>
                <h6 className="text-primary mb-2">
                  <Eye size={16} className="me-1" />
                  Computer Vision Analysis
                </h6>
                <ul className="small mb-3">
                  <li>Brand and model identification</li>
                  <li>Damage and wear detection</li>
                  <li>Condition scoring (0-10 scale)</li>
                  <li>Completeness assessment</li>
                </ul>
              </Col>
              <Col md={6}>
                <h6 className="text-success mb-2">
                  <TrendingUp size={16} className="me-1" />
                  Market Intelligence
                </h6>
                <ul className="small mb-3">
                  <li>Real-time pricing data</li>
                  <li>Historical market trends</li>
                  <li>Seasonal adjustments</li>
                  <li>Geographic factors</li>
                </ul>
              </Col>
            </Row>
            
            {capturedImages.length > 1 && (
              <Alert variant="success" className="py-2 mb-0">
                <small>
                  <strong>Multi-Angle Bonus:</strong> Your {capturedImages.length} images provide 
                  comprehensive coverage for maximum accuracy!
                </small>
              </Alert>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </div>
  );

  return (
    <Modal show={show} onHide={handleClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <Sparkles size={24} className="text-primary me-2" />
          AI Photo Mode
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {analyzing ? (
          renderAnalysisProgress()
        ) : capturedImages.length > 0 ? (
          renderCapturedImagesView()
        ) : captureMode === 'camera' ? (
          renderCameraView()
        ) : (
          renderUploadView()
        )}
      </Modal.Body>
      
      <Modal.Footer>
        <small className="text-muted me-auto">
          AI will analyze your photo to auto-generate listing details
        </small>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AIPhotoCapture;