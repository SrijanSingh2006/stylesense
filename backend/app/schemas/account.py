from typing import Literal
from pydantic import (
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)
from app.services.security import password_valid


class StrictInput(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=False)


class Registration(StrictInput):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=12, max_length=128)
    confirm_password: str
    terms_accepted: Literal[True]

    @model_validator(mode="after")
    def check_password(self):
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not password_valid(self.password):
            raise ValueError(
                "Use 12–128 characters and at least three of lowercase, uppercase, numbers and symbols"
            )
        if not self.full_name.strip():
            raise ValueError("Full name is required")
        return self


class Login(StrictInput):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False


class EmailInput(StrictInput):
    email: EmailStr


class TokenInput(StrictInput):
    token: str = Field(min_length=20, max_length=256)


class NewPassword(StrictInput):
    password: str = Field(min_length=12, max_length=128)
    confirm_password: str

    @model_validator(mode="after")
    def check_password(self):
        if self.password != self.confirm_password or not password_valid(self.password):
            raise ValueError("Passwords must match and satisfy the password policy")
        return self


class ResetPassword(NewPassword):
    token: str = Field(min_length=20, max_length=256)


class ChangePassword(NewPassword):
    current_password: str = Field(min_length=1, max_length=128)


class InvitationAcceptance(NewPassword):
    token: str = Field(min_length=20, max_length=256)
    full_name: str = Field(min_length=2, max_length=100)


class ProfileUpdate(StrictInput):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str | None = Field(None, max_length=25)


class AddressInput(StrictInput):
    full_name: str = Field(min_length=2, max_length=100)
    phone: str = Field(min_length=7, max_length=25, pattern=r"^[+0-9() -]+$")
    address_line_1: str = Field(min_length=3, max_length=200)
    address_line_2: str | None = Field(None, max_length=200)
    city: str = Field(min_length=2, max_length=100)
    state: str = Field(min_length=2, max_length=100)
    postal_code: str = Field(min_length=3, max_length=15, pattern=r"^[A-Za-z0-9 -]+$")
    country: str = Field("IN", pattern=r"^[A-Z]{2}$")
    address_type: Literal["shipping", "billing", "home", "work"] = "shipping"
    is_default: bool = False


class PreferenceInput(StrictInput):
    preferred_categories: list[str] = Field(default_factory=list, max_length=30)
    preferred_brands: list[str] = Field(default_factory=list, max_length=30)
    preferred_colours: list[str] = Field(default_factory=list, max_length=30)
    budget_min: float = Field(0, ge=0, le=10000000, allow_inf_nan=False)
    budget_max: float = Field(5000, ge=0, le=10000000, allow_inf_nan=False)
    preferred_fit: Literal["Slim", "Regular", "Relaxed", "Oversized"] = "Regular"
    onboarding_completed: bool = False

    @field_validator("preferred_categories", "preferred_brands", "preferred_colours")
    @classmethod
    def validate_values(cls, values):
        if any(not v.strip() or len(v) > 100 for v in values):
            raise ValueError("Preference values must be 1–100 characters")
        return list(dict.fromkeys(v.strip() for v in values))

    @model_validator(mode="after")
    def budget_order(self):
        if self.budget_min > self.budget_max:
            raise ValueError("Minimum budget must not exceed maximum")
        return self


class CartItemInput(StrictInput):
    product_id: int = Field(strict=True, ge=1)
    selected_size: str = Field(min_length=1, max_length=20)
    quantity: int = Field(strict=True, ge=1, le=10000)


class CartMerge(StrictInput):
    merge_key: str = Field(min_length=8, max_length=100)
    items: list[CartItemInput] = Field(max_length=100)


class CartQuantity(StrictInput):
    quantity: int = Field(strict=True, ge=1, le=10000)


class CheckoutInput(StrictInput):
    idempotency_key: str = Field(min_length=8, max_length=100)
    address_id: int = Field(strict=True, ge=1)
    payment_method: Literal["simulated_upi", "simulated_card", "simulated_cod"] = (
        "simulated_upi"
    )
    session_id: str | None = Field(None, max_length=100)


class StatusUpdate(StrictInput):
    status: Literal["active", "suspended", "deactivated"]


class RoleUpdate(StrictInput):
    role: Literal["customer", "product_manager", "operations_manager", "admin"]


class InvitationInput(StrictInput):
    email: EmailStr
    role: Literal["product_manager", "operations_manager", "admin"]


class SystemSettingsInput(StrictInput):
    registration_enabled: bool
    maintenance_notice: str = Field("", max_length=300)


class AddressPatch(StrictInput):
    full_name: str | None = None
    phone: str | None = None
    address_line_1: str | None = None
    address_line_2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    address_type: str | None = None
    is_default: bool | None = None


class PreferencePatch(StrictInput):
    preferred_categories: list[str] | None = None
    preferred_brands: list[str] | None = None
    preferred_colours: list[str] | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    preferred_fit: str | None = None
    onboarding_completed: bool | None = None
