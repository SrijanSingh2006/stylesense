import re
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sqlalchemy.orm import Session
from app.models.product import Product
from app.schemas.search import SearchRequest, SearchResponse, ExtractedFilters
from app.schemas.product import ProductResponse

KNOWN_CATEGORIES = [
    "Shirts", "T-Shirts", "Jeans", "Trousers", "Dresses", "Footwear",
    "Jackets", "Sweaters", "Blazers", "Accessories", "Handbags"
]

KNOWN_COLOURS = [
    "Black", "White", "Blue", "Navy", "Red", "Green", "Grey", "Beige",
    "Olive", "Brown", "Yellow", "Pink", "Maroon", "Charcoal"
]

KNOWN_BRANDS = [
    "UrbanKnit", "Aura Denim", "VogueCraft", "MetroTailor", "NordicStyle",
    "TerraSole", "Loom & Thread", "Artisan Studio", "Verona", "Solace Active"
]

KNOWN_OCCASIONS = ["Casual", "Formal", "Party", "Sports", "Workwear", "Festive"]

def parse_natural_language_query(query: str) -> ExtractedFilters:
    """
    Deterministic rule-based query parser that extracts shopping facets from free-form text.
    """
    q = query.strip()
    lowered = q.lower()
    filters = ExtractedFilters()

    # Extract price constraints
    # e.g., "under 2500", "below 3000", "less than 2000", "under ₹2,500"
    under_match = re.search(r'(?:under|below|less\s+than|<|max|upto|up\s+to)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?(?:\.\d+)?)', lowered)
    if under_match:
        val = float(under_match.group(1).replace(',', ''))
        filters.max_price = val

    # e.g., "above 1000", "more than 1500", "min 1000"
    above_match = re.search(r'(?:above|over|more\s+than|>|min|starting\s+from)\s*(?:₹|rs\.?|inr)?\s*(\d+(?:,\d+)?(?:\.\d+)?)', lowered)
    if above_match:
        val = float(above_match.group(1).replace(',', ''))
        filters.min_price = val

    # e.g., "between 1000 and 2500"
    between_match = re.search(r'between\s*(?:₹|rs\.?|inr)?\s*(\d+)\s*(?:and|to|-)\s*(?:₹|rs\.?|inr)?\s*(\d+)', lowered)
    if between_match:
        filters.min_price = float(between_match.group(1))
        filters.max_price = float(between_match.group(2))

    # Extract Category
    for cat in KNOWN_CATEGORIES:
        if cat.lower() in lowered or cat.lower()[:-1] in lowered: # match singular / plural
            filters.category = cat
            break

    # Extract Colour
    for col in KNOWN_COLOURS:
        if re.search(rf'\b{col.lower()}\b', lowered):
            filters.colour = col
            break

    # Extract Brand
    for br in KNOWN_BRANDS:
        if br.lower() in lowered:
            filters.brand = br
            break

    # Extract Occasion
    for occ in KNOWN_OCCASIONS:
        if occ.lower() in lowered:
            filters.occasion = occ
            break

    # Residual keywords
    cleaned = re.sub(r'(?:under|below|above|between|and|to|less\s+than|for|men|women|in|of|with|₹|rs\.?)\s*\d*', '', lowered)
    keywords = [w for w in cleaned.split() if len(w) > 2 and w not in ["the", "find", "show", "looking", "want", "pair"]]
    filters.keywords = keywords

    return filters

def search_products(db: Session, req: SearchRequest) -> SearchResponse:
    parsed = parse_natural_language_query(req.query)

    # Effective filters combine explicit request parameters with extracted natural language facets
    effective_category = req.category or parsed.category
    effective_colour = req.colour or parsed.colour
    effective_brand = req.brand or parsed.brand
    effective_min_price = req.min_price if req.min_price is not None else parsed.min_price
    effective_max_price = req.max_price if req.max_price is not None else parsed.max_price

    query = db.query(Product).filter(Product.active == True)

    if effective_category:
        query = query.filter(Product.category.ilike(f"%{effective_category}%"))
    if effective_colour:
        query = query.filter(Product.colour.ilike(f"%{effective_colour}%"))
    if effective_brand:
        query = query.filter(Product.brand.ilike(f"%{effective_brand}%"))
    if effective_min_price is not None:
        query = query.filter(Product.price >= effective_min_price)
    if effective_max_price is not None:
        query = query.filter(Product.price <= effective_max_price)

    candidate_products = query.all()

    if not candidate_products:
        return SearchResponse(
            items=[],
            total=0,
            page=req.page,
            limit=req.limit,
            pages=0,
            query=req.query,
            parsed_filters=parsed,
            parser_type="deterministic_rule_tfidf"
        )

    # TF-IDF Ranking if text query provided and sort_by is 'relevance'
    if req.query.strip() and req.sort_by == "relevance" and len(candidate_products) > 1:
        corpus = [
            f"{p.name} {p.brand} {p.category} {p.subcategory or ''} {p.description or ''} {p.colour} {p.occasion or ''} {' '.join(p.tags or [])}"
            for p in candidate_products
        ]
        try:
            vectorizer = TfidfVectorizer(stop_words='english')
            tfidf_matrix = vectorizer.fit_transform(corpus)
            query_vec = vectorizer.transform([req.query])
            sim_scores = cosine_similarity(query_vec, tfidf_matrix).flatten()
            
            # Combine cosine similarity with product rating bonus
            ranked_indices = np.argsort(-(sim_scores + 0.1 * np.array([p.rating / 5.0 for p in candidate_products])))
            candidate_products = [candidate_products[i] for i in ranked_indices]
        except Exception:
            # Fallback if vocabulary is empty or single character
            pass
    elif req.sort_by == "price_asc":
        candidate_products.sort(key=lambda p: p.price)
    elif req.sort_by == "price_desc":
        candidate_products.sort(key=lambda p: p.price, reverse=True)
    elif req.sort_by == "rating":
        candidate_products.sort(key=lambda p: p.rating, reverse=True)

    total = len(candidate_products)
    start = (req.page - 1) * req.limit
    end = start + req.limit
    paginated = candidate_products[start:end]
    pages = (total + req.limit - 1) // req.limit if total > 0 else 1

    return SearchResponse(
        items=[ProductResponse.from_orm(p) for p in paginated],
        total=total,
        page=req.page,
        limit=req.limit,
        pages=pages,
        query=req.query,
        parsed_filters=parsed,
        parser_type="deterministic_rule_tfidf"
    )
