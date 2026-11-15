"""Add replay protection, safe money, constraints and persistent wishlists without dropping data."""
from alembic import op
import sqlalchemy as sa
revision="0002"
down_revision="0001"
branch_labels=None
depends_on=None

def upgrade():
    connection=op.get_bind()
    for table, condition in [("products","stock_quantity < 0 OR price < 0"),("orders","total_amount < 0"),("order_items","quantity <= 0 OR unit_price < 0")]:
        if connection.execute(sa.text(f"SELECT COUNT(*) FROM {table} WHERE {condition}")).scalar():
            raise RuntimeError(f"Existing invalid records in {table}; repair them before upgrading. No records deleted.")
    with op.batch_alter_table("orders") as b:
        b.alter_column("total_amount", type_=sa.Numeric(14,2), existing_type=sa.Float(), existing_nullable=False)
        b.add_column(sa.Column("idempotency_key",sa.String(100),nullable=True))
        b.add_column(sa.Column("request_fingerprint",sa.String(64),nullable=True))
        b.create_unique_constraint("uq_orders_idempotency_key",["idempotency_key"])
        b.create_check_constraint("ck_order_total_nonnegative","total_amount >= 0")
    with op.batch_alter_table("order_items") as b:
        b.alter_column("unit_price",type_=sa.Numeric(14,2),existing_type=sa.Float(),existing_nullable=False)
        b.alter_column("quantity",nullable=False,existing_type=sa.Integer())
        b.create_check_constraint("ck_order_item_quantity_positive","quantity > 0")
        b.create_check_constraint("ck_order_item_price_nonnegative","unit_price >= 0")
    with op.batch_alter_table("products") as b:
        b.create_check_constraint("ck_product_stock_nonnegative","stock_quantity >= 0")
        b.create_check_constraint("ck_product_price_nonnegative","price >= 0")
    with op.batch_alter_table("events") as b:
        b.add_column(sa.Column("event_key",sa.String(100),nullable=True))
        b.create_unique_constraint("uq_events_event_key",["event_key"])
    op.create_table("wishlist_entries",sa.Column("id",sa.Integer(),primary_key=True),
        sa.Column("customer_id",sa.Integer(),sa.ForeignKey("customers.id"),nullable=False),
        sa.Column("product_id",sa.Integer(),sa.ForeignKey("products.id"),nullable=False),
        sa.Column("created_at",sa.DateTime(),nullable=False),
        sa.UniqueConstraint("customer_id","product_id",name="uq_wishlist_customer_product"))
    op.create_index("ix_wishlist_entries_customer_id","wishlist_entries",["customer_id"])
    op.create_index("ix_wishlist_entries_product_id","wishlist_entries",["product_id"])

def downgrade():
    raise RuntimeError("Reliability downgrade disabled: restore a verified backup if rollback is necessary.")
