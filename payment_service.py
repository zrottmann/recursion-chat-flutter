"""
Secure Payment Processing Service for Trading Post
Integrates with Stripe for PCI-compliant payment processing
"""

import stripe
import os
import logging
from typing import Dict, List
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from fastapi import HTTPException
from payment_models import (
    PaymentTransaction,
    PaymentStatus,
    SubscriptionStatus,
    SubscriptionAuditLog,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class PaymentService:
    """
    Secure payment processing service with comprehensive security measures
    """

    def __init__(self):
        # Initialize Stripe with environment variables
        self.stripe_secret_key = os.getenv("STRIPE_SECRET_KEY")
        self.stripe_publishable_key = os.getenv("STRIPE_PUBLISHABLE_KEY")
        self.stripe_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

        if not self.stripe_secret_key:
            raise ValueError("STRIPE_SECRET_KEY environment variable is required")

        stripe.api_key = self.stripe_secret_key
        logger.info("Payment service initialized with Stripe")

    def create_payment_intent(
        self,
        user_id: int,
        amount_cents: int,
        currency: str = "usd",
        description: str = "Trading Post Verified Human Membership",
        db: Session = None,
        client_ip: str = None,
        user_agent: str = None,
    ) -> Dict:
        """
        Create a secure payment intent with Stripe

        CRITICAL: This only creates the intent, does NOT activate membership
        Membership is only activated after webhook confirms payment
        """
        try:
            # Create Stripe customer if doesn't exist
            stripe_customer = self._get_or_create_stripe_customer(user_id, db)

            # Create payment intent with Stripe
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency,
                customer=stripe_customer.id,
                description=description,
                metadata={
                    "user_id": str(user_id),
                    "service": "trading_post_membership",
                },
                # Security features
                confirmation_method="automatic",
                capture_method="automatic",
            )

            # Create local payment transaction record
            payment_transaction = PaymentTransaction(
                user_id=user_id,
                stripe_payment_intent_id=intent.id,
                stripe_customer_id=stripe_customer.id,
                amount_cents=amount_cents,
                currency=currency,
                description=description,
                status=PaymentStatus.PENDING,
                client_ip=client_ip,
                user_agent=user_agent,
                initiated_at=datetime.utcnow(),
            )

            db.add(payment_transaction)
            db.commit()

            logger.info(f"Payment intent created: {intent.id} for user {user_id}")

            return {
                "client_secret": intent.client_secret,
                "payment_intent_id": intent.id,
                "amount_cents": amount_cents,
                "currency": currency,
            }

        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Payment processing error: {str(e)}")
        except SQLAlchemyError as e:
            logger.error(f"Database error creating payment transaction: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Database error")
        except Exception as e:
            logger.error(f"Unexpected error creating payment intent: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal server error")

    def _get_or_create_stripe_customer(self, user_id: int, db: Session) -> stripe.Customer:
        """
        Get existing Stripe customer or create a new one
        """
        from ai_matching import User  # Import here to avoid circular imports

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Check if user has existing Stripe customer
        existing_membership = db.query(User).filter(User.id == user_id).first()
        if hasattr(existing_membership, "stripe_customer_id") and existing_membership.stripe_customer_id:
            try:
                customer = stripe.Customer.retrieve(existing_membership.stripe_customer_id)
                return customer
            except stripe.error.StripeError:
                # Customer doesn't exist in Stripe, create new one
                pass

        # Create new Stripe customer
        customer = stripe.Customer.create(email=user.email, name=user.username, metadata={"user_id": str(user_id)})

        logger.info(f"Created Stripe customer {customer.id} for user {user_id}")
        return customer

    def handle_payment_webhook(self, payload: bytes, signature: str, db: Session) -> Dict:
        """
        Handle Stripe webhook events securely

        CRITICAL: This is the ONLY place where membership activation should happen
        Never trust client-side payment confirmations
        """
        try:
            # Verify webhook signature for security
            event = stripe.Webhook.construct_event(payload, signature, self.stripe_webhook_secret)

        except ValueError as e:
            logger.error(f"Invalid payload in webhook: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature in webhook: {str(e)}")
            raise HTTPException(status_code=400, detail="Invalid signature")

        # Handle different event types
        if event["type"] == "payment_intent.succeeded":
            return self._handle_payment_success(event["data"]["object"], db)
        elif event["type"] == "payment_intent.payment_failed":
            return self._handle_payment_failure(event["data"]["object"], db)
        elif event["type"] == "payment_intent.canceled":
            return self._handle_payment_cancellation(event["data"]["object"], db)
        else:
            logger.info(f"Unhandled webhook event type: {event['type']}")
            return {"status": "unhandled"}

    def _handle_payment_success(self, payment_intent: Dict, db: Session) -> Dict:
        """
        Handle successful payment - ONLY place where membership is activated
        """
        try:
            # Find the payment transaction
            transaction = (
                db.query(PaymentTransaction)
                .filter(PaymentTransaction.stripe_payment_intent_id == payment_intent["id"])
                .first()
            )

            if not transaction:
                logger.error(f"Payment transaction not found for intent {payment_intent['id']}")
                return {"status": "error", "message": "Transaction not found"}

            # Update transaction status
            transaction.status = PaymentStatus.SUCCEEDED
            transaction.confirmed_at = datetime.utcnow()
            transaction.webhook_received = True

            # NOW and ONLY NOW activate the membership
            success = self._activate_membership_after_payment(transaction, db)

            if success:
                db.commit()
                logger.info(f"Payment successful and membership activated for user {transaction.user_id}")
                return {"status": "success", "membership_activated": True}
            else:
                db.rollback()
                return {"status": "error", "message": "Failed to activate membership"}

        except Exception as e:
            logger.error(f"Error handling payment success: {str(e)}")
            db.rollback()
            return {"status": "error", "message": str(e)}

    def _handle_payment_failure(self, payment_intent: Dict, db: Session) -> Dict:
        """
        Handle failed payment - ensure no membership activation
        """
        try:
            transaction = (
                db.query(PaymentTransaction)
                .filter(PaymentTransaction.stripe_payment_intent_id == payment_intent["id"])
                .first()
            )

            if transaction:
                transaction.status = PaymentStatus.FAILED
                transaction.failed_at = datetime.utcnow()
                transaction.payment_status_reason = payment_intent.get("last_payment_error", {}).get(
                    "message", "Unknown error"
                )
                transaction.webhook_received = True

                # Ensure membership is NOT activated
                self._ensure_membership_not_activated(transaction.user_id, db)

                db.commit()
                logger.info(f"Payment failed for user {transaction.user_id}, membership NOT activated")

            return {"status": "failed", "membership_activated": False}

        except Exception as e:
            logger.error(f"Error handling payment failure: {str(e)}")
            db.rollback()
            return {"status": "error", "message": str(e)}

    def _activate_membership_after_payment(self, transaction: PaymentTransaction, db: Session) -> bool:
        """
        Safely activate membership only after confirmed payment
        """
        from ai_matching import Membership  # Import here to avoid circular imports

        try:
            # Find or create membership
            membership = db.query(Membership).filter(Membership.user_id == transaction.user_id).first()

            start_date = datetime.utcnow()
            end_date = start_date + timedelta(days=30)

            if membership:
                # Update existing membership
                membership.is_active = True
                membership.start_date = start_date
                membership.end_date = end_date
                membership.last_payment_date = start_date
                membership.stripe_customer_id = transaction.stripe_customer_id
                membership.updated_at = datetime.utcnow()
            else:
                # Create new membership
                membership = Membership(
                    user_id=transaction.user_id,
                    is_active=True,
                    membership_type="verified_human",
                    monthly_fee=5.00,
                    start_date=start_date,
                    end_date=end_date,
                    last_payment_date=start_date,
                    stripe_customer_id=transaction.stripe_customer_id,
                )
                db.add(membership)

            # Link payment to membership
            transaction.membership_id = membership.id

            # Create audit log
            audit_log = SubscriptionAuditLog(
                membership_id=membership.id,
                user_id=transaction.user_id,
                action="activated_via_payment",
                new_status=SubscriptionStatus.ACTIVE,
                reason=f"Payment successful: {transaction.stripe_payment_intent_id}",
                payment_transaction_id=transaction.id,
                created_at=datetime.utcnow(),
            )
            db.add(audit_log)

            logger.info(f"Membership activated for user {transaction.user_id} after verified payment")
            return True

        except Exception as e:
            logger.error(f"Failed to activate membership: {str(e)}")
            return False

    def _ensure_membership_not_activated(self, user_id: int, db: Session):
        """
        Ensure membership is NOT activated if payment failed
        """
        from ai_matching import Membership

        membership = db.query(Membership).filter(Membership.user_id == user_id).first()

        if membership and membership.is_active:
            # Only deactivate if it was just created (within last hour) and no
            # successful payments
            recent_activation = membership.start_date and (datetime.utcnow() - membership.start_date).seconds < 3600

            if recent_activation:
                membership.is_active = False
                logger.warning(f"Deactivated recent membership for user {user_id} due to payment failure")

    def cancel_subscription(self, user_id: int, db: Session, reason: str = "User requested") -> Dict:
        """
        Cancel user subscription safely
        """
        try:
            from ai_matching import Membership

            membership = db.query(Membership).filter(Membership.user_id == user_id, Membership.is_active).first()

            if not membership:
                raise HTTPException(status_code=404, detail="No active membership found")

            # Cancel Stripe subscription if exists
            if membership.stripe_subscription_id:
                try:
                    stripe.Subscription.delete(membership.stripe_subscription_id)
                except stripe.error.StripeError as e:
                    logger.warning(f"Failed to cancel Stripe subscription: {str(e)}")

            # Deactivate local membership
            membership.is_active = False
            membership.updated_at = datetime.utcnow()

            # Create audit log
            audit_log = SubscriptionAuditLog(
                membership_id=membership.id,
                user_id=user_id,
                action="cancelled",
                previous_status=SubscriptionStatus.ACTIVE,
                new_status=SubscriptionStatus.CANCELLED,
                reason=reason,
                performed_by_user_id=user_id,
                created_at=datetime.utcnow(),
            )
            db.add(audit_log)

            db.commit()

            logger.info(f"Subscription cancelled for user {user_id}")
            return {
                "status": "success",
                "message": "Subscription cancelled successfully",
            }

        except Exception as e:
            logger.error(f"Error cancelling subscription: {str(e)}")
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to cancel subscription")

    def get_payment_history(self, user_id: int, db: Session) -> List[Dict]:
        """
        Get user's payment history for account management
        """
        transactions = (
            db.query(PaymentTransaction)
            .filter(PaymentTransaction.user_id == user_id)
            .order_by(PaymentTransaction.initiated_at.desc())
            .all()
        )

        return [
            {
                "id": t.id,
                "amount": f"${t.amount_cents / 100:.2f}",
                "status": t.status.value,
                "description": t.description,
                "date": t.initiated_at.isoformat(),
                "confirmed": t.confirmed_at.isoformat() if t.confirmed_at else None,
            }
            for t in transactions
        ]

    def validate_membership_status(self, user_id: int, db: Session) -> Dict:
        """
        Validate that a user's membership was activated via legitimate payment
        CRITICAL security function to prevent fake memberships
        """
        from ai_matching import Membership

        membership = db.query(Membership).filter(Membership.user_id == user_id).first()

        if not membership or not membership.is_active:
            return {"valid": False, "reason": "No active membership"}

        # Check if there's a successful payment transaction
        successful_payment = (
            db.query(PaymentTransaction)
            .filter(
                PaymentTransaction.user_id == user_id,
                PaymentTransaction.status == PaymentStatus.SUCCEEDED,
                PaymentTransaction.webhook_received,
            )
            .first()
        )

        if not successful_payment:
            # SECURITY ALERT: Active membership without payment!
            logger.warning(f"SECURITY ALERT: User {user_id} has active membership without verified payment")

            # Deactivate the suspicious membership
            membership.is_active = False

            # Create security audit log
            audit_log = SubscriptionAuditLog(
                membership_id=membership.id,
                user_id=user_id,
                action="security_deactivation",
                previous_status=SubscriptionStatus.ACTIVE,
                new_status=SubscriptionStatus.INACTIVE,
                reason="No verified payment found - security measure",
                created_at=datetime.utcnow(),
            )
            db.add(audit_log)
            db.commit()

            return {
                "valid": False,
                "reason": "Membership deactivated - no verified payment",
            }

        return {"valid": True, "membership_type": membership.membership_type}


# Global payment service instance
payment_service = PaymentService()
