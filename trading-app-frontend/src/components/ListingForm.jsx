import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Form, Button, Card, Row, Col, Alert } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { Sparkles, Lock } from 'lucide-react';
import { createListing, updateListing } from '../store/slices/listingsSlice';
import api from '../services/api';
import featureService from '../services/featureImplementation';
import AIPhotoCapture from './AIPhotoCapture';
import AIListingReview from './AIListingReview';
import { useAuth } from '../hooks/useAuth';

const schema = yup.object({
  title: yup.string().required('Title is required').min(3, 'Title must be at least 3 characters'),
  description: yup.string().required('Description is required').min(10, 'Description must be at least 10 characters'),
  price: yup.number().required('Price is required').min(0, 'Price must be positive'),
  listing_type: yup.string().oneOf(['sale', 'service'], 'Please select listing type').required('Type is required'),
  condition: yup.string().when('listing_type', {
    is: 'sale',
    then: (schema) => schema.required('Condition is required'),
    otherwise: (schema) => schema.nullable()
  }),
  service_type: yup.string().when('listing_type', {
    is: 'service',
    then: (schema) => schema.required('Service type is required'),
    otherwise: (schema) => schema.nullable()
  }),
  hourly_rate: yup.number().when('service_type', {
    is: 'hourly',
    then: (schema) => schema.required('Hourly rate is required').min(0),
    otherwise: (schema) => schema.nullable()
  }),
});

const ListingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { loading } = useSelector(state => state.listings);
  const { user } = useAuth();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showAIPhotoCapture, setShowAIPhotoCapture] = useState(false);
  const [showAIReview, setShowAIReview] = useState(false);
  const [aiAnalysisData, setAIAnalysisData] = useState(null);
  const [isAIGenerated, setIsAIGenerated] = useState(false);
  
  // Check if user has verified human membership for AI features
  const isVerifiedHuman = user?.is_verified_human || false;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      price: 0,
      listing_type: 'sale',
      condition: 'good',
      service_type: '',
      hourly_rate: 0,
    }
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const response = await api.get(`/items/${id}`);
        reset({
          title: response.data.title,
          description: response.data.description,
          price: response.data.price,
          listing_type: response.data.listing_type || 'sale',
          condition: response.data.condition || 'good',
          service_type: response.data.service_type || '',
          hourly_rate: response.data.hourly_rate || 0,
        });
        setUploadedImages(response.data.images || []);
      } catch (error) {
        toast.error('Failed to fetch listing');
        navigate('/profile');
      }
    };

    if (id) {
      fetchListing();
    }
  }, [id, reset, navigate]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    
    try {
      // Use feature service for image upload
      const result = await featureService.uploadImages(files);
      
      if (result.success) {
        const imageUrls = result.images.map(img => img.url);
        setUploadedImages([...uploadedImages, ...imageUrls]);
      } else {
        // Fallback to legacy API if feature service fails
        const uploadPromises = files.map(async (file) => {
          const formData = new FormData();
          formData.append('file', file);
          const response = await api.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          });
          return response.data.url;
        });
        
        const urls = await Promise.all(uploadPromises);
        setUploadedImages([...uploadedImages, ...urls]);
        toast.success(`${files.length} image(s) uploaded successfully`);
      }
    } catch (error) {
      console.error('Image upload failed:', error);
      toast.error('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  // AI Photo Mode handlers
  const handleAIAnalysisComplete = (analysisData) => {
    setAIAnalysisData(analysisData);
    setShowAIPhotoCapture(false);
    setShowAIReview(true);
  };

  const handleAIListingCreated = (listing) => {
    setIsAIGenerated(true);
    toast.success('AI-powered listing created successfully!');
    navigate(`/item/${(listing.$id || listing.id)}`);
  };

  // populateFromAI function temporarily disabled - not used in current implementation
  // const populateFromAI = (suggestions) => {
  //   if (suggestions) {
  //     reset({
  //       title: suggestions.suggested_title || '',
  //       description: suggestions.suggested_description || '',
  //       price: suggestions.suggested_price || 0,
  //       listing_type: 'sale',
  //       condition: suggestions.suggested_condition || 'good',
  //       service_type: '',
  //       hourly_rate: 0,
  //     });
  //     
  //     // Add AI photo to uploaded images if available
  //     if (aiAnalysisData?.session?.image_path) {
  //       setUploadedImages([aiAnalysisData.session.image_path]);
  //     }
  //     
  //     setIsAIGenerated(true);
  //     setShowAIReview(false);
  //     toast.info('Form populated with AI suggestions. Review and edit as needed.');
  //   }
  // };

  const onSubmit = async (data) => {
    try {
      // Auto-generate category based on title and description
      let category = 'Other';
      const text = `${data.title} ${data.description}`.toLowerCase();
      
      if (text.includes('car') || text.includes('vehicle') || text.includes('truck')) category = 'Vehicles';
      else if (text.includes('furniture') || text.includes('chair') || text.includes('table') || text.includes('sofa')) category = 'Furniture';
      else if (text.includes('electronic') || text.includes('phone') || text.includes('computer') || text.includes('tv') || text.includes('ps5') || text.includes('xbox')) category = 'Electronics';
      else if (text.includes('cloth') || text.includes('shirt') || text.includes('dress') || text.includes('shoes')) category = 'Clothing';
      else if (text.includes('service') || data.listing_type === 'service') category = 'Services';
      
      const listingData = {
        title: data.title,
        description: data.description,
        category,
        condition: data.condition || 'good',
        estimated_value: parseFloat(data.price),
        images: uploadedImages,
        tags: [data.listing_type, category.toLowerCase()],
      };

      if (id) {
        const result = await featureService.updateListing(id, listingData);
        if (result.success) {
          // Also update via Redux for UI state consistency
          await dispatch(updateListing({ id, data: { ...data, category, images: uploadedImages } })).unwrap();
          navigate('/profile');
        }
      } else {
        const result = await featureService.createListing(listingData);
        if (result.success) {
          // Also create via Redux for UI state consistency
          await dispatch(createListing({ ...data, category, images: uploadedImages })).unwrap();
          navigate('/profile');
        }
      }
    } catch (error) {
      console.error('Listing operation failed:', error);
      toast.error(id ? 'Failed to update listing' : 'Failed to create listing');
    }
  };

  return (
    <Container className="py-4">
      <Card className="mx-auto" style={{ maxWidth: '600px' }}>
        <Card.Body>
          <h2 className="mb-4">{id ? 'Edit Listing' : 'Create New Listing'}</h2>
          
          {/* AI Photo Mode Banner */}
          {!id && !isAIGenerated && (
            <Alert variant={isVerifiedHuman ? "info" : "warning"} className="mb-4">
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  {isVerifiedHuman ? (
                    <Sparkles size={20} className="text-primary me-2" />
                  ) : (
                    <Lock size={20} className="text-warning me-2" />
                  )}
                  <div>
                    {isVerifiedHuman ? (
                      <>
                        <strong>New! AI Photo Mode</strong>
                        <div className="small">Take a photo and let AI create your listing automatically</div>
                      </>
                    ) : (
                      <>
                        <strong>AI Photo Mode - Premium Feature</strong>
                        <div className="small">Upgrade to Verified Human membership to access AI-powered listing creation</div>
                      </>
                    )}
                  </div>
                </div>
                {isVerifiedHuman ? (
                  <Button variant="primary" onClick={() => setShowAIPhotoCapture(true)}>
                    <Sparkles size={16} className="me-2" />
                    Try AI Photo Mode
                  </Button>
                ) : (
                  <Button variant="outline-warning" onClick={() => navigate('/membership')}>
                    <Lock size={16} className="me-2" />
                    Upgrade Membership
                  </Button>
                )}
              </div>
            </Alert>
          )}
          
          {isAIGenerated && (
            <Alert variant="success" className="mb-4">
              <div className="d-flex align-items-center">
                <Sparkles size={20} className="text-success me-2" />
                <div>
                  <strong>AI-Generated Listing</strong>
                  <div className="small">This listing was created using AI analysis. Review and edit as needed.</div>
                </div>
              </div>
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-4">
              <Form.Label>Photos</Form.Label>
              <div className="border rounded p-3">
                {uploadedImages.length > 0 && (
                  <Row className="mb-3">
                    {uploadedImages.map((url, index) => (
                      <Col xs={4} md={3} key={index} className="mb-2">
                        <div className="position-relative">
                          <img 
                            src={`${api.defaults.baseURL}${url}`} 
                            alt={`Upload ${index + 1}`}
                            className="img-fluid rounded"
                            style={{ height: '100px', width: '100%', objectFit: 'cover' }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-1"
                            onClick={() => removeImage(index)}
                          >
                            ×
                          </Button>
                        </div>
                      </Col>
                    ))}
                  </Row>
                )}
                <Form.Control
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading || uploadedImages.length >= 8}
                />
                <Form.Text className="text-muted">
                  {uploading ? 'Uploading...' : `Add up to 8 photos (${uploadedImages.length}/8)`}
                </Form.Text>
              </div>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control
                type="text"
                {...register('title')}
                isInvalid={!!errors.title}
              />
              <Form.Control.Feedback type="invalid">
                {errors.title?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                {...register('description')}
                isInvalid={!!errors.description}
              />
              <Form.Control.Feedback type="invalid">
                {errors.description?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Listing Type</Form.Label>
              <Form.Select
                {...register('listing_type')}
                isInvalid={!!errors.listing_type}
              >
                <option value="sale">Item for Sale</option>
                <option value="service">Service Offered</option>
              </Form.Select>
              <Form.Control.Feedback type="invalid">
                {errors.listing_type?.message}
              </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Price</Form.Label>
              <Form.Control
                type="number"
                step="0.01"
                {...register('price')}
                isInvalid={!!errors.price}
                placeholder="0.00"
              />
              <Form.Control.Feedback type="invalid">
                {errors.price?.message}
              </Form.Control.Feedback>
            </Form.Group>

            {watch('listing_type') === 'sale' && (
              <Form.Group className="mb-3">
                <Form.Label>Condition</Form.Label>
                <Form.Select
                  {...register('condition')}
                  isInvalid={!!errors.condition}
                >
                  <option value="new">New</option>
                  <option value="like_new">Like New</option>
                  <option value="good">Good</option>
                  <option value="fair">Fair</option>
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {errors.condition?.message}
                </Form.Control.Feedback>
              </Form.Group>
            )}

            {watch('listing_type') === 'service' && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Service Type</Form.Label>
                  <Form.Select
                    {...register('service_type')}
                    isInvalid={!!errors.service_type}
                  >
                    <option value="">Select pricing type</option>
                    <option value="hourly">Hourly Rate</option>
                    <option value="fixed">Fixed Price</option>
                    <option value="quote">Contact for Quote</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.service_type?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                {watch('service_type') === 'hourly' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Hourly Rate</Form.Label>
                    <Form.Control
                      type="number"
                      step="0.01"
                      {...register('hourly_rate')}
                      isInvalid={!!errors.hourly_rate}
                      placeholder="0.00"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.hourly_rate?.message}
                    </Form.Control.Feedback>
                  </Form.Group>
                )}
              </>
            )}

            <div className="d-flex gap-2">
              <Button
                type="submit"
                variant="primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (id ? 'Update Listing' : 'Create Listing')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/profile')}
              >
                Cancel
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
      
      {/* AI Photo Capture Modal */}
      <AIPhotoCapture
        show={showAIPhotoCapture}
        onHide={() => setShowAIPhotoCapture(false)}
        onAnalysisComplete={handleAIAnalysisComplete}
      />
      
      {/* AI Listing Review Modal */}
      <AIListingReview
        show={showAIReview}
        onHide={() => setShowAIReview(false)}
        analysisData={aiAnalysisData}
        onCreateListing={handleAIListingCreated}
      />
    </Container>
  );
};

export default ListingForm;