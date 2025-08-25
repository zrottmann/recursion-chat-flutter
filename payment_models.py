"""
Secure Payment System Database Models
Extends the existing Trading Post database with payment tracking and security
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    Boolean,
    ForeignKey,
    Text,
    Enum,
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

Base = declarative_base()


class PaymentStatus(enum.Enum):
    """Payment status enumeration for strict type checking"""

    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class SubscriptionStatus(enum.Enum):
    """Subscription status enumeration"""

    ACTIVE = "active"
    INACTIVE = "inactive"
    CANCELLED = "cancelled"
    PAST_DUE = "past_due"
    UNPAID = "unpaid"


class PaymentTransaction(Base):
    """
    Comprehensive payment transaction logging
    Records every payment attempt for audit and security
    """

    __tablename__ = "payment_transactions"

    id = Column(Integer, primary_key=True, index=True)

    # User and membership references
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=True)

    # Stripe integration fields
    stripe_payment_intent_id = Column(String, unique=True, nullable=False)
    stripe_customer_id = Column(String, nullable=True)
    stripe_payment_method_id = Column(String, nullable=True)

    # Payment details
    amount_cents = Column(Integer, nullable=False)  # Store as cents to avoid float issues
    currency = Column(String, default="usd", nullable=False)
    description = Column(String, nullable=True)

    # Status tracking
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False)
    payment_status_reason = Column(String, nullable=True)  # Error details if failed

    # Timestamps for audit trail
    initiated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    confirmed_at = Column(DateTime, nullable=True)
    failed_at = Column(DateTime, nullable=True)

    # Security and metadata
    client_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)
    # Confirms webhook validation
    webhook_received = Column(Boolean, default=False)

    # Relationships
    user = relationship("User", back_populates="payment_transactions")
    membership = relationship("Membership", back_populates="payment_transactions")


class PaymentMethod(Base):
    """
    Secure storage of payment method metadata (no sensitive data)
    Only stores what's needed for user experience, actual card data stays with Stripe
    """

    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Stripe references (no sensitive card data stored locally)
    stripe_payment_method_id = Column(String, unique=True, nullable=False)
    stripe_customer_id = Column(String, nullable=False)

    # Display info for user (last 4 digits, brand)
    card_brand = Column(String, nullable=True)  # visa, mastercard, etc.
    card_last4 = Column(String, nullable=True)
    card_exp_month = Column(Integer, nullable=True)
    card_exp_year = Column(Integer, nullable=True)

    # Metadata
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="payment_methods")


class SubscriptionAuditLog(Base):
    """
    Detailed audit log for all subscription changes
    Critical for compliance and debugging
    """

    __tablename__ = "subscription_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Action details
    action = Column(String, nullable=False)  # "activated", "cancelled", "renewed", "failed"
    previous_status = Column(Enum(SubscriptionStatus), nullable=True)
    new_status = Column(Enum(SubscriptionStatus), nullable=False)

    # Context
    reason = Column(String, nullable=True)  # Why the change happened
    payment_transaction_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=True)

    # Security context
    performed_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Admin override
    client_ip = Column(String, nullable=True)
    user_agent = Column(String, nullable=True)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    membership = relationship("Membership", back_populates="audit_logs")
    user = relationship("User", foreign_keys=[user_id])
    performed_by = relationship("User", foreign_keys=[performed_by_user_id])
    payment_transaction = relationship("PaymentTransaction")


class RefundRequest(Base):
    """
    Track refund requests and processing
    Important for customer service and compliance
    """

    __tablename__ = "refund_requests"

    id = Column(Integer, primary_key=True, index=True)

    # References
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    payment_transaction_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=False)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)

    # Refund details
    requested_amount_cents = Column(Integer, nullable=False)
    reason = Column(String, nullable=False)
    customer_note = Column(Text, nullable=True)
    admin_note = Column(Text, nullable=True)

    # Stripe integration
    stripe_refund_id = Column(String, nullable=True)

    # Status tracking
    status = Column(String, default="pending", nullable=False)  # pending, approved, denied, processed
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    processed_at = Column(DateTime, nullable=True)

    # Admin handling
    processed_by_admin_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    user = relationship("User", foreign_keys=[user_id])
    payment_transaction = relationship("PaymentTransaction")
    membership = relationship("Membership")
    processed_by_admin = relationship("User", foreign_keys=[processed_by_admin_id])


# Enhanced Membership model (to be merged with existing)
class EnhancedMembership(Base):
    """
    Enhanced membership model with proper payment tracking
    This extends the existing Membership model with security features
    """

    __tablename__ = "memberships_enhanced"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Subscription details
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.INACTIVE, nullable=False)
    membership_type = Column(String, default="verified_human", nullable=False)

    # Pricing
    monthly_fee_cents = Column(Integer, default=500, nullable=False)  # $5.00 as cents
    currency = Column(String, default="usd", nullable=False)

    # Subscription lifecycle
    trial_start = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)

    # Payment tracking
    last_successful_payment = Column(DateTime, nullable=True)
    next_billing_date = Column(DateTime, nullable=True)
    failed_payment_attempts = Column(Integer, default=0)

    # Stripe integration
    stripe_subscription_id = Column(String, unique=True, nullable=True)
    stripe_customer_id = Column(String, nullable=False)

    # Security and compliance
    activated_via_payment = Column(Boolean, default=False, nullable=False)  # CRITICAL: Only true if paid
    payment_verified = Column(Boolean, default=False, nullable=False)  # Double verification
    activation_payment_id = Column(Integer, ForeignKey("payment_transactions.id"), nullable=True)

    # Audit timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    activated_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="enhanced_membership")
    payment_transactions = relationship("PaymentTransaction", back_populates="membership")
    audit_logs = relationship("SubscriptionAuditLog", back_populates="membership")
    activation_payment = relationship("PaymentTransaction", foreign_keys=[activation_payment_id])


# Add relationships to User model (extend existing User)
"""
Add these relationships to the existing User model in app_sqlite.py:

    # Payment system relationships
    payment_transactions = relationship("PaymentTransaction", back_populates="user")
    payment_methods = relationship("PaymentMethod", back_populates="user")
    enhanced_membership = relationship("EnhancedMembership", back_populates="user", uselist=False)
"""
