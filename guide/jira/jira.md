https://naha1691anlm.atlassian.net?continue=https%3A%2F%2Fnaha1691anlm.atlassian.net%2Fwelcome%2Fsoftware&atlOrigin=eyJpIjoiZmUxM2Y0NTU3YzYyNDFhOTg3MDRhYzc0YWFiMjc4ZDMiLCJwIjoiaiJ9


The architecture ticket
ARCHITECTURE SOLUTION: end-to-end system design, dataset selection and data integration plan (Highest, 13 pts, top of the design epic). It's ~190 lines covering everything you asked for:

Solution + why — 3-tier + separate FastAPI ML microservice, and the argument for why ML doesn't live inside NestJS
Which datasets and why — RetailRocket for recommendation (2.7M events matching your user_events schema), Online Retail II for forecasting (2 years of invoices, long enough for lag features), Olist for catalog/review enrichment, your synthetic generator for demo seeding and local seasonality (Ramzan/Eid/school season), MovieLens as learning-only
How they integrate — field-level mapping table (visitorid → user_events.userId, Quantity → sales_daily.unitsSold, and so on for every column), then the full pipeline from data/raw/ through seed scripts → Mongo → feature engineering → training → .joblib artifacts → cache collections → React
Service contract between NestJS and FastAPI, the fallback chain, model versioning, and non-functional targets
Epic breakdown
Setup (6) · Design (8) · Data pipeline (9) · NestJS backend (14) · ML service (6) · Recommendation M1 (13) · Forecasting M2 (10) · Analytics M3 (4) · React frontend (11) · Admin dashboard (9) · AI assistant M4 (5) · Evaluation (11) · Deployment (7) · Docs & report (7)

The two milestones from your guide are explicit tickets: the Week-4 vertical slice, and the hybrid recommender that has to hit ≥25% Precision@10 over baseline.

Importing
Settings → System → External System Import → CSV, map Epic Name and Epic Link directly. If your project is team-managed (likely, since it's a new welcome/software project), there's no Epic Link field — import the 14 epic rows first, then swap the Epic Link values for the new issue keys and map that column to Parent. Full steps are at the top of the markdown file.

If you'd rather I create the tickets in Jira directly, connect the Atlassian MCP server and I can push them without the CSV step.