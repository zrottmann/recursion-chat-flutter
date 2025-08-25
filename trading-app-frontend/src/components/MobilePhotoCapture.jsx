import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, RotateCcw, Check, X, Zap, AlertCircle, Loader } from 'lucide-react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../config';

const MobilePhotoCapture = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState('capture'); // 'capture', 'preview', 'processing', 'results'
  const [photo, setPhoto] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [tradeResults, setTradeResults] = useState(null);
  
  // Trade preferences
  const [tradePreferences, setTradePreferences] = useState({
    trade_preference: 'within_percent',
    max_value_difference_percent: 15,
    max_distance_km: 50,
    include_cash_adjustments: true,
    minimum_user_rating: 4.0,
    require_photo_verification: true
  });
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);

  // Initialize camera on mount
  useEffect(() => {
    if (step === 'capture') {
      initializeCamera();
    }
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [step]);

  // Progress polling for processing
  useEffect(() => {
    let intervalId;
    
    if (processing && sessionId) {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/photo-to-trade/status/${sessionId}`);
          const statusData = await response.json();
          
          setProgress(statusData.progress_percentage);
          setCurrentStage(statusData.current_stage);
          
          if (statusData.status === 'completed') {
            // Get results
            const resultsResponse = await fetch(`${API_BASE_URL}/api/photo-to-trade/results/${sessionId}`);
            const results = await resultsResponse.json();
            
            setTradeResults(results);
            setProcessing(false);
            setStep('results');
          } else if (statusData.status === 'failed') {
            toast.error(statusData.error_message || 'Photo analysis failed');
            setProcessing(false);
            setStep('capture');
          }
        } catch (error) {
          console.error('Error checking status:', error);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [processing, sessionId]);

  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsUsingCamera(true);
        setCameraError(null);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      setCameraError('Cannot access camera. Please use file upload instead.');
    }
  };

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw video frame to canvas
    context.drawImage(video, 0, 0);
    
    // Convert to blob
    canvas.toBlob((blob) => {
      const file = new File([blob], 'photo-capture.jpg', { type: 'image/jpeg' });
      const photoUrl = URL.createObjectURL(blob);
      
      setPhoto(photoUrl);
      setPhotoFile(file);
      setStep('preview');
      
      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }, 'image/jpeg', 0.9);
  }, []);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const photoUrl = URL.createObjectURL(file);
      setPhoto(photoUrl);
      setPhotoFile(file);
      setStep('preview');
      
      // Stop camera if running
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
    setPhotoFile(null);
    setStep('capture');
    initializeCamera();
  };

  const startProcessing = async () => {
    if (!photoFile) return;
    
    setProcessing(true);
    setProgress(0);
    setStep('processing');
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('photo', photoFile);
      formData.append('user_id', '1'); // TODO: Get from auth context
      formData.append('trade_preference', tradePreferences.trade_preference);
      formData.append('max_value_difference_percent', tradePreferences.max_value_difference_percent.toString());
      formData.append('max_distance_km', tradePreferences.max_distance_km.toString());
      formData.append('include_cash_adjustments', tradePreferences.include_cash_adjustments.toString());
      formData.append('minimum_user_rating', tradePreferences.minimum_user_rating.toString());
      formData.append('require_photo_verification', tradePreferences.require_photo_verification.toString());
      
      // Start photo-to-trade pipeline
      const response = await fetch(`${API_BASE_URL}/api/photo-to-trade/start`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
      
      const data = await response.json();
      setSessionId(data.session_id);
      
    } catch (error) {
      console.error('Processing error:', error);
      toast.error('Failed to start analysis. Please try again.');
      setProcessing(false);
      setStep('preview');
    }
  };

  const getStageDisplay = (stage) => {
    const stageMap = {
      'photo_upload': 'Uploading photo...',
      'ai_analysis': 'AI analyzing item...',
      'value_estimation': 'Estimating value...',
      'trade_matching': 'Finding trade matches...',
      'result_preparation': 'Preparing results...',
      'completed': 'Complete!'
    };
    return stageMap[stage] || 'Processing...';
  };

  const TradePreferencesPanel = () => (
    <div className="bg-white rounded-lg p-4 mb-4 shadow-sm border">
      <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
        <Zap className="w-4 h-4 mr-2 text-blue-500" />
        Trade Preferences
      </h3>
      
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Matching Style
          </label>
          <select
            value={tradePreferences.trade_preference}
            onChange={(e) => setTradePreferences(prev => ({
              ...prev,
              trade_preference: e.target.value
            }))}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          >
            <option value="within_percent">Within Percentage</option>
            <option value="exact_value">Exact Value</option>
            <option value="flexible">Flexible</option>
            <option value="upgrade_focused">Upgrade Focused</option>
            <option value="value_plus_cash">Value + Cash</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Value Difference: {tradePreferences.max_value_difference_percent}%
          </label>
          <input
            type="range"
            min="5"
            max="50"
            step="5"
            value={tradePreferences.max_value_difference_percent}
            onChange={(e) => setTradePreferences(prev => ({
              ...prev,
              max_value_difference_percent: parseInt(e.target.value)
            }))}
            className="w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Distance: {tradePreferences.max_distance_km} km
          </label>
          <input
            type="range"
            min="10"
            max="200"
            step="10"
            value={tradePreferences.max_distance_km}
            onChange={(e) => setTradePreferences(prev => ({
              ...prev,
              max_distance_km: parseInt(e.target.value)
            }))}
            className="w-full"
          />
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center text-sm">
            <input
              type="checkbox"
              checked={tradePreferences.include_cash_adjustments}
              onChange={(e) => setTradePreferences(prev => ({
                ...prev,
                include_cash_adjustments: e.target.checked
              }))}
              className="mr-2"
            />
            Allow cash adjustments
          </label>
        </div>
      </div>
    </div>
  );

  const TradeResultsPanel = () => {
    if (!tradeResults) return null;
    
    return (
      <div className="space-y-4">
        {/* Item Analysis Summary */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-3">Your Item Analysis</h3>
          
          {tradeResults.photo_analysis && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Estimated Value:</span>
                <span className="font-semibold text-green-600">
                  ${tradeResults.photo_analysis.price_analysis?.estimated_price || 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Confidence:</span>
                <span className="font-medium">
                  {Math.round((tradeResults.photo_analysis.confidence_score || 0) * 100)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Processing Time:</span>
                <span className="text-gray-800">
                  {Math.round(tradeResults.processing_time)}s
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* Trade Matches */}
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center">
            <Check className="w-4 h-4 mr-2 text-green-500" />
            Trade Matches Found: {tradeResults.total_matches_found}
          </h3>
          
          {tradeResults.quick_suggestions?.length > 0 && (
            <div className="space-y-3">
              {tradeResults.quick_suggestions.slice(0, 3).map((suggestion, index) => (
                <div key={suggestion.match_id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-600">
                      Match #{suggestion.rank}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {Math.round(suggestion.score * 100)}% match
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{suggestion.reasoning}</p>
                  <button className="mt-2 text-xs text-blue-600 hover:text-blue-800">
                    View Details →
                  </button>
                </div>
              ))}
              
              {tradeResults.total_matches_found > 3 && (
                <button className="w-full text-sm text-blue-600 hover:text-blue-800 py-2 border border-blue-200 rounded-lg">
                  View All {tradeResults.total_matches_found} Matches
                </button>
              )}
            </div>
          )}
          
          {tradeResults.total_matches_found === 0 && (
            <div className="text-center py-6 text-gray-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No matches found with current preferences.</p>
              <button 
                onClick={() => setStep('preview')}
                className="mt-2 text-sm text-blue-600 hover:text-blue-800"
              >
                Adjust preferences and try again
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-50 rounded-lg w-full max-w-md max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-white p-4 border-b flex justify-between items-center rounded-t-lg">
          <h2 className="text-lg font-semibold text-gray-800">
            {step === 'capture' && 'Capture Item Photo'}
            {step === 'preview' && 'Review & Configure'}
            {step === 'processing' && 'AI Analysis'}
            {step === 'results' && 'Trade Matches'}
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Step: Capture Photo */}
        {step === 'capture' && (
          <div className="p-4 space-y-4">
            {/* Camera View */}
            {isUsingCamera && !cameraError && (
              <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Camera Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg w-64 h-48 opacity-50"></div>
                </div>
                
                {/* Capture Button */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-700" />
                  </button>
                </div>
              </div>
            )}
            
            {/* Camera Error or Alternative Upload */}
            {(cameraError || !isUsingCamera) && (
              <div className="space-y-4">
                {cameraError && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <p className="text-sm text-yellow-800">{cameraError}</p>
                    </div>
                  </div>
                )}
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Upload Photo</p>
                  <p className="text-sm text-gray-500 mt-1">Tap to select from gallery</p>
                </div>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
            
            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-800 mb-2">Photo Tips:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Ensure good lighting</li>
                <li>• Show the entire item</li>
                <li>• Include any defects or wear</li>
                <li>• Avoid shadows and reflections</li>
              </ul>
            </div>
          </div>
        )}

        {/* Step: Preview & Configure */}
        {step === 'preview' && (
          <div className="p-4 space-y-4">
            {/* Photo Preview */}
            <div className="aspect-[4/3] bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={photo}
                alt="Captured item"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Trade Preferences */}
            <TradePreferencesPanel />
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={retakePhoto}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retake
              </button>
              <button
                onClick={startProcessing}
                className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Find Trades
              </button>
            </div>
          </div>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="p-6 text-center space-y-6">
            <div className="w-24 h-24 mx-auto">
              <Loader className="w-24 h-24 text-blue-500 animate-spin" />
            </div>
            
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">AI Analysis in Progress</h3>
              <p className="text-sm text-gray-600">{getStageDisplay(currentStage)}</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{Math.round(progress)}% Complete</p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                Our AI is analyzing your item's condition, estimating its value, 
                and finding perfect trade matches. This usually takes 30-60 seconds.
              </p>
            </div>
          </div>
        )}

        {/* Step: Results */}
        {step === 'results' && (
          <div className="p-4 space-y-4">
            <TradeResultsPanel />
            
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setStep('capture');
                  setPhoto(null);
                  setPhotoFile(null);
                  setTradeResults(null);
                  setSessionId(null);
                  setProcessing(false);
                  setProgress(0);
                }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                New Photo
              </button>
              <button
                onClick={() => onComplete && onComplete(tradeResults)}
                className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                View All Matches
              </button>
            </div>
          </div>
        )}

        {/* Hidden Canvas for Photo Capture */}
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};

export default MobilePhotoCapture;