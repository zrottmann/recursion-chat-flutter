"""
Secure Payment API Endpoints for Trading Post
Replaces the fake membership subscription system with real payment processing
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, validator
from typing import Optional, List
import logging
from datetime import datetime

from payment_service import payment_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/payments", tags=["payments"])
security = HTTPBearer()


# Pydantic models for API
class PaymentIntentRequest(BaseModel):
    """Request model for creating payment intent"""

    membership_type: str = "verified_human"
    amount_cents: Optional[int] = 500  # $5.00 default
    currency: str = "usd"

    @validator("amount_cents")
    def validate_amount(cls, v):
        if v < 50:  # Minimum $0.50
            raise ValueError("Amount must be at least 50 cents")
        if v > 100000:  # Maximum $1000
            raise ValueError("Amount cannot exceed $1000")
        return v


class PaymentIntentResponse(BaseModel):
    """Response model for payment intent"""

    client_secret: str
    payment_intent_id: str
    amount_cents: int
    currency: str
    publishable_key: str


class SubscriptionStatusResponse(BaseModel):
    """Response model for subscription status"""

    is_active: bool
    membership_type: Optional[str]
    expires_at: Optional[datetime]
    payment_verified: bool


class PaymentHistoryResponse(BaseModel):
    """Response model for payment history"""

    transactions: List[dict]


# Dependency to get database session
def get_db():
    from ai_matching import SessionLocal

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Dependency to get current user
def get_current_user(token: str = Depends(security), db: Session = Depends(get_db)):
    """Get current authenticated user"""
    from ai_matching import get_current_user as base_get_current_user

    # Use the existing authentication system
    return base_get_current_user(token.credentials, db)


def get_client_ip(request: Request) -> str:
    """Extract client IP from request headers"""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host


@router.post("/create-payment-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    http_request: Request,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a secure payment intent with Stripe

    CRITICAL: This does NOT activate membership - only creates payment intent
    Membership activation happens only after webhook confirms payment
    """
    try:
        # Security check: validate user is authenticated
        if not current_user:
            raise HTTPException(status_code=401, detail="Authentication required")

        # Get client context for security logging
        client_ip = get_client_ip(http_request)
        user_agent = http_request.headers.get("User-Agent", "Unknown")

        # Create payment intent through secure service
        intent_data = payment_service.create_payment_intent(
            user_id=current_user.id,
            amount_cents=request.amount_cents,
            currency=request.currency,
            description=f"Trading Post {request.membership_type} membership",
            db=db,
            client_ip=client_ip,
            user_agent=user_agent,
        )

        # Add publishable key for frontend
        intent_data["publishable_key"] = payment_service.stripe_publishable_key

        logger.info(f"Payment intent created for user {current_user.id}")

        return PaymentIntentResponse(**intent_data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """
    Stripe webhook handler - CRITICAL SECURITY ENDPOINT

    This is the ONLY place where membership activation should happen
    Webhook signature verification ensures requests come from Stripe
    """
    try:
        payload = await request.body()
        signature = request.headers.get("stripe-signature")

        if not signature:
            logger.error("Missing Stripe signature in webhook")
            raise HTTPException(status_code=400, detail="Missing signature")

        # Process webhook through secure service
        result = payment_service.handle_payment_webhook(payload, signature, db)

        logger.info(f"Webhook processed: {result}")
        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook processing error: {str(e)}")
        raise HTTPException(status_code=500, detail="Webhook processing failed")


@router.get("/subscription-status", response_model=SubscriptionStatusResponse)
async def get_subscription_status(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get current user's subscription status with security validation
    """
    try:
        from ai_matching import Membership

        # Validate membership is legitimate
        validation_result = payment_service.validate_membership_status(current_user.id, db)

        if not validation_result["valid"]:
            return SubscriptionStatusResponse(
                is_active=False,
                membership_type=None,
                expires_at=None,
                payment_verified=False,
            )

        # Get membership details
        membership = db.query(Membership).filter(Membership.user_id == current_user.id, Membership.is_active).first()

        return SubscriptionStatusResponse(
            is_active=True,
            membership_type=membership.membership_type if membership else None,
            expires_at=membership.end_date if membership else None,
            payment_verified=True,
        )

    except Exception as e:
        logger.error(f"Error getting subscription status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/cancel-subscription")
async def cancel_subscription(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Cancel user's subscription
    """
    try:
        result = payment_service.cancel_subscription(
            user_id=current_user.id, db=db, reason="User requested cancellation"
        )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.get("/payment-history", response_model=PaymentHistoryResponse)
async def get_payment_history(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Get user's payment history
    """
    try:
        transactions = payment_service.get_payment_history(current_user.id, db)

        return PaymentHistoryResponse(transactions=transactions)

    except Exception as e:
        logger.error(f"Error getting payment history: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.post("/verify-membership")
async def verify_membership_security(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    """
    Security endpoint to verify membership legitimacy

    This endpoint can be called by other services to verify
    that a user's membership was activated via legitimate payment
    """
    try:
        validation_result = payment_service.validate_membership_status(current_user.id, db)

        return {
            "user_id": current_user.id,
            "membership_valid": validation_result["valid"],
            "reason": validation_result.get("reason", "Valid"),
            "verified_at": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        logger.error(f"Error verifying membership: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")


# REMOVE THE OLD FAKE ENDPOINT
@router.post("/memberships/subscribe")
async def deprecated_fake_subscribe():
    """
    DEPRECATED: This was the old fake subscription endpoint

    Redirects to proper payment flow to prevent security bypass
    """
    raise HTTPException(
        status_code=410,  # Gone
        detail={
            "error": "This endpoint has been removed for security reasons",
            "message": "Please use the new secure payment flow",
            "new_endpoint": "/api/payments/create-payment-intent",
        },
    )


def get_payment_router():
    """Export router for inclusion in main app"""
    return router
