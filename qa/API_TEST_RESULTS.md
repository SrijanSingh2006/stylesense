# Registered API inventory and validation

Inventory generated from the actual FastAPI OpenAPI schema.

| Method | Route | Operation |
|---|---|---|
| GET | `/api/v1/health` | `get_health_api_v1_health_get` |
| GET | `/api/v1/products` | `get_products_api_v1_products_get` |
| GET | `/api/v1/products/{product_id}` | `get_product_api_v1_products__product_id__get` |
| POST | `/api/v1/search` | `post_search_api_v1_search_post` |
| POST | `/api/v1/visual-search` | `post_visual_search_api_v1_visual_search_post` |
| GET | `/api/v1/recommendations/{customer_id}` | `get_recommendations_api_v1_recommendations__customer_id__get` |
| GET | `/api/v1/recommendations/{customer_id}/complete-look` | `get_look_recommendation_api_v1_recommendations__customer_id__complete_look_get` |
| POST | `/api/v1/size-recommendation` | `post_size_recommendation_api_v1_size_recommendation_post` |
| POST | `/api/v1/cart/events` | `record_cart_event_api_v1_cart_events_post` |
| POST | `/api/v1/orders` | `create_order_api_v1_orders_post` |
| POST | `/api/v1/events` | `post_event_api_v1_events_post` |
| GET | `/api/v1/analytics/overview` | `get_overview_api_v1_analytics_overview_get` |
| GET | `/api/v1/analytics/funnel` | `get_funnel_api_v1_analytics_funnel_get` |
| GET | `/api/v1/analytics/cohorts` | `get_cohorts_api_v1_analytics_cohorts_get` |
| GET | `/api/v1/analytics/products` | `get_products_analytics_api_v1_analytics_products_get` |
| GET | `/api/v1/analytics/north-star` | `get_north_star_api_v1_analytics_north_star_get` |
| GET | `/api/v1/segments` | `get_segments_api_v1_segments_get` |
| GET | `/api/v1/segments/{segment_name}` | `get_segment_detail_api_v1_segments__segment_name__get` |
| GET | `/api/v1/experiments` | `list_experiments_api_v1_experiments_get` |
| POST | `/api/v1/experiments` | `create_experiment_api_v1_experiments_post` |
| GET | `/api/v1/experiments/{experiment_id}` | `get_experiment_api_v1_experiments__experiment_id__get` |
| PATCH | `/api/v1/experiments/{experiment_id}` | `update_experiment_api_v1_experiments__experiment_id__patch` |
| POST | `/api/v1/experiments/{experiment_id}/assign` | `assign_variant_api_v1_experiments__experiment_id__assign_post` |
| GET | `/api/v1/experiments/{experiment_id}/results` | `get_results_api_v1_experiments__experiment_id__results_get` |
| GET | `/api/v1/feature-flags` | `get_feature_flags_api_v1_feature_flags_get` |
| POST | `/api/v1/feature-flags` | `create_feature_flag_api_v1_feature_flags_post` |
| PATCH | `/api/v1/feature-flags/{flag_id}` | `update_feature_flag_api_v1_feature_flags__flag_id__patch` |
| GET | `/api/v1/feature-flags/eligibility/{customer_id}` | `eligibility_api_v1_feature_flags_eligibility__customer_id__get` |
| GET | `/api/v1/inventory` | `get_inventory_api_v1_inventory_get` |
| GET | `/api/v1/inventory/alerts` | `get_alerts_api_v1_inventory_alerts_get` |
| GET | `/api/v1/inventory/forecast/{product_id}` | `get_forecast_api_v1_inventory_forecast__product_id__get` |
| POST | `/api/v1/inventory/movements` | `create_movement_api_v1_inventory_movements_post` |
| GET | `/api/v1/returns/overview` | `get_overview_api_v1_returns_overview_get` |
| GET | `/api/v1/returns/insights` | `get_insights_api_v1_returns_insights_get` |
| GET | `/api/v1/catalogue/quality` | `get_quality_api_v1_catalogue_quality_get` |
| GET | `/api/v1/catalogue/issues` | `get_issues_api_v1_catalogue_issues_get` |
| PATCH | `/api/v1/catalogue/issues/{issue_id}` | `patch_issue_api_v1_catalogue_issues__issue_id__patch` |
| POST | `/api/v1/promotions/simulate` | `post_simulation_api_v1_promotions_simulate_post` |
| GET | `/api/v1/roadmap/tasks` | `list_tasks_api_v1_roadmap_tasks_get` |
| POST | `/api/v1/roadmap/tasks` | `add_task_api_v1_roadmap_tasks_post` |
| PATCH | `/api/v1/roadmap/tasks/{task_id}` | `modify_task_api_v1_roadmap_tasks__task_id__patch` |
| DELETE | `/api/v1/roadmap/tasks/{task_id}` | `remove_task_api_v1_roadmap_tasks__task_id__delete` |
| GET | `/api/v1/releases` | `list_releases_api_v1_releases_get` |
| POST | `/api/v1/releases` | `add_release_api_v1_releases_post` |
| PATCH | `/api/v1/releases/{release_id}` | `modify_release_api_v1_releases__release_id__patch` |
| GET | `/api/v1/feedback` | `list_feedback_api_v1_feedback_get` |
| POST | `/api/v1/feedback` | `add_feedback_api_v1_feedback_post` |
| PATCH | `/api/v1/feedback/{feedback_id}` | `modify_feedback_api_v1_feedback__feedback_id__patch` |
| GET | `/api/v1/wishlist/{customer_id}` | `list_wishlist_api_v1_wishlist__customer_id__get` |
| PUT | `/api/v1/wishlist/{customer_id}/{product_id}` | `add_wishlist_api_v1_wishlist__customer_id___product_id__put` |
| DELETE | `/api/v1/wishlist/{customer_id}/{product_id}` | `remove_wishlist_api_v1_wishlist__customer_id___product_id__delete` |
| GET | `/` | `root__get` |

GET routes are parameterized in test_api_inventory.py using seeded IDs. Write-route smoke checks exercise missing/invalid input without accepting server errors. Positive CRUD, stock effects, error privacy, experiments, wishlist and rollback assertions are covered separately in test_api.py, test_reliability.py and test_metrics.py. These tests do not claim exhaustive failure injection for every endpoint. Final executed counts are in TEST_RESULTS.md.
