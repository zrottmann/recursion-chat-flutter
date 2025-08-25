import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Container, Row, Col, Card, Button, Pagination } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { fetchListings, deleteListing, setCurrentPage } from '../store/slices/listingsSlice';

const MyListings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector(state => state.user);
  const { listings, currentPage, totalPages, loading: listingsLoading } = useSelector(state => state.listings);

  useEffect(() => {
    if (currentUser) {
      dispatch(fetchListings({ page: currentPage, limit: 10, userId: currentUser.id }));
    }
  }, [dispatch, currentUser, currentPage]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await dispatch(deleteListing(id)).unwrap();
        toast.success('Listing deleted successfully!');
        // Refetch listings to ensure UI is in sync with backend
        if (currentUser) {
          dispatch(fetchListings({ page: currentPage, limit: 10, userId: currentUser.id }));
        }
      } catch (error) {
        toast.error('Failed to delete listing');
      }
    }
  };

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
  };

  return (
    <Container className="py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>My Listings</h2>
        <Button
          variant="success"
          onClick={() => navigate('/listings/new')}
        >
          Add New Listing
        </Button>
      </div>

      {listingsLoading ? (
        <p>Loading listings...</p>
      ) : listings.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <h5>No listings yet</h5>
            <p className="text-muted">Create your first listing to get started</p>
            <Button
              variant="primary"
              onClick={() => navigate('/listings/new')}
            >
              Create First Listing
            </Button>
          </Card.Body>
        </Card>
      ) : (
        <>
          <Row>
            {listings.map(listing => (
              <Col md={6} lg={4} key={(listing.$id || listing.id)} className="mb-3">
                <Card 
                  className="h-100" 
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/listings/${(listing.$id || listing.id)}`)}
                >
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mb-0">{listing.title}</h5>
                      <span className="badge bg-primary">{listing.category}</span>
                    </div>
                    {listing.price && (
                      <h6 className="text-success mb-2">${listing.price}</h6>
                    )}
                    <p className="text-muted small mb-2">
                      {listing.description.length > 80 
                        ? `${listing.description.substring(0, 80)}...` 
                        : listing.description
                      }
                    </p>
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        {new Date(listing.created_at).toLocaleDateString()}
                      </small>
                      <div>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          className="me-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/listings/edit/${(listing.$id || listing.id)}`);
                          }}
                        >
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete((listing.$id || listing.id));
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                />
                <Pagination.Prev
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                />
                {[...Array(totalPages)].map((_, idx) => (
                  <Pagination.Item
                    key={idx + 1}
                    active={currentPage === idx + 1}
                    onClick={() => handlePageChange(idx + 1)}
                  >
                    {idx + 1}
                  </Pagination.Item>
                ))}
                <Pagination.Next
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                />
                <Pagination.Last
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                />
              </Pagination>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default MyListings;