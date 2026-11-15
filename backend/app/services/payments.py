"""Payment boundary for future adapters. Only an explicitly simulated provider is implemented."""

from dataclasses import dataclass
from decimal import Decimal
from typing import Protocol
import hashlib


@dataclass(frozen=True)
class Authorization:
    approved: bool
    reference: str
    mode: str = "simulated"


class PaymentProvider(Protocol):
    def authorize(
        self, amount: Decimal, method: str, idempotency_key: str
    ) -> Authorization: ...


class SimulatedPaymentProvider:
    def authorize(self, amount, method, idempotency_key):
        if method not in {
            "simulated_upi",
            "simulated_card",
            "simulated_cod",
            "simulated",
        }:
            return Authorization(False, "unsupported")
        return Authorization(
            True,
            "simulated_" + hashlib.sha256(idempotency_key.encode()).hexdigest()[:16],
        )


def get_payment_provider() -> PaymentProvider:
    return SimulatedPaymentProvider()
