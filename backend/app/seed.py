import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine, Base
import app.db.base
from app.models import (
    Product,
    Customer,
    Event,
    Order,
    OrderItem,
    Experiment,
    ExperimentAssignment,
    FeatureFlag,
    Feedback,
    RoadmapTask,
    InventoryMovement,
    Return,
    CatalogueIssue,
    Release,
)

# Set deterministic random seed
random.seed(42)

CATEGORIES = [
    ("Shirts", ["Oxford Cotton Shirt", "Linen Resort Shirt", "Mandarin Collar Shirt", "Oversized Flannel Shirt", "Tailored Poplin Shirt"]),
    ("T-Shirts", ["Heavyweight Vintage Tee", "Organic Crewneck T-Shirt", "Waffle Knit Long Sleeve", "Graphic Typography Tee", "Relaxed Supima Tee"]),
    ("Jeans", ["Selvedge Slim Jeans", "Classic Straight Denim", "Vintage Wash Relaxed Jeans", "Tapered Raw Denim", "Cropped Wide-Leg Denim"]),
    ("Trousers", ["Pleated Wool Trousers", "Italian Linen Chinos", "Tailored Drawstring Pants", "Tencel Fluid Trousers", "Everyday Stretch Chinos"]),
    ("Dresses", ["Tiered Linen Midi Dress", "Silk Slip Evening Dress", "Wrap Floral Shirt Dress", "Ribbed Knit Maxi Dress", "Minimalist Shift Dress"]),
    ("Footwear", ["Minimalist White Leather Sneakers", "Suede Chelsea Boots", "Classic Penny Loafers", "Chunky Retro Runners", "Handcrafted Derby Shoes"]),
    ("Jackets", ["Wool Blend Tailored Overcoat", "Vintage Washed Denim Jacket", "Structured Cotton Chore Coat", "Bomber Jacket in Suede", "Insulated Minimalist Parka"]),
    ("Blazers", ["Unstructured Linen Blazer", "Single-Breasted Wool Blazer", "Oversized Double-Breasted Jacket", "Casual Cotton Travel Blazer"]),
    ("Accessories", ["Full-Grain Leather Belt", "Merino Wool Scarf", "Canvas Weekender Duffle", "Minimalist Brass Cuff", "Ribbed Cashmere Beanie"])
]

BRANDS = [
    "UrbanKnit", "Aura Denim", "VogueCraft", "MetroTailor", "NordicStyle",
    "TerraSole", "Loom & Thread", "Artisan Studio", "Verona", "Solace Active"
]

COLOURS = [
    ("Black", "#1e1e1e"),
    ("White", "#f8f9fa"),
    ("Navy", "#14234b"),
    ("Blue", "#326ec8"),
    ("Olive", "#556b2f"),
    ("Grey", "#808080"),
    ("Beige", "#f5deb3"),
    ("Brown", "#8b4513"),
    ("Charcoal", "#36454f"),
    ("Maroon", "#800000")
]

FIT_TYPES = ["Slim", "Regular", "Relaxed", "Oversized"]
OCCASIONS = ["Casual", "Formal", "Workwear", "Party", "Travel"]
MATERIALS = ["100% Organic Cotton", "Italian Linen", "Selvedge Denim", "Merino Wool", "Tencel Lyocell", "Full-Grain Leather"]

CURATED_IMAGES = {
    "Shirts": [
        "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1621072156002-e2fccdc0b176?w=600&auto=format&fit=crop&q=80"
    ],
    "T-Shirts": [
        "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&auto=format&fit=crop&q=80"
    ],
    "Jeans": [
        "https://images.unsplash.com/photo-1542272604-780c96856592?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=600&auto=format&fit=crop&q=80"
    ],
    "Trousers": [
        "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&auto=format&fit=crop&q=80"
    ],
    "Dresses": [
        "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80"
    ],
    "Footwear": [
        "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=600&auto=format&fit=crop&q=80"
    ],
    "Jackets": [
        "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1548883354-7622d03aca27?w=600&auto=format&fit=crop&q=80"
    ],
    "Blazers": [
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=600&auto=format&fit=crop&q=80"
    ],
    "Accessories": [
        "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=600&auto=format&fit=crop&q=80",
        "https://images.unsplash.com/photo-1523779917675-b6ed3a42a561?w=600&auto=format&fit=crop&q=80"
    ]
}

def seed_database():
    print("==================================================")
    print("🌱 Initializing StyleSense Synthetic Seed Engine")
    print("==================================================")
    
    # Recreate tables cleanly
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    now = datetime.utcnow()

    # 1. Seed Products (120+ products)
    print("📦 Generating 120+ fashion & lifestyle products...")
    products = []
    prod_counter = 101

    for cat_name, subnames in CATEGORIES:
        for subname in subnames:
            # 3 colour variants per item
            for _ in range(3):
                brand = random.choice(BRANDS)
                col_name, hex_code = random.choice(COLOURS)
                fit = random.choice(FIT_TYPES)
                material = random.choice(MATERIALS)
                occasion = random.choice(OCCASIONS)
                
                # Base price based on category
                if cat_name in ["Blazers", "Jackets"]:
                    base_p = random.randint(3499, 7999)
                elif cat_name in ["Footwear"]:
                    base_p = random.randint(2499, 5999)
                elif cat_name in ["Jeans", "Trousers", "Dresses"]:
                    base_p = random.randint(1899, 3999)
                elif cat_name in ["Shirts"]:
                    base_p = random.randint(1299, 2799)
                elif cat_name in ["T-Shirts"]:
                    base_p = random.randint(799, 1699)
                else:
                    base_p = random.randint(699, 2199)

                orig_p = base_p + random.choice([0, 300, 500, 800, 1000])
                sku = f"SS-{cat_name[:3].upper()}-{prod_counter}"
                name = f"{brand} {col_name} {subname}"
                
                img_list = CURATED_IMAGES.get(cat_name, CURATED_IMAGES["Shirts"])
                img_url = img_list[prod_counter % len(img_list)]

                is_bottom = cat_name in ["Jeans", "Trousers"]
                sizes = ["28", "30", "32", "34", "36"] if is_bottom else ["S", "M", "L", "XL", "XXL"]
                
                size_chart = {
                    s: {"chest" if not is_bottom else "waist": 36 + (i * 2), "length": 28 + i}
                    for i, s in enumerate(sizes)
                }

                tags = [cat_name.lower(), col_name.lower(), fit.lower(), occasion.lower(), "sustainable", "premium"]
                rating = round(random.uniform(3.9, 4.9), 1)
                review_cnt = random.randint(12, 140)
                stock = random.randint(10, 85)
                reorder = 15

                desc = f"Expertly tailored from {material}, the {name} delivers refined modern drape and enduring comfort. Designed with a {fit.lower()} silhouette perfect for {occasion.lower()} styling."

                p = Product(
                    id=prod_counter,
                    sku=sku,
                    name=name,
                    brand=brand,
                    category=cat_name,
                    subcategory=subname,
                    description=desc,
                    colour=col_name,
                    dominant_colour=hex_code,
                    price=float(base_p),
                    original_price=float(orig_p),
                    sizes_available=sizes,
                    size_chart=size_chart,
                    fit_type=fit,
                    material=material,
                    occasion=occasion,
                    tags=tags,
                    rating=rating,
                    review_count=review_cnt,
                    stock_quantity=stock,
                    reorder_point=reorder,
                    image_url=img_url,
                    active=True,
                    created_at=now - timedelta(days=random.randint(20, 90))
                )
                products.append(p)
                db.add(p)
                prod_counter += 1

    db.commit()
    print(f"✅ Created {len(products)} products across {len(CATEGORIES)} categories.")

    # 2. Seed Customers (30 customers)
    print("👤 Generating 30 synthetic demo customers...")
    customer_names = [
        "Aarav Mehta", "Ananya Sharma", "Rohan Verma", "Priya Nair", "Kabir Sen",
        "Meera Patel", "Aditya Iyer", "Tanvi Joshi", "Vikram Malhotra", "Rhea Kapoor",
        "Siddharth Rao", "Ishaan Roy", "Divya Menon", "Arjun Bhatia", "Neha Gupta",
        "Zoya Merchant", "Devansh Sethi", "Kavya Pillai", "Rahul Deshmukh", "Pooja Hegde",
        "Samarth Kulkarni", "Tara Sen", "Farhan Ali", "Sneha Chawla", "Yash Singhania",
        "Alia Fernandes", "Kunal Mittal", "Simran Bedi", "Manish Saxena", "Nisha Agarwal"
    ]

    customers = []
    for idx, c_name in enumerate(customer_names, 1):
        pref_cats = random.sample([c[0] for c in CATEGORIES], k=3)
        pref_cols = random.sample([col[0] for col in COLOURS], k=3)
        pref_brs = random.sample(BRANDS, k=3)
        b_min = random.choice([500, 800, 1000, 1200])
        b_max = random.choice([3500, 4500, 6000, 8500])

        c = Customer(
            id=idx,
            display_name=c_name,
            email=f"{c_name.lower().replace(' ', '.')}@stylesense-demo.internal",
            preferred_categories=pref_cats,
            preferred_colours=pref_cols,
            preferred_brands=pref_brs,
            budget_min=float(b_min),
            budget_max=float(b_max),
            created_at=now - timedelta(days=random.randint(15, 60))
        )
        customers.append(c)
        db.add(c)

    db.commit()
    print(f"✅ Created {len(customers)} demo customers.")

    # 3. Seed Experiments & Feature Flags
    print("🧪 Creating A/B Experiments and Feature Flags...")
    exp1 = Experiment(
        id=1,
        name="AI Discovery Recommendations v2",
        hypothesis="Personalised hybrid recommendation widgets on storefront homepage will increase checkout conversion rate by at least 15%.",
        description="Testing hybrid collaborative + content affinity ranking against popularity baseline.",
        primary_metric="conversion_rate",
        status="RUNNING",
        traffic_percentage=50.0,
        start_date=now - timedelta(days=21),
        created_at=now - timedelta(days=22)
    )
    exp2 = Experiment(
        id=2,
        name="Smart Sizing Assistant Modal",
        hypothesis="Proactive visual size recommendations on PDP will decrease return rate by 20% and lift add-to-cart velocity.",
        description="Interactive measurement assistant vs standard static size chart table.",
        primary_metric="return_rate",
        status="RUNNING",
        traffic_percentage=50.0,
        start_date=now - timedelta(days=14),
        created_at=now - timedelta(days=15)
    )
    db.add(exp1)
    db.add(exp2)
    db.commit()

    # Assign all 30 customers to experiment 1
    for c in customers:
        db.add(ExperimentAssignment(
            experiment_id=1,
            customer_id=c.id,
            variant="treatment" if (c.id % 2 == 0) else "control",
            assigned_at=now - timedelta(days=random.randint(10, 20))
        ))
    db.commit()

    flags = [
        FeatureFlag(name="smart_search_nlp", description="Conversational natural language query facet extractor", enabled=True, rollout_percentage=100.0),
        FeatureFlag(name="visual_palette_search", description="Pillow image upload color histogram discovery", enabled=True, rollout_percentage=100.0),
        FeatureFlag(name="complete_the_look", description="Automated cross-category outfit bundle suggestion", enabled=True, rollout_percentage=100.0),
        FeatureFlag(name="ai_size_engine", description="Transparent body anthropometric size calculator", enabled=True, rollout_percentage=100.0),
        FeatureFlag(name="promotions_simulator", description="Price elasticity simulation workbench for merchandising", enabled=True, rollout_percentage=100.0)
    ]
    for fl in flags:
        db.add(fl)
    db.commit()

    # 4. Seed Orders & Order Items (150 orders)
    print("🛒 Generating 150 realistic completed orders...")
    orders = []
    order_id_counter = 1
    for o_idx in range(150):
        cust = random.choice(customers)
        o_date = now - timedelta(days=random.randint(1, 35), hours=random.randint(1, 23))
        
        # 1 to 3 items per order
        items_count = random.choices([1, 2, 3], weights=[0.55, 0.35, 0.10])[0]
        selected_prods = random.sample(products, items_count)
        
        total_val = 0.0
        order = Order(
            id=order_id_counter,
            customer_id=cust.id,
            session_id=f"sess_{1000 + o_idx}",
            total_amount=0.0,
            status="COMPLETED",
            created_at=o_date
        )
        db.add(order)
        db.flush()

        for pr in selected_prods:
            qty = random.choice([1, 1, 1, 2])
            size_choice = random.choice(pr.sizes_available) if pr.sizes_available else "M"
            item_price = pr.price
            total_val += (item_price * qty)

            db.add(OrderItem(
                order_id=order.id,
                product_id=pr.id,
                quantity=qty,
                unit_price=item_price,
                selected_size=size_choice
            ))

            # Inventory movement
            db.add(InventoryMovement(
                product_id=pr.id,
                movement_type="PURCHASE",
                quantity=-qty,
                reference=f"Order #{order.id}",
                created_at=o_date
            ))

        order.total_amount = round(total_val, 2)
        orders.append(order)
        order_id_counter += 1

    db.commit()
    print(f"✅ Generated {len(orders)} customer orders.")

    # 5. Seed Customer Returns (18 returns for return intelligence)
    print("🔄 Generating return records and reasons...")
    RETURN_REASONS = [
        "Size too small around chest/waist",
        "Size too large / loose fit",
        "Color shade slightly different than screen",
        "Fabric texture not as expected",
        "Ordered multiple sizes to compare"
    ]
    for r_idx in range(18):
        sample_order = orders[r_idx * 7 % len(orders)]
        order_items = db.query(OrderItem).filter(OrderItem.order_id == sample_order.id).all()
        target_item = order_items[0] if order_items else None
        if target_item:
            ret = Return(
                order_id=sample_order.id,
                product_id=target_item.product_id,
                customer_id=sample_order.customer_id,
                return_reason=random.choice(RETURN_REASONS),
                condition="UNWORN",
                created_at=sample_order.created_at + timedelta(days=random.randint(2, 6))
            )
            db.add(ret)
    db.commit()

    # 6. Seed Customer Behavioural Events (2,200+ events across 480 sessions)
    print("📊 Generating 2,200+ user events across 480 sessions for 6-stage funnel...")
    event_counter = 0
    for s_idx in range(480):
        sess_id = f"sess_{1000 + s_idx}"
        cust = random.choice(customers) if random.random() < 0.70 else None
        cust_id = cust.id if cust else None
        sess_time = now - timedelta(days=random.randint(0, 30), minutes=random.randint(0, 1400))

        # Funnel stage 1: Homepage View (100% of sessions)
        db.add(Event(
            customer_id=cust_id,
            session_id=sess_id,
            event_type="homepage_view",
            event_metadata={"referrer": "direct", "device": random.choice(["mobile", "desktop", "tablet"])},
            experiment_id=1,
            variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
            occurred_at=sess_time
        ))
        event_counter += 1

        # Discovery click or size consultation
        if random.random() < 0.40:
            sess_time += timedelta(seconds=random.randint(10, 30))
            db.add(Event(
                customer_id=cust_id,
                session_id=sess_id,
                event_type="recommendation_click",
                event_metadata={"position": random.randint(1, 4)},
                experiment_id=1,
                variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                occurred_at=sess_time
            ))
            event_counter += 1

        # Funnel stage 2: Search / Discovery (~80% of sessions)
        if random.random() < 0.80:
            sess_time += timedelta(seconds=random.randint(15, 60))
            db.add(Event(
                customer_id=cust_id,
                session_id=sess_id,
                event_type="search",
                event_metadata={"query": random.choice(["linen shirts", "black denim", "sneakers", "summer dress", "cotton chinos"])},
                experiment_id=1,
                variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                occurred_at=sess_time
            ))
            event_counter += 1

            # Funnel stage 3: Product View (~65% of sessions)
            if random.random() < 0.82:
                # 1 to 3 product views per session
                view_count = random.choices([1, 2, 3], weights=[0.6, 0.3, 0.1])[0]
                viewed_prods = random.sample(products, view_count)
                for viewed_p in viewed_prods:
                    sess_time += timedelta(seconds=random.randint(20, 70))
                    db.add(Event(
                        customer_id=cust_id,
                        session_id=sess_id,
                        product_id=viewed_p.id,
                        event_type="product_view",
                        event_metadata={"sku": viewed_p.sku, "category": viewed_p.category},
                        experiment_id=1,
                        variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                        occurred_at=sess_time
                    ))
                    event_counter += 1

                # Size engine view
                if random.random() < 0.35:
                    sess_time += timedelta(seconds=random.randint(10, 30))
                    db.add(Event(
                        customer_id=cust_id,
                        session_id=sess_id,
                        product_id=viewed_prods[0].id,
                        event_type="size_recommendation_view",
                        event_metadata={"recommended_size": "M", "fit": "Regular"},
                        experiment_id=2,
                        variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                        occurred_at=sess_time
                    ))
                    event_counter += 1

                # Wishlist add
                if random.random() < 0.25:
                    sess_time += timedelta(seconds=random.randint(15, 45))
                    db.add(Event(
                        customer_id=cust_id,
                        session_id=sess_id,
                        product_id=viewed_prods[0].id,
                        event_type="wishlist_add",
                        event_metadata={"sku": viewed_prods[0].sku},
                        occurred_at=sess_time
                    ))
                    event_counter += 1

                # Funnel stage 4: Add to Cart (~40% of sessions)
                if random.random() < 0.62:
                    sess_time += timedelta(seconds=random.randint(30, 90))
                    p_to_cart = viewed_prods[0]
                    db.add(Event(
                        customer_id=cust_id,
                        session_id=sess_id,
                        product_id=p_to_cart.id,
                        event_type="add_to_cart",
                        event_metadata={"price": p_to_cart.price, "selected_size": "M"},
                        experiment_id=1,
                        variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                        occurred_at=sess_time
                    ))
                    event_counter += 1

                    # Funnel stage 5: Checkout Started (~26% of sessions)
                    if random.random() < 0.65:
                        sess_time += timedelta(seconds=random.randint(45, 120))
                        db.add(Event(
                            customer_id=cust_id,
                            session_id=sess_id,
                            product_id=p_to_cart.id,
                            event_type="checkout_started",
                            event_metadata={"amount": p_to_cart.price},
                            experiment_id=1,
                            variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                            occurred_at=sess_time
                        ))
                        event_counter += 1

                        # Funnel stage 6: Purchase (~18% of sessions)
                        if random.random() < 0.72:
                            sess_time += timedelta(seconds=random.randint(60, 180))
                            db.add(Event(
                                customer_id=cust_id,
                                session_id=sess_id,
                                product_id=p_to_cart.id,
                                event_type="purchase",
                                event_metadata={"order_val": p_to_cart.price},
                                experiment_id=1,
                                variant="treatment" if (cust_id and cust_id % 2 == 0) else "control",
                                occurred_at=sess_time
                            ))
                            event_counter += 1

    db.commit()
    print(f"✅ Generated {event_counter} behavioural events.")

    # 7. Seed Roadmap Tasks (RICE prioritised backlog)
    print("📋 Creating RICE-prioritised roadmap backlog...")
    tasks = [
        ("Visual Outfit Builder 2.0", "Drag-and-drop wardrobe canvas allowing users to assemble mixed-brand looks with real-time checkout bundles.", "Storefront PM", "IN_PROGRESS", "HIGH", 12000.0, 3.0, 90.0, 4.0),
        ("Multimodal CLIP Visual Embeddings", "Transition from colour histogram heuristics to offline quantized CLIP embeddings for zero-shot visual similarity.", "AI Eng Lead", "PLANNED", "CRITICAL", 8500.0, 3.0, 80.0, 6.0),
        ("Return Risk Prediction Guardrails", "Flag high-risk size mismatch transactions at cart checkout and prompt interactive size validation.", "Product Ops PM", "BACKLOG", "MEDIUM", 6000.0, 2.0, 75.0, 3.0),
        ("Instant Restock Notifications", "Automated WhatsApp and SMS replenishment alerts when waitlisted sizes return to stock.", "Growth PM", "QA", "MEDIUM", 4500.0, 1.5, 95.0, 2.0),
        ("Dynamic Markdown Elasticity Optimizer", "Real-time promotion simulation that sets automated clearance markdowns for slow-moving seasonal inventory.", "Pricing Lead", "COMPLETED", "HIGH", 5000.0, 2.0, 90.0, 3.5)
    ]
    for title, desc, owner, status, priority, reach, impact, conf, effort in tasks:
        rice = (reach * impact * (conf / 100.0)) / max(0.5, effort)
        db.add(RoadmapTask(
            title=title,
            description=desc,
            owner=owner,
            status=status,
            priority=priority,
            reach=reach,
            impact=impact,
            confidence=conf,
            effort=effort,
            rice_score=round(rice, 1),
            due_date=now + timedelta(days=random.randint(14, 45))
        ))
    db.commit()

    # 8. Seed Customer Feedback
    print("💬 Seeding customer & stakeholder feedback...")
    feedbacks = [
        ("Storefront Review", "Love the natural language search! 'Olive linen shirt under 2000' found exactly what I wanted in 2 seconds.", 5.0, "FIT_ISSUE", "RESOLVED"),
        ("Storefront Review", "Denim fits slightly snugger on the waist than typical size 32. Suggest clarifying size guide.", 3.0, "FIT_ISSUE", "NEW"),
        ("Customer Support", "Customer requested size exchange on Oxford Cotton Shirt. Recommender gave M, but L was needed.", 2.0, "FIT_ISSUE", "CONVERTED_TO_ROADMAP"),
        ("Internal Tester", "Complete-the-look recommendations picked fantastic complementary loafers for the Italian linen trousers.", 5.0, "RECOMMENDATION", "NEW")
    ]
    for source, comment, rating, f_type, status in feedbacks:
        db.add(Feedback(
            source=source,
            comment=comment,
            rating=rating,
            feedback_type=f_type,
            sentiment="POSITIVE" if rating >= 4.0 else ("NEUTRAL" if rating == 3.0 else "NEGATIVE"),
            status=status,
            priority="HIGH" if rating <= 2.0 else "MEDIUM"
        ))
    db.commit()

    # 9. Seed Release Readiness
    print("🚀 Creating launch releases...")
    db.add(Release(
        version="v2.0.0-PROD",
        name="StyleSense Core Launch",
        target_date=now + timedelta(days=7),
        status="IN_PREPARATION",
        readiness_percentage=71,
        checklist={
            "engineering_completed": True,
            "design_approved": True,
            "qa_testing_passed": False,
            "analytics_instrumented": True,
            "documentation_ready": True,
            "stakeholder_signoff": True,
            "release_notes_published": False
        },
        release_notes="Production release of StyleSense Storefront, Product Analytics, and Operations Engine."
    ))
    db.commit()

    db.close()
    print("==================================================")
    print("🎉 StyleSense Synthetic Database Seed Complete!")
    print("==================================================")

if __name__ == "__main__":
    seed_database()
