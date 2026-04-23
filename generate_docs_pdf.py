"""
CRS Full Documentation PDF Generator
Run from repo root:  python generate_docs_pdf.py
Output: CRS_Documentation.pdf
"""

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm, mm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, PageBreak, KeepTogether
)
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_JUSTIFY
from reportlab.platypus import FrameBreak
from reportlab.lib.colors import HexColor, white, black
import datetime

# ─────────────────── Color palette ───────────────────
GREEN_DARK   = HexColor("#14532d")
GREEN_MID    = HexColor("#16a34a")
GREEN_LIGHT  = HexColor("#dcfce7")
GREEN_XL     = HexColor("#f0fdf4")
AMBER        = HexColor("#f59e0b")
AMBER_LIGHT  = HexColor("#fef3c7")
BLUE         = HexColor("#0284c7")
BLUE_LIGHT   = HexColor("#e0f2fe")
PURPLE       = HexColor("#7c3aed")
PURPLE_LIGHT = HexColor("#f3e8ff")
GRAY_DARK    = HexColor("#1f2937")
GRAY_MID     = HexColor("#6b7280")
GRAY_LIGHT   = HexColor("#f3f4f6")
GRAY_BG      = HexColor("#f9fafb")
RED          = HexColor("#dc2626")
RED_LIGHT    = HexColor("#fef2f2")
CODE_BG      = HexColor("#1e293b")
CODE_FG      = HexColor("#e2e8f0")

def mk_styles():
    base = getSampleStyleSheet()

    def add(name, **kw):
        base.add(ParagraphStyle(name=name, **kw))

    # prefix all names so they never clash with the built-in stylesheet
    add("CoverTitle",
        fontName="Helvetica-Bold", fontSize=34, textColor=white,
        alignment=TA_CENTER, spaceAfter=6, leading=42)
    add("CoverSub",
        fontName="Helvetica", fontSize=15, textColor=HexColor("#bbf7d0"),
        alignment=TA_CENTER, spaceAfter=4)
    add("CoverMeta",
        fontName="Helvetica", fontSize=11, textColor=HexColor("#86efac"),
        alignment=TA_CENTER, spaceAfter=2)

    add("DocH1",
        fontName="Helvetica-Bold", fontSize=22, textColor=GREEN_DARK,
        spaceBefore=18, spaceAfter=8, leading=28,
        borderPadding=(0,0,4,0))
    add("DocH2",
        fontName="Helvetica-Bold", fontSize=16, textColor=GREEN_DARK,
        spaceBefore=14, spaceAfter=6, leading=22)
    add("DocH3",
        fontName="Helvetica-Bold", fontSize=13, textColor=GREEN_MID,
        spaceBefore=10, spaceAfter=4, leading=18)
    add("DocH4",
        fontName="Helvetica-Bold", fontSize=11, textColor=GRAY_DARK,
        spaceBefore=8, spaceAfter=3, leading=16)

    add("DocBody",
        fontName="Helvetica", fontSize=10, textColor=GRAY_DARK,
        spaceAfter=5, leading=15, alignment=TA_JUSTIFY)
    add("DocBullet",
        fontName="Helvetica", fontSize=10, textColor=GRAY_DARK,
        spaceAfter=3, leading=14, leftIndent=16,
        bulletIndent=4, bulletFontName="Helvetica")
    add("DocCode",
        fontName="Courier", fontSize=8.5, textColor=CODE_FG,
        backColor=CODE_BG, spaceAfter=4, leading=13,
        leftIndent=10, rightIndent=10,
        borderPadding=(5, 8, 5, 8))
    add("DocCodeInline",
        fontName="Courier", fontSize=9, textColor=HexColor("#7c3aed"))
    add("DocNote",
        fontName="Helvetica-Oblique", fontSize=9.5, textColor=HexColor("#0369a1"),
        backColor=BLUE_LIGHT, leftIndent=10, rightIndent=10,
        borderPadding=(4, 8, 4, 8), spaceAfter=5, leading=14)
    add("DocWarning",
        fontName="Helvetica-Oblique", fontSize=9.5, textColor=HexColor("#92400e"),
        backColor=AMBER_LIGHT, leftIndent=10, rightIndent=10,
        borderPadding=(4, 8, 4, 8), spaceAfter=5, leading=14)
    add("DocTOC",
        fontName="Helvetica", fontSize=11, textColor=GRAY_DARK,
        spaceAfter=3, leading=16, leftIndent=12)
    add("DocTOCSection",
        fontName="Helvetica-Bold", fontSize=12, textColor=GREEN_DARK,
        spaceAfter=2, leading=17, spaceBefore=6)
    add("DocTableHeader",
        fontName="Helvetica-Bold", fontSize=9, textColor=white, alignment=TA_CENTER)
    add("DocTableCell",
        fontName="Helvetica", fontSize=9, textColor=GRAY_DARK, leading=13)
    add("DocTableCellCode",
        fontName="Courier", fontSize=8, textColor=GRAY_DARK, leading=12)
    add("DocCaption",
        fontName="Helvetica-Oblique", fontSize=9, textColor=GRAY_MID,
        alignment=TA_CENTER, spaceAfter=6)
    add("DocSectionTag",
        fontName="Helvetica-Bold", fontSize=8, textColor=GREEN_MID,
        spaceAfter=0)
    return base

S = mk_styles()

def P(text, style="DocBody"):     return Paragraph(text, S[style])
def SP(n=6):                      return Spacer(1, n)
def HR(color=GREEN_LIGHT, t=1.5): return HRFlowable(width="100%", thickness=t, color=color, spaceAfter=4, spaceBefore=4)
def PB():                         return PageBreak()

def bullet(items, icon="•"):
    return [P(f"{icon}  {i}", "DocBullet") for i in items]

def code_block(lines):
    text = "<br/>".join(
        line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace(" ", "&nbsp;")
        for line in lines
    )
    return P(text, "DocCode")

def section_header(title, tag=None):
    elems = []
    if tag:
        elems.append(P(tag.upper(), "DocSectionTag"))
    elems += [P(title, "DocH1"), HR(GREEN_LIGHT, 2)]
    return elems

def sub_header(title):
    return [P(title, "DocH2"), HR(GRAY_LIGHT, 1)]

def styled_table(headers, rows, col_widths=None, header_color=None):
    hc = header_color or GREEN_DARK
    data = [[P(h, "DocTableHeader") for h in headers]]
    for row in rows:
        data.append([
            P(str(cell), "DocTableCellCode" if i == 0 else "DocTableCell")
            for i, cell in enumerate(row)
        ])
    t = Table(data, colWidths=col_widths, repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND",   (0,0), (-1,0),  hc),
        ("ROWBACKGROUNDS",(0,1),(-1,-1), [white, GRAY_BG]),
        ("BOX",          (0,0), (-1,-1), 1,   GRAY_LIGHT),
        ("INNERGRID",    (0,0), (-1,-1), 0.5, GRAY_LIGHT),
        ("TOPPADDING",   (0,0), (-1,-1), 5),
        ("BOTTOMPADDING",(0,0), (-1,-1), 5),
        ("LEFTPADDING",  (0,0), (-1,-1), 7),
        ("RIGHTPADDING", (0,0), (-1,-1), 7),
        ("VALIGN",       (0,0), (-1,-1), "MIDDLE"),
    ]))
    return t

def info_box(text, style="DocNote"):
    smap = {"Note": "DocNote", "Warning": "DocWarning"}
    return [SP(2), P(text, smap.get(style, style)), SP(2)]

# ═══════════════════════════════════════════════════════════════════
# CONTENT BUILDERS
# ═══════════════════════════════════════════════════════════════════

# CONTENT BUILDERS
# ═══════════════════════════════════════════════════════════════════

from reportlab.platypus.flowables import Flowable

def _draw_cover(canvas, doc):
    """Draw the full-page cover directly on the canvas (used in onFirstPage callback)."""
    canvas.saveState()
    w, h = A4
    cx = w / 2;  cy = h / 2

    # Background
    canvas.setFillColor(GREEN_DARK)
    canvas.rect(0, 0, w, h, fill=1, stroke=0)

    # Top/bottom accent bars
    canvas.setFillColor(GREEN_MID)
    canvas.rect(0, h - 0.8*cm, w, 0.8*cm, fill=1, stroke=0)
    canvas.rect(0, 0, w, 0.8*cm, fill=1, stroke=0)

    # Side accent bars
    canvas.setFillColor(HexColor("#15803d"))
    canvas.rect(0, 0, 0.5*cm, h, fill=1, stroke=0)
    canvas.rect(w - 0.5*cm, 0, 0.5*cm, h, fill=1, stroke=0)

    # Badge box
    canvas.setFillColor(HexColor("#166534"))
    canvas.roundRect(cx - 1.5*cm, cy + 2.5*cm, 3*cm, 2.7*cm, 0.4*cm, fill=1, stroke=0)
    canvas.setFillColor(HexColor("#4ade80"))
    canvas.setFont("Helvetica-Bold", 34)
    canvas.drawCentredString(cx, cy + 3.5*cm, "FM")
    canvas.setFillColor(HexColor("#86efac"))
    canvas.setFont("Helvetica", 8)
    canvas.drawCentredString(cx, cy + 2.95*cm, "FASAL MITRA")

    # Main title
    canvas.setFillColor(white)
    canvas.setFont("Helvetica-Bold", 28)
    canvas.drawCentredString(cx, cy + 1.8*cm, "CROP RECOMMENDATION")
    canvas.drawCentredString(cx, cy + 1.1*cm, "SYSTEM  (CRS)")

    # Tagline
    canvas.setFillColor(HexColor("#bbf7d0"))
    canvas.setFont("Helvetica", 13)
    canvas.drawCentredString(cx, cy + 0.3*cm, "AI-Powered Smart Farming Platform  —  Fasal Mitra")

    # Divider line
    canvas.setStrokeColor(HexColor("#4ade80"))
    canvas.setLineWidth(1.5)
    canvas.line(cx - 5.5*cm, cy - 0.15*cm, cx + 5.5*cm, cy - 0.15*cm)

    # Doc type label
    canvas.setFillColor(HexColor("#86efac"))
    canvas.setFont("Helvetica-Bold", 11)
    canvas.drawCentredString(cx, cy - 0.8*cm, "FULL TECHNICAL DOCUMENTATION")

    # Feature bullets
    feats = [
        "50 Indian Crops  —  Cereals, Pulses, Oilseeds, Spices, Fruits, Vegetables",
        "Real-time Soil Data (ISRIC SoilGrids)  +  Live Weather (Open-Meteo)",
        "RandomForest ML Pipeline (scikit-learn)  —  25,000 Training Samples",
        "FastAPI Backend  +  Next.js 16 Frontend  +  Async SQLite Database",
        "English & Hindi UI  |  Voice Input  |  GPS Location  |  Mobile-First PWA",
    ]
    canvas.setFont("Helvetica", 9.5)
    canvas.setFillColor(HexColor("#86efac"))
    for i, f in enumerate(feats):
        canvas.drawCentredString(cx, cy - 1.9*cm - i * 0.62*cm, f"  {f}  ")

    # Footer meta
    canvas.setFillColor(HexColor("#4ade80"))
    canvas.setFont("Helvetica", 9)
    today = datetime.date.today().strftime("%d %B %Y")
    canvas.drawCentredString(cx, 1.4*cm, f"Version 1.0  |  Generated: {today}  |  Confidential")

    canvas.restoreState()



def toc():
    sections = [
        ("1", "Project Overview"),
        ("2", "System Architecture"),
        ("3", "Technology Stack"),
        ("4", "Repository Structure"),
        ("5", "Backend — FastAPI Application"),
        ("5.1", "  Application Entry Point (main.py)"),
        ("5.2", "  Configuration (config.py)"),
        ("5.3", "  Database Models"),
        ("5.4", "  API Routers"),
        ("5.4.1", "    POST /recommend"),
        ("5.4.2", "    POST /feedback"),
        ("5.4.3", "    GET /admin/metrics"),
        ("5.4.4", "    GET /admin/feedback"),
        ("5.5", "  Pydantic Schemas"),
        ("6", "External Data Services"),
        ("6.1", "  Geocoding Service (Nominatim / OSM)"),
        ("6.2", "  Weather Service (Open-Meteo / OWM)"),
        ("6.3", "  Soil Service (ISRIC SoilGrids v2.0)"),
        ("7", "Machine Learning Pipeline"),
        ("7.1", "  Feature Engineering"),
        ("7.2", "  Model Architecture"),
        ("7.3", "  Training Script"),
        ("7.4", "  Inference Engine"),
        ("7.5", "  Rule-based Fallback"),
        ("7.6", "  50 Crop Profiles"),
        ("8", "Frontend — Next.js Application"),
        ("8.1", "  Page Inventory"),
        ("8.2", "  Recommend Page Flow"),
        ("8.3", "  Admin Dashboard"),
        ("8.4", "  Internationalisation (i18n)"),
        ("8.5", "  API Client Layer"),
        ("9", "Environment Variables & Configuration"),
        ("10", "Docker Deployment"),
        ("11", "Local Development Guide"),
        ("12", "Supported Crops — Complete List"),
        ("13", "API Quick Reference"),
        ("14", "Error Codes & Troubleshooting"),
        ("15", "Future Roadmap"),
    ]
    elems = section_header("Table of Contents")
    for num, title in sections:
        indent = len(num.split(".")) - 1
        style = "DocTOCSection" if "." not in num else "DocTOC"
        elems.append(P(f"{'&nbsp;' * (indent * 6)}{num}. {title}", style))
    elems.append(PB())
    return elems


def section_overview():
    elems = section_header("1. Project Overview", "Overview")
    elems += [
        P("The <b>Crop Recommendation System (CRS)</b> — branded as <b>Fasal Mitra</b> (Farmer's Friend) — "
          "is a production-ready, mobile-first AI platform designed to help Indian farmers select the most "
          "suitable crops for their land based on real-time soil chemistry and live weather conditions. "
          "The platform supports both English and Hindi, includes voice input for low-literacy users, "
          "and is designed to work on low-end smartphones with intermittent connectivity."),
        SP(),
    ]
    elems += sub_header("Mission")
    elems += [
        P("Provide every Indian farmer with personalised, data-driven crop advice that was previously "
          "available only to large agribusinesses with access to agronomists and soil-testing labs."),
        SP(4),
    ]
    elems += sub_header("Key Capabilities")
    elems.append(styled_table(
        ["#", "Capability", "Details"],
        [
            ["1", "Smart Location Input", "Village name (geocoded via OSM Nominatim) or GPS coordinates"],
            ["2", "Real-time Soil Data", "ISRIC SoilGrids v2.0 — global 250m resolution, no API key"],
            ["3", "Live Weather Data", "Open-Meteo — free, no API key needed; 30-day rainfall + current T & RH"],
            ["4", "AI Crop Prediction", "RandomForest scikit-learn pipeline trained on 25,000 synthetic + ICAR samples"],
            ["5", "Top-3 Recommendations", "Ranked by ML confidence % with plain-language explanations"],
            ["6", "Agronomic Advice", "Planting window, irrigation schedule, NPK fertiliser guidance for 50 crops"],
            ["7", "Farmer Feedback Loop", "Thumbs-up/down + comment → stored in SQLite → admin analytics"],
            ["8", "Admin Dashboard", "Token-protected metrics: total requests, satisfaction rate, feedback log"],
            ["9", "Bilingual UI", "English & Hindi; architecture ready for Marathi, Gujarati, Tamil"],
            ["10", "Voice Input", "Browser Web Speech API for hands-free village name entry"],
            ["11", "Farmer Toolbox", "Weather forecast, mandi prices, govt schemes, crop calendar, disease guide"],
            ["12", "Progressive Web App", "Installable on Android, works offline once loaded"],
        ],
        [1*cm, 4.5*cm, 9.5*cm],
    ))
    elems += [SP(8)]
    elems += sub_header("Application Flow")
    elems += bullet([
        "<b>Step 1 — Location:</b> Farmer enters village name or shares GPS coordinates.",
        "<b>Step 2 — Geocoding:</b> Village name → (lat, lon) via OpenStreetMap Nominatim (free).",
        "<b>Step 3 — Data Fetch (parallel):</b> Soil NPK/pH from ISRIC SoilGrids; temperature/humidity/rainfall from Open-Meteo.",
        "<b>Step 4 — ML Inference:</b> 7 features → RandomForest pipeline → top-3 crop probabilities.",
        "<b>Step 5 — Results:</b> Cards with confidence bars, plain-language 'why', planting/water/fertiliser advice.",
        "<b>Step 6 — Feedback:</b> Farmer rates relevance; data stored for continuous improvement.",
    ])
    elems.append(PB())
    return elems


def section_architecture():
    elems = section_header("2. System Architecture", "Architecture")
    elems += [
        P("CRS follows a clean <b>three-tier architecture</b>: a React/Next.js frontend (Tier 1), "
          "a FastAPI Python backend (Tier 2), and an SQLite async database (Tier 3). "
          "Two free external APIs enrich requests with real-world data."),
        SP(4),
    ]
    elems += sub_header("Architecture Diagram")
    arch = [
        ["LAYER", "COMPONENT", "TECHNOLOGY", "ROLE"],
        ["Frontend",    "Next.js App (apps/web)",    "Next.js 16 + Tailwind CSS v4",  "UI, i18n, voice input, GPS"],
        ["API Gateway", "FastAPI App (apps/api)",    "FastAPI + Pydantic + Uvicorn",   "REST API, validation, orchestration"],
        ["Services",    "Geocoding Service",         "OpenStreetMap Nominatim (free)", "Village name → lat/lon"],
        ["Services",    "Weather Service",           "Open-Meteo (free, no key)",      "Temp, humidity, 30-day rainfall"],
        ["Services",    "Soil Service",              "ISRIC SoilGrids v2.0 (free)",    "N, P, K, pH at any GPS point"],
        ["ML",          "Inference Engine",          "scikit-learn RandomForest",      "Crop classification → probabilities"],
        ["ML",          "Model Artifact",            "joblib (.joblib)",              "Persisted trained pipeline"],
        ["Database",    "Request Log",               "SQLite + SQLAlchemy async",      "Audit trail of all predictions"],
        ["Database",    "Feedback Store",            "SQLite + SQLAlchemy async",      "Farmer thumbs-up/down + comments"],
    ]
    header = arch[0]
    rows = arch[1:]
    elems.append(styled_table(header, rows, [2.5*cm, 4*cm, 4.5*cm, 4*cm]))
    elems += [SP(10)]
    elems += sub_header("Request Lifecycle")
    elems.append(code_block([
        "Client (Browser)",
        "  │",
        "  ├─ POST /recommend  ─────────────────────────────────────────────────►  FastAPI",
        "  │      body: { village: 'Rampur' }                                          │",
        "  │                                                         ┌─────────────────┤",
        "  │                                             geocode()   │    Nominatim OSM│",
        "  │                                             ──────────► │◄────────────────┘",
        "  │                                                          │",
        "  │                                         asyncio.gather()│",
        "  │                                    ┌───────────────────►│◄──── Open-Meteo",
        "  │                                    │                    │◄──── ISRIC SoilGrids",
        "  │                                    └────────────────────┤",
        "  │                                                          │",
        "  │                                        ML inference()    │",
        "  │                                   RandomForest pipeline  │",
        "  │                                                          │",
        "  │                                        log to SQLite     │",
        "  │◄──────────── RecommendResponse ─────────────────────────┘",
    ]))
    elems.append(PB())
    return elems


def section_tech_stack():
    elems = section_header("3. Technology Stack", "Stack")

    elems += sub_header("Backend")
    elems.append(styled_table(
        ["Package", "Version", "Purpose"],
        [
            ["FastAPI", "≥ 0.111", "Async Python web framework; OpenAPI/Swagger auto-docs"],
            ["Uvicorn", "≥ 0.29",  "ASGI server with auto-reload for development"],
            ["Pydantic v2", "≥ 2.7", "Request/response validation and serialisation"],
            ["pydantic-settings", "≥ 2.3", "Typed environment variable loading"],
            ["SQLAlchemy", "≥ 2.0", "Async ORM for SQLite (aiosqlite engine)"],
            ["aiosqlite", "≥ 0.20", "Async SQLite driver"],
            ["httpx", "≥ 0.27",  "Async HTTP client for external API calls"],
            ["scikit-learn", "≥ 1.5", "RandomForestClassifier + StandardScaler pipeline"],
            ["joblib", "≥ 1.4",  "Model serialisation and deserialisation"],
            ["numpy", "≥ 1.26",  "Feature array construction for inference"],
            ["pandas", "≥ 2.2",  "Synthetic dataset generation during training"],
        ],
        [3*cm, 2*cm, 10*cm],
    ))
    elems += [SP(8)]
    elems += sub_header("Frontend")
    elems.append(styled_table(
        ["Package", "Version", "Purpose"],
        [
            ["Next.js", "16.1.6", "React full-stack framework; App Router; webpack mode"],
            ["React", "19.2",   "UI component library"],
            ["Tailwind CSS", "v4", "Utility-first CSS; v4 uses PostCSS plugin (@tailwindcss/postcss)"],
            ["lucide-react", "≥ 0.574", "Icon library (600+ SVG icons)"],
            ["clsx", "≥ 2.1",  "Conditional class name utility"],
            ["TypeScript", "≥ 5", "Static typing across all frontend code"],
        ],
        [3*cm, 2*cm, 10*cm],
    ))
    elems.append(PB())
    return elems


def section_repo_structure():
    elems = section_header("4. Repository Structure", "Structure")
    elems.append(P(
        "The repository follows a monorepo layout with two independent applications "
        "(<b>api</b> and <b>web</b>) alongside a shared <b>ml/</b> training workspace."))
    elems.append(SP(4))
    elems.append(code_block([
        "CRS/",
        "├── apps/",
        "│   ├── api/                      # FastAPI backend",
        "│   │   ├── app/",
        "│   │   │   ├── main.py           # App factory + CORS + startup hooks",
        "│   │   │   ├── config.py         # Pydantic-settings (env vars)",
        "│   │   │   ├── schemas.py        # All Pydantic request/response models",
        "│   │   │   ├── routers/",
        "│   │   │   │   ├── recommend.py  # POST /recommend",
        "│   │   │   │   ├── feedback.py   # POST /feedback",
        "│   │   │   │   └── admin.py      # GET /admin/metrics, GET /admin/feedback",
        "│   │   │   ├── services/",
        "│   │   │   │   ├── geocoding.py          # Nominatim (OSM) geocoder",
        "│   │   │   │   ├── weather_service.py    # Open-Meteo + OWM fallback",
        "│   │   │   │   ├── soil_service.py       # ISRIC SoilGrids v2.0",
        "│   │   │   │   └── recommendation_service.py  # ML → advice → response",
        "│   │   │   ├── ml/",
        "│   │   │   │   └── inference.py          # Model loader + predict_top_n()",
        "│   │   │   └── db/",
        "│   │   │       └── models.py             # SQLAlchemy ORM + async engine",
        "│   │   ├── ml_artifacts/",
        "│   │   │   ├── model.joblib              # Trained RandomForest pipeline",
        "│   │   │   └── eval_report.json          # Classification report",
        "│   │   ├── requirements.txt",
        "│   │   └── Dockerfile",
        "│   │",
        "│   └── web/                      # Next.js frontend",
        "│       ├── src/app/",
        "│       │   ├── page.tsx          # Landing page (hero + toolbox)",
        "│       │   ├── recommend/page.tsx # Main recommendation flow",
        "│       │   ├── admin/page.tsx    # Token-protected admin dashboard",
        "│       │   ├── weather/page.tsx  # 7-day weather forecast",
        "│       │   ├── mandi/page.tsx    # Commodity mandi prices",
        "│       │   ├── yojana/page.tsx   # Government schemes",
        "│       │   ├── calendar/page.tsx # Crop sowing/harvest calendar",
        "│       │   ├── diseases/page.tsx # Crop disease identification",
        "│       │   ├── crops/page.tsx    # 50-crop encyclopaedia",
        "│       │   └── calculator/page.tsx # Cost & profit calculator",
        "│       ├── src/components/",
        "│       │   ├── Navbar.tsx        # Top navigation",
        "│       │   ├── BottomNav.tsx     # Mobile bottom tab bar",
        "│       │   ├── Footer.tsx",
        "│       │   ├── LanguageProvider.tsx  # Global language context",
        "│       │   └── VoiceInput.tsx    # Web Speech API mic button",
        "│       ├── src/lib/",
        "│       │   ├── api.ts            # fetch() wrappers for backend",
        "│       │   ├── i18n.ts           # Translation dictionary (EN + HI)",
        "│       │   └── types.ts          # Shared TypeScript interfaces",
        "│       ├── next.config.ts",
        "│       ├── postcss.config.mjs",
        "│       └── package.json",
        "│",
        "├── ml/",
        "│   ├── scripts/",
        "│   │   ├── train.py              # Synthetic data gen + model training",
        "│   │   └── test_inference.py     # Smoke test for trained model",
        "│   ├── crop_model/schema.py      # Feature/label constants",
        "│   └── data/                     # Place Crop_recommendation.csv here",
        "│",
        "├── docker-compose.yml",
        "├── .env.example",
        "└── README.md",
    ]))
    elems.append(PB())
    return elems


def section_backend():
    elems = section_header("5. Backend — FastAPI Application", "Backend")

    # 5.1 main.py
    elems += sub_header("5.1  Application Entry Point (main.py)")
    elems += [
        P("The entry point creates the <b>FastAPI</b> application instance, configures <b>CORS</b> middleware, "
          "registers all routers, and hooks into the startup lifecycle to initialise the database and "
          "auto-train the ML model if no artifact is found."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Concern", "Implementation Detail"],
        [
            ["CORS Origins", "Reads from ALLOWED_ORIGINS env var; also allows any *.vercel.app preview URL via regex"],
            ["Startup Hook", "init_db() creates tables; _ensure_model() trains if model.joblib absent"],
            ["Auto-Training", "Imports ml.scripts.train.train() from repo root; ~30 s on CPU for 25k samples"],
            ["Health Endpoint", "GET /health → {\"status\": \"ok\"} — used by Docker health checks"],
            ["Swagger UI", "Auto-generated at http://localhost:8000/docs"],
            ["ReDoc", "Auto-generated at http://localhost:8000/redoc"],
        ],
        [4*cm, 11*cm],
    ))
    elems += [SP(10)]

    # 5.2 config.py
    elems += sub_header("5.2  Configuration (config.py)")
    elems += [
        P("All configuration is handled via <b>pydantic-settings</b> which reads from environment variables "
          "and a <code>.env</code> file. The <b>Settings</b> class is instantiated once as a module-level "
          "singleton (<code>settings</code>) and imported wherever needed."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Variable", "Default", "Description"],
        [
            ["DATABASE_URL",          "sqlite+aiosqlite:///./crs.db",   "Async SQLAlchemy connection string"],
            ["ADMIN_TOKEN",           "changeme-admin-token",           "Bearer token for /admin/* routes"],
            ["OPENWEATHER_API_KEY",   "(empty)",                        "Optional OWM key; Open-Meteo is used by default (no key needed)"],
            ["MODEL_ARTIFACT_PATH",   "../ml_artifacts/model.joblib",   "Path to trained model, relative to app/ or absolute"],
            ["ALLOWED_ORIGINS",       "[localhost:3000/3001/3002]",     "JSON array or CSV of allowed CORS origins"],
            ["PORT",                  "8000",                           "Uvicorn listen port"],
        ],
        [4*cm, 4.5*cm, 6.5*cm],
    ))
    elems += [SP(10)]

    # 5.3 Database
    elems += sub_header("5.3  Database Models")
    elems += [
        P("CRS uses <b>SQLite</b> via <b>SQLAlchemy 2.0 async</b> engine with <b>aiosqlite</b>. "
          "Two tables are defined: <code>request_logs</code> for audit trails and <code>feedback</code> "
          "for farmer ratings."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Table", "Column", "Type", "Description"],
        [
            ["request_logs", "id",                  "Integer PK",  "Auto-increment primary key"],
            ["request_logs", "recommendation_id",   "String(64)",  "UUID linking log to recommendation"],
            ["request_logs", "village",             "String(200)", "Village name input (nullable)"],
            ["request_logs", "lat",                 "Float",       "Resolved latitude"],
            ["request_logs", "lon",                 "Float",       "Resolved longitude"],
            ["request_logs", "created_at",          "DateTime TZ", "Server-side timestamp"],
            ["feedback",     "id",                  "Integer PK",  "Auto-increment primary key"],
            ["feedback",     "recommendation_id",   "String(64)",  "UUID matching request_logs"],
            ["feedback",     "helpful",             "Boolean",     "Thumbs-up = True, Thumbs-down = False"],
            ["feedback",     "comment",             "Text",        "Optional farmer comment (max 1000 chars)"],
            ["feedback",     "created_at",          "DateTime TZ", "Server-side timestamp"],
        ],
        [2.5*cm, 3.5*cm, 2.5*cm, 6.5*cm],
    ))
    elems += [SP(10)]

    # 5.4 Routers
    elems += sub_header("5.4  API Routers")

    # POST /recommend
    elems.append(P("5.4.1  POST /recommend", "DocH3"))
    elems += [
        P("The core endpoint. Accepts a location, fetches live data in parallel, runs ML inference, "
          "stores a request log, and returns ranked crop recommendations."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Step", "Action", "Service / Module"],
        [
            ["1", "Validate input — at least village OR lat+lon required", "Pydantic / FastAPI"],
            ["2", "GPS provided? Skip geocoding. Village only? Call geocode()", "geocoding.py → Nominatim"],
            ["3", "Fetch soil + weather in parallel (asyncio.gather)", "soil_service.py + weather_service.py"],
            ["4", "Run ML inference on 7-feature vector", "ml/inference.py → predict_top_n()"],
            ["5", "Build RecommendResponse with weather/soil/location data", "recommendation_service.py"],
            ["6", "Insert RequestLog row and commit", "db/models.py"],
            ["7", "Return JSON response", "FastAPI serialisation"],
        ],
        [1*cm, 7.5*cm, 6.5*cm],
    ))
    elems += [SP(8)]
    elems.append(P("Request body schema:", "DocH4"))
    elems.append(code_block([
        '// Option A — village name only',
        '{ "village": "Rampur" }',
        '',
        '// Option B — GPS coordinates only',
        '{ "lat": 28.6139, "lon": 77.2090 }',
        '',
        '// Option C — both (GPS takes priority over geocoding)',
        '{ "village": "Rampur", "lat": 28.6139, "lon": 77.2090 }',
    ]))
    elems += [SP(4)]
    elems.append(P("Response body schema:", "DocH4"))
    elems.append(code_block([
        '{',
        '  "recommendation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",',
        '  "recommendations": [',
        '    {',
        '      "crop": "Wheat",',
        '      "confidence": 0.82,',
        '      "why": "Suitable for wheat because of cool climate, moderate humidity...",',
        '      "advice": {',
        '        "planting": "October-November (Rabi season)",',
        '        "water": "4-6 irrigations; critical at crown root & heading",',
        '        "fertilizer": "120:60:40 NPK kg/ha; split N in 2 doses"',
        '      }',
        '    },',
        '    { "crop": "Barley", "confidence": 0.11, ... },',
        '    { "crop": "Mustard", "confidence": 0.05, ... }',
        '  ],',
        '  "weather": { "temperature": 18.2, "humidity": 62.0, "rainfall": 45.7 },',
        '  "soil": { "N": 112.0, "P": 65.0, "K": 88.0, "ph": 7.2 },',
        '  "location": { "lat": 28.61390, "lon": 77.20900, "display": "Rampur" },',
        '  "note": null',
        '}',
    ]))
    elems += [SP(8)]

    # POST /feedback
    elems.append(P("5.4.2  POST /feedback", "DocH3"))
    elems += [
        P("Stores the farmer's rating for a previous recommendation. No authentication required."),
        SP(4),
    ]
    elems.append(code_block([
        '// Request',
        '{',
        '  "recommendation_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",',
        '  "helpful": true,',
        '  "comment": "Wheat worked great in my field!"  // optional',
        '}',
        '',
        '// Response',
        '{ "ok": true }',
    ]))
    elems += [SP(8)]

    # GET /admin/metrics
    elems.append(P("5.4.3  GET /admin/metrics", "DocH3"))
    elems += [
        P("Returns aggregate usage statistics. Requires <code>X-Admin-Token</code> header matching <code>ADMIN_TOKEN</code> env var."),
        SP(4),
    ]
    elems.append(code_block([
        '// Response',
        '{',
        '  "total_recommend_requests": 1247,',
        '  "total_feedback": 389,',
        '  "helpful_yes": 341,',
        '  "helpful_no": 48',
        '}',
    ]))
    elems += [SP(8)]

    # GET /admin/feedback
    elems.append(P("5.4.4  GET /admin/feedback", "DocH3"))
    elems += [
        P("Returns the 100 most recent feedback rows, newest first. Same <code>X-Admin-Token</code> auth required."),
        SP(4),
    ]
    elems.append(code_block([
        '// Response — array of FeedbackRow',
        '[',
        '  {',
        '    "id": 42,',
        '    "recommendation_id": "abc123...",',
        '    "helpful": true,',
        '    "comment": "Excellent suggestion!",',
        '    "created_at": "2026-02-25 10:30:00"',
        '  },',
        '  ...',
        ']',
    ]))
    elems += [SP(8)]

    # 5.5 Schemas
    elems += sub_header("5.5  Pydantic Schemas (schemas.py)")
    elems += [
        P("All request and response bodies are declared as Pydantic v2 models in <b>schemas.py</b>. "
          "FastAPI uses these for automatic validation, serialisation, and OpenAPI documentation generation."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Model", "Direction", "Key Fields"],
        [
            ["RecommendRequest",  "Request",  "village: str | None; lat: float | None; lon: float | None"],
            ["CropRecommendation","Response", "crop, confidence (0-1), why: str, advice: Advice"],
            ["Advice",            "Nested",   "planting: str; water: str; fertilizer: str"],
            ["WeatherInfo",       "Nested",   "temperature (°C); humidity (%); rainfall (mm/30d)"],
            ["SoilInfo",          "Nested",   "N (cg/kg); P (mg/kg); K (mg/kg); ph (pH units)"],
            ["RecommendResponse", "Response", "recommendation_id; recommendations[3]; weather; soil; location"],
            ["FeedbackRequest",   "Request",  "recommendation_id; helpful: bool; comment: str | None"],
            ["FeedbackResponse",  "Response", "ok: bool"],
            ["MetricsResponse",   "Response", "total_recommend_requests; total_feedback; helpful_yes; helpful_no"],
            ["FeedbackRow",       "Response", "id; recommendation_id; helpful; comment; created_at"],
        ],
        [3.5*cm, 2*cm, 9.5*cm],
    ))
    elems.append(PB())
    return elems


def section_services():
    elems = section_header("6. External Data Services", "Services")

    # Geocoding
    elems += sub_header("6.1  Geocoding Service")
    elems += [
        P("File: <code>app/services/geocoding.py</code>"),
        P("<b>Provider:</b> OpenStreetMap Nominatim — completely free, no API key, open-source."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Attribute", "Value"],
        [
            ["Endpoint",      "https://nominatim.openstreetmap.org/search"],
            ["Strategy",      "Try India-restricted search first (countrycodes=in), then global fallback"],
            ["Rate Limit",    "1 request/second (OSM policy); User-Agent header mandatory"],
            ["Timeout",       "10 seconds"],
            ["Returns",       "(lat: float, lon: float)"],
            ["Error",         "ValueError if location not found; httpx.HTTPError on network failure"],
        ],
        [4*cm, 11*cm],
    ))
    elems += [SP(10)]

    # Weather
    elems += sub_header("6.2  Weather Service")
    elems += [
        P("File: <code>app/services/weather_service.py</code>"),
        P("<b>Primary Provider:</b> Open-Meteo (entirely free, no API key, OSS). "
          "<b>Fallback Provider:</b> OpenWeatherMap (requires OPENWEATHER_API_KEY in .env)."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Property", "Open-Meteo API Field", "Unit", "Notes"],
        [
            ["Temperature", "current.temperature_2m",           "°C",  "2m above ground, current instant"],
            ["Humidity",    "current.relative_humidity_2m",     "%",   "Relative humidity at 2m"],
            ["Rainfall",    "daily.precipitation_sum (×30 days)","mm", "Sum of last 30 days of daily precip"],
        ],
        [3*cm, 5*cm, 2*cm, 5*cm],
    ))
    elems += [SP(4)]
    elems += info_box(
        "ℹ️  Open-Meteo is used by default. No API key needed. If it fails, the system "
        "falls back to OpenWeatherMap (requires key), and finally to a hardcoded stub "
        "(T=25°C, RH=65%, rain=120mm) to ensure the system always returns a result.",
        "Note"
    )
    elems += [SP(6)]

    # Soil
    elems += sub_header("6.3  Soil Service (ISRIC SoilGrids v2.0)")
    elems += [
        P("File: <code>app/services/soil_service.py</code>"),
        P("<b>Provider:</b> ISRIC World Soil Information — SoilGrids v2.0 REST API. "
          "Free, no API key, 250m global resolution, peer-reviewed data science."),
        SP(4),
    ]
    elems.append(styled_table(
        ["SoilGrids Property", "Raw Unit",  "Conversion",         "Model Feature"],
        [
            ["nitrogen",  "cg/kg × 100", "Use raw value directly",       "N (cg/kg)"],
            ["phh2o",     "pH × 10",     "Divide by 10",                 "ph (0–14)"],
            ["P (phosphorus)", "Not available globally", "Estimated: N×0.50 + 10", "P (mg/kg)"],
            ["K (potassium)",  "Not available globally", "Estimated: N×0.65 + 15", "K (mg/kg)"],
        ],
        [4*cm, 3*cm, 4*cm, 4*cm],
    ))
    elems += [SP(4)]
    elems += info_box(
        "⚠️  SoilGrids does not provide plant-available P or exchangeable K globally. "
        "CRS estimates these from N using agronomic ratios typical for Indian agricultural soils "
        "(N:P:K ≈ 4:2:3). These estimates are clamped to realistic ranges "
        "(N: 10–350 cg/kg, P: 5–145 mg/kg, K: 5–205 mg/kg, pH: 3.5–10).",
        "Warning"
    )
    elems.append(PB())
    return elems


def section_ml():
    elems = section_header("7. Machine Learning Pipeline", "ML")

    # 7.1 Features
    elems += sub_header("7.1  Feature Engineering")
    elems += [
        P("The model takes <b>7 numeric features</b> derived from soil chemistry and weather. "
          "All features are standardised inside the sklearn Pipeline via <b>StandardScaler</b>."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Feature", "Source", "Unit", "Typical Range"],
        [
            ["N", "ISRIC SoilGrids (nitrogen)", "cg/kg", "10 – 350"],
            ["P", "Estimated from N",            "mg/kg", "5 – 145"],
            ["K", "Estimated from N",            "mg/kg", "5 – 205"],
            ["ph", "ISRIC SoilGrids (phh2o/10)", "pH",   "3.5 – 10"],
            ["temperature", "Open-Meteo current", "°C",  "5 – 45"],
            ["humidity",    "Open-Meteo current", "%",   "20 – 100"],
            ["rainfall",    "Open-Meteo 30-day sum", "mm","0 – 400"],
        ],
        [3*cm, 4.5*cm, 2*cm, 5.5*cm],
    ))
    elems += [SP(10)]

    # 7.2 Model
    elems += sub_header("7.2  Model Architecture")
    elems += [
        P("The ML artifact is a <b>scikit-learn Pipeline</b> consisting of two stages:"),
        SP(4),
    ]
    elems.append(styled_table(
        ["Stage", "Component", "Key Hyperparameters"],
        [
            ["1. Scaler", "StandardScaler", "Remove mean, scale to unit variance (per feature)"],
            ["2. Classifier", "RandomForestClassifier",
             "n_estimators=300, max_depth=18, min_samples_leaf=2, class_weight='balanced', random_state=42"],
        ],
        [2*cm, 4*cm, 9*cm],
    ))
    elems += [SP(8)]
    elems += info_box(
        "💡  class_weight='balanced' ensures equal representation during training even though some crops "
        "(e.g. Rice, Wheat) have more overlapping climate profiles than rare speciality crops "
        "(e.g. Cardamom, BlackPepper).",
        "Note"
    )
    elems += [SP(6)]

    # 7.3 Training
    elems += sub_header("7.3  Training Script (ml/scripts/train.py)")
    elems += [
        P("The training script generates a <b>fully synthetic labelled dataset</b> using crop-specific "
          "agro-climatic ranges sourced from <b>ICAR handbooks, FAO EcoCrop</b>, and "
          "<b>Krishi Vigyan Kendra</b> field manuals. No external dataset download is required."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Step", "Action"],
        [
            ["1", "For each of 50 crops: sample SAMPLES_PER_CROP=500 random points inside the crop's valid ranges (uniform dist.)"],
            ["2", "Add a centroid sample (mean of ranges) with ×3 weight to anchor each class"],
            ["3", "Concatenate all samples → DataFrame of 25,000+ rows with 7 features + label"],
            ["4", "80/20 stratified train-test split"],
            ["5", "Fit StandardScaler + RandomForestClassifier(n_estimators=300) Pipeline on train set"],
            ["6", "Evaluate on test set → save classification_report as eval_report.json"],
            ["7", "Persist pipeline to apps/api/ml_artifacts/model.joblib via joblib.dump()"],
        ],
        [0.7*cm, 14.3*cm],
    ))
    elems += [SP(8)]
    elems.append(code_block([
        "# Run from repo root",
        "python ml/scripts/train.py",
        "",
        "# Output",
        "Training samples: 25050",
        "Test accuracy: 0.9823  (example)",
        "Saved to apps/api/ml_artifacts/model.joblib",
    ]))
    elems += [SP(8)]

    # 7.4 Inference
    elems += sub_header("7.4  Inference Engine (app/ml/inference.py)")
    elems += [
        P("The inference module provides a <b>singleton model loader</b> with lazy initialisation "
          "and a <b>predict_top_n()</b> function used by the recommendation service."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Function / Class", "Description"],
        [
            ["InputFeatures (dataclass)", "Typed 7-field struct matching model feature order"],
            ["CropPrediction (dataclass)", "Holds crop name + probability (0..1)"],
            ["_load_model()", "Singleton; loads joblib artifact on first call, returns None if missing"],
            ["predict_top_n(features, n=3)", "Builds numpy array → model.predict_proba() → argsort(desc) → top-n list"],
            ["_stub_predictions()", "Rule-based fallback; scores each crop by how many features fall inside its profile"],
        ],
        [5*cm, 10*cm],
    ))
    elems += [SP(8)]

    # 7.5 Fallback
    elems += sub_header("7.5  Rule-based Fallback")
    elems += [
        P("When <code>model.joblib</code> is absent, the inference engine falls back to a "
          "rule-based scorer. For each of the 50 crops, it counts how many of the 5 key features "
          "(temperature, humidity, rainfall, N, ph) fall inside the crop's valid range. "
          "The top-3 by score are returned with normalised pseudo-probabilities."),
        SP(4),
    ]
    elems += info_box(
        "ℹ️  The fallback ensures the API returns useful results immediately without requiring model training. "
        "On first startup, main.py detects the missing artifact and auto-trains the model in the background "
        "(~30 seconds on a standard CPU).",
        "Note"
    )
    elems += [SP(6)]

    # 7.6 Crop profiles
    elems += sub_header("7.6  50 Crop Profiles — Agro-climatic Ranges Summary")
    elems.append(styled_table(
        ["Category", "Crops"],
        [
            ["Cereals (7)",       "Rice, Wheat, Maize, Barley, Bajra (Pearl Millet), Jowar (Sorghum), Ragi (Finger Millet)"],
            ["Pulses (3)",        "Chickpea, Lentil, Peas"],
            ["Oilseeds (5)",      "Soybean, Groundnut, Mustard, Sunflower, Sesame"],
            ["Cash / Fiber (4)",  "Cotton, Sugarcane, Jute, Tobacco"],
            ["Plantation (6)",    "Tea, Coffee, Rubber, Coconut, Arecanut, Cashew"],
            ["Spices (8)",        "Black Pepper, Cardamom, Clove, Ginger, Turmeric, Garlic, Coriander, Cumin"],
            ["Fruits (9)",        "Mango, Banana, Papaya, Guava, Pomegranate, Grape, Orange, Watermelon, Jackfruit"],
            ["Vegetables (8)",    "Tomato, Onion, Potato, Brinjal, Cabbage, Cauliflower, Okra, Chilli"],
        ],
        [3.5*cm, 11.5*cm],
    ))
    elems.append(PB())
    return elems


def section_frontend():
    elems = section_header("8. Frontend — Next.js Application", "Frontend")

    # 8.1 Pages
    elems += sub_header("8.1  Page Inventory")
    elems.append(styled_table(
        ["Route", "File", "Description"],
        [
            ["/",            "page.tsx",             "Landing page: hero, crop strip, farmer toolbox grid, how-it-works, features"],
            ["/recommend",   "recommend/page.tsx",    "Main recommendation flow: input → loading → 3 result cards + feedback"],
            ["/admin",       "admin/page.tsx",        "Token-protected dashboard: metrics stats + feedback table"],
            ["/weather",     "weather/page.tsx",      "7-day weather forecast (Open-Meteo) for user's location"],
            ["/mandi",       "mandi/page.tsx",        "Commodity mandi prices (static/mock data, extensible)"],
            ["/yojana",      "yojana/page.tsx",       "15+ government agricultural schemes (PM-KISAN, Fasal Bima, etc.)"],
            ["/calendar",    "calendar/page.tsx",     "Crop sowing & harvest calendar by season"],
            ["/diseases",    "diseases/page.tsx",     "Common crop disease identification and treatment guide"],
            ["/crops",       "crops/page.tsx",        "50-crop encyclopaedia with climate requirements"],
            ["/calculator",  "calculator/page.tsx",   "Cost & profit calculator for crop planning"],
        ],
        [2.5*cm, 4.5*cm, 8*cm],
    ))
    elems += [SP(10)]

    # 8.2 Recommend flow
    elems += sub_header("8.2  Recommend Page Flow (recommend/page.tsx)")
    elems += [
        P("This is the most complex page. It manages the complete user journey:"),
        SP(4),
    ]
    elems.append(styled_table(
        ["State", "Value", "Meaning"],
        [
            ["status", "idle",     "Initial state; form visible"],
            ["status", "locating", "Browser GPS permission dialog shown"],
            ["status", "loading",  "API request in flight; spinner shown"],
            ["status", "success",  "Results displayed; feedback controls shown"],
            ["status", "error",    "Error message card shown"],
        ],
        [2*cm, 2.5*cm, 10.5*cm],
    ))
    elems += [SP(6)]
    elems += bullet([
        "<b>VoiceInput</b> component uses the browser's <code>SpeechRecognition</code> API to fill the village field hands-free.",
        "<b>GPS button</b> calls <code>navigator.geolocation.getCurrentPosition()</code> with a 12-second timeout.",
        "<b>CropCard</b> component renders each recommendation with animated confidence bar, expandable advice panel.",
        "<b>Feedback section</b> appears after results; sends to <code>POST /feedback</code> on submit.",
        "All text strings go through <code>t(lang, key)</code> for bilingual output.",
    ])
    elems += [SP(8)]

    # 8.3 Admin
    elems += sub_header("8.3  Admin Dashboard (admin/page.tsx)")
    elems += [
        P("A token-gated dashboard accessible at <code>/admin</code>. The user enters their "
          "<code>ADMIN_TOKEN</code> and clicks Load to fetch metrics and feedback simultaneously "
          "via <code>Promise.all()</code>."),
        SP(4),
    ]
    elems += bullet([
        "StatCard components display total requests, total feedback, thumbs-up count, thumbs-down count.",
        "Satisfaction percentage calculated client-side from (helpful_yes / total_feedback) × 100.",
        "Feedback table shows the 100 most recent rows with colour-coded thumbs icons.",
        "No backend session state — token passed per request in <code>X-Admin-Token</code> header.",
    ])
    elems += [SP(8)]

    # 8.4 i18n
    elems += sub_header("8.4  Internationalisation (i18n)")
    elems += [
        P("CRS uses a lightweight custom i18n system (no external library) defined in <code>src/lib/i18n.ts</code>."),
        SP(4),
    ]
    elems.append(code_block([
        "// Usage",
        'import { t } from "@/lib/i18n";',
        "import { useLanguage } from '@/components/LanguageProvider';",
        "",
        "const { lang } = useLanguage();  // 'en' | 'hi'",
        't(lang, "heroTitle1")  // → "AI se Jaane" (hi) or "Know with AI" (en)',
    ]))
    elems += [SP(4)]
    elems += info_box(
        "ℹ️  The architecture supports adding Marathi, Gujarati, Tamil, etc. with zero "
        "structural changes — just extend the translation dictionary in i18n.ts "
        "and add the new language code to the Language type in types.ts.",
        "Note"
    )
    elems += [SP(8)]

    # 8.5 API client
    elems += sub_header("8.5  API Client Layer (src/lib/api.ts)")
    elems += [
        P("All backend communication is centralised in <code>api.ts</code>. The base URL is read "
          "from <code>NEXT_PUBLIC_API_BASE_URL</code> (defaults to <code>http://localhost:8000</code>)."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Function", "HTTP", "Endpoint", "Description"],
        [
            ["recommendCrop(req)", "POST", "/recommend", "Sends village/GPS, returns RecommendResponse"],
            ["submitFeedback(req)", "POST", "/feedback",  "Sends recommendation_id + helpful + comment"],
        ],
        [3.5*cm, 1.5*cm, 2.5*cm, 7.5*cm],
    ))
    elems.append(PB())
    return elems


def section_env():
    elems = section_header("9. Environment Variables & Configuration", "Config")

    elems += sub_header("Backend (.env in apps/api/)")
    elems.append(code_block([
        "# Database",
        "DATABASE_URL=sqlite+aiosqlite:///./crs.db",
        "",
        "# Admin",
        "ADMIN_TOKEN=your-secret-token-here",
        "",
        "# Weather (optional — Open-Meteo is free and used by default)",
        "OPENWEATHER_API_KEY=",
        "",
        "# ML",
        "MODEL_ARTIFACT_PATH=../ml_artifacts/model.joblib",
        "",
        "# CORS — JSON array or CSV",
        'ALLOWED_ORIGINS=["https://your-app.vercel.app"]',
    ]))
    elems += [SP(8)]

    elems += sub_header("Frontend (.env.local in apps/web/)")
    elems.append(code_block([
        "# Backend API URL (no trailing slash)",
        "NEXT_PUBLIC_API_BASE_URL=http://localhost:8000",
        "",
        "# For production:",
        "# NEXT_PUBLIC_API_BASE_URL=https://your-api.onrender.com",
    ]))
    elems += [SP(6)]
    elems += info_box(
        "ℹ️  Only NEXT_PUBLIC_* variables are embedded in the browser bundle by Next.js. "
        "Never put secrets in NEXT_PUBLIC_* variables.",
        "Note"
    )
    elems.append(PB())
    return elems


def section_docker():
    elems = section_header("10. Docker Deployment", "Docker")
    elems += [
        P("Both services are containerised and orchestrated with <b>docker-compose</b>. "
          "The setup requires no additional infrastructure — SQLite runs inside the API container "
          "with a named volume for persistence."),
        SP(4),
    ]
    elems.append(styled_table(
        ["Service", "Image", "Port", "Notes"],
        [
            ["api",  "apps/api/Dockerfile",  "8000", "FastAPI + Uvicorn; mounts ./apps/api for live reload"],
            ["web",  "apps/web/Dockerfile",  "3000", "Next.js production build"],
        ],
        [2*cm, 4.5*cm, 1.5*cm, 7*cm],
    ))
    elems += [SP(8)]
    elems.append(code_block([
        "# 1. Copy environment file",
        "Copy-Item .env.example .env",
        "",
        "# 2. Edit .env with your tokens (optional)",
        "notepad .env",
        "",
        "# 3. Build and start",
        "docker-compose up --build",
        "",
        "# Services available at:",
        "#   Frontend  →  http://localhost:3000",
        "#   API       →  http://localhost:8000",
        "#   Swagger   →  http://localhost:8000/docs",
    ]))
    elems.append(PB())
    return elems


def section_dev():
    elems = section_header("11. Local Development Guide", "Dev")

    elems += sub_header("Prerequisites")
    elems.append(styled_table(
        ["Tool", "Minimum Version", "Purpose"],
        [
            ["Node.js",  "20.x LTS",    "Frontend build and dev server"],
            ["Python",   "3.11+",       "Backend API and ML training"],
            ["npm",      "9+",          "Frontend package management"],
            ["pip",      "23+",         "Python package management"],
            ["Git",      "2.x",         "Source control"],
            ["Docker",   "24+ (optional)", "Containerised deployment"],
        ],
        [3*cm, 3.5*cm, 8.5*cm],
    ))
    elems += [SP(8)]
    elems += sub_header("Step-by-step Setup (Windows PowerShell)")
    elems.append(code_block([
        "# ── Step 1: Clone and enter repo ──────────────────────────────",
        "cd d:\\CRS",
        "",
        "# ── Step 2: Frontend ───────────────────────────────────────────",
        "cd apps\\web",
        "Copy-Item .env.local.example .env.local",
        "npm install",
        "npm run dev        # → http://localhost:3000",
        "",
        "# Open a NEW terminal for the backend",
        "",
        "# ── Step 3: Backend ────────────────────────────────────────────",
        "cd d:\\CRS\\apps\\api",
        "python -m venv .venv",
        ".\\.venv\\Scripts\\Activate.ps1",
        "pip install -r requirements.txt",
        "Copy-Item .env.example .env",
        "uvicorn app.main:app --reload --port 8000",
        "# → http://localhost:8000 | Swagger at :8000/docs",
        "",
        "# ── Step 4: (Optional) Train the ML model ──────────────────────",
        "cd d:\\CRS",
        "pip install -r ml\\requirements.txt",
        "python ml\\scripts\\train.py",
        "# Restart the API server after training",
        "",
        "# ── Step 5: Verify inference ────────────────────────────────────",
        "python ml\\scripts\\test_inference.py",
    ]))
    elems += [SP(8)]
    elems += sub_header("Build for Production")
    elems.append(code_block([
        "# Frontend production build",
        "cd d:\\CRS\\apps\\web",
        "npm run build      # Uses --webpack flag (configured)",
        "npm run start      # Serve production build",
        "",
        "# Backend production start",
        "cd d:\\CRS\\apps\\api",
        "uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4",
    ]))
    elems.append(PB())
    return elems


def section_crops_list():
    elems = section_header("12. Supported Crops — Complete List (50)", "Crops")
    elems.append(styled_table(
        ["#", "Crop", "Category", "Season", "Min Temp", "Max Temp", "N Range (cg/kg)"],
        [
            ["1",  "Rice",        "Cereal",     "Kharif / Rabi (south)", "20°C", "36°C", "100–220"],
            ["2",  "Wheat",       "Cereal",     "Rabi",                  "8°C",  "24°C", "80–160"],
            ["3",  "Maize",       "Cereal",     "Kharif / Spring",       "18°C", "34°C", "80–160"],
            ["4",  "Barley",      "Cereal",     "Rabi",                  "5°C",  "22°C", "60–130"],
            ["5",  "Bajra",       "Cereal",     "Kharif",                "25°C", "42°C", "40–100"],
            ["6",  "Jowar",       "Cereal",     "Kharif / Rabi",         "25°C", "40°C", "50–120"],
            ["7",  "Ragi",        "Cereal",     "Kharif",                "20°C", "32°C", "40–100"],
            ["8",  "Chickpea",    "Pulse",      "Rabi",                  "8°C",  "27°C", "28–90"],
            ["9",  "Lentil",      "Pulse",      "Rabi",                  "8°C",  "26°C", "28–85"],
            ["10", "Peas",        "Pulse",      "Rabi",                  "7°C",  "22°C", "25–80"],
            ["11", "Soybean",     "Oilseed",    "Kharif",                "18°C", "32°C", "25–90"],
            ["12", "Groundnut",   "Oilseed",    "Kharif / Rabi",         "24°C", "40°C", "50–120"],
            ["13", "Mustard",     "Oilseed",    "Rabi",                  "10°C", "25°C", "60–120"],
            ["14", "Sunflower",   "Oilseed",    "Spring / Kharif",       "18°C", "35°C", "60–130"],
            ["15", "Sesame",      "Oilseed",    "Kharif",                "25°C", "40°C", "30–80"],
            ["16", "Cotton",      "Cash/Fiber", "Summer",                "24°C", "40°C", "100–175"],
            ["17", "Sugarcane",   "Cash/Fiber", "Spring / Autumn",       "22°C", "40°C", "110–200"],
            ["18", "Jute",        "Cash/Fiber", "Summer",                "24°C", "37°C", "80–150"],
            ["19", "Tobacco",     "Cash/Fiber", "Rabi",                  "20°C", "35°C", "70–150"],
            ["20", "Tea",         "Plantation", "Year-round",            "15°C", "28°C", "90–180"],
            ["21", "Coffee",      "Plantation", "Year-round",            "15°C", "28°C", "80–160"],
            ["22", "Rubber",      "Plantation", "Year-round",            "20°C", "35°C", "80–150"],
            ["23", "Coconut",     "Plantation", "Year-round",            "22°C", "38°C", "90–170"],
            ["24", "Arecanut",    "Plantation", "Year-round (tropics)",  "20°C", "35°C", "80–150"],
            ["25", "Cashew",      "Plantation", "Year-round",            "20°C", "40°C", "60–140"],
            ["26", "BlackPepper", "Spice",      "Monsoon",               "20°C", "35°C", "100–200"],
            ["27", "Cardamom",    "Spice",      "Monsoon",               "10°C", "25°C", "120–210"],
            ["28", "Clove",       "Spice",      "Year-round (tropics)",  "20°C", "33°C", "100–200"],
            ["29", "Ginger",      "Spice",      "Kharif",                "20°C", "35°C", "80–170"],
            ["30", "Turmeric",    "Spice",      "Kharif",                "20°C", "35°C", "80–160"],
            ["31", "Garlic",      "Spice",      "Rabi",                  "8°C",  "28°C", "60–140"],
            ["32", "Coriander",   "Spice",      "Rabi",                  "8°C",  "26°C", "50–120"],
            ["33", "Cumin",       "Spice",      "Rabi",                  "8°C",  "25°C", "40–100"],
            ["34", "Chilli",      "Spice/Veg",  "Kharif / Rabi",         "20°C", "38°C", "80–160"],
            ["35", "Mango",       "Fruit",      "Summer (perennial)",    "20°C", "40°C", "60–140"],
            ["36", "Banana",      "Fruit",      "Year-round",            "20°C", "38°C", "80–170"],
            ["37", "Papaya",      "Fruit",      "Year-round",            "22°C", "38°C", "70–150"],
            ["38", "Guava",       "Fruit",      "Year-round",            "20°C", "40°C", "60–140"],
            ["39", "Pomegranate", "Fruit",      "Year-round",            "18°C", "38°C", "60–130"],
            ["40", "Grape",       "Fruit",      "Rabi / Summer",         "15°C", "38°C", "50–120"],
            ["41", "Orange",      "Fruit",      "Winter (perennial)",    "15°C", "38°C", "60–140"],
            ["42", "Watermelon",  "Fruit",      "Summer / Rabi",         "24°C", "40°C", "50–120"],
            ["43", "Jackfruit",   "Fruit",      "Year-round (tropics)",  "20°C", "38°C", "70–150"],
            ["44", "Tomato",      "Vegetable",  "Kharif / Rabi",         "15°C", "35°C", "80–160"],
            ["45", "Onion",       "Vegetable",  "Kharif / Rabi / Late",  "10°C", "32°C", "80–170"],
            ["46", "Potato",      "Vegetable",  "Rabi",                  "10°C", "25°C", "80–180"],
            ["47", "Brinjal",     "Vegetable",  "Kharif / Rabi",         "18°C", "35°C", "80–160"],
            ["48", "Cabbage",     "Vegetable",  "Rabi (cool season)",    "8°C",  "26°C", "70–160"],
            ["49", "Cauliflower", "Vegetable",  "Rabi",                  "8°C",  "26°C", "70–160"],
            ["50", "Okra",        "Vegetable",  "Kharif / Summer",       "25°C", "40°C", "60–140"],
        ],
        [0.6*cm, 2.5*cm, 2.3*cm, 3*cm, 1.7*cm, 1.8*cm, 3.1*cm],
    ))
    elems.append(PB())
    return elems


def section_api_ref():
    elems = section_header("13. API Quick Reference", "API Ref")
    elems.append(styled_table(
        ["Method", "Endpoint", "Auth", "Request Body / Header", "Returns"],
        [
            ["GET",  "/health",          "None",               "—",                                   "{ status: 'ok' }"],
            ["POST", "/recommend",       "None",               "{ village? } or { lat, lon }",         "RecommendResponse"],
            ["POST", "/feedback",        "None",               "{ recommendation_id, helpful, comment?}","{ ok: true }"],
            ["GET",  "/admin/metrics",   "X-Admin-Token hdr",  "—",                                   "MetricsResponse"],
            ["GET",  "/admin/feedback",  "X-Admin-Token hdr",  "—",                                   "FeedbackRow[]"],
            ["GET",  "/docs",            "None",               "—",                                   "Swagger UI (HTML)"],
            ["GET",  "/redoc",           "None",               "—",                                   "ReDoc UI (HTML)"],
            ["GET",  "/openapi.json",    "None",               "—",                                   "OpenAPI 3.0 schema"],
        ],
        [1.2*cm, 3.5*cm, 2.8*cm, 4.5*cm, 3*cm],
    ))
    elems += [SP(8)]
    elems += sub_header("HTTP Error Codes")
    elems.append(styled_table(
        ["Status", "Endpoint", "Cause"],
        [
            ["400", "Any",        "Malformed JSON body"],
            ["401", "/admin/*",   "Missing or wrong X-Admin-Token header"],
            ["404", "/recommend", "Village name could not be geocoded"],
            ["422", "/recommend", "No village or GPS coordinates provided"],
            ["503", "/recommend", "Geocoding or weather/soil APIs unavailable"],
        ],
        [1.5*cm, 3*cm, 10.5*cm],
    ))
    elems.append(PB())
    return elems


def section_troubleshoot():
    elems = section_header("14. Error Codes & Troubleshooting", "Debug")
    elems.append(styled_table(
        ["Error / Symptom", "Likely Cause", "Fix"],
        [
            ["Can't resolve 'tailwindcss' in D:\\CRS\\apps",
             "Next.js webpack resolver missing node_modules path",
             "Use --webpack flag (npm run dev / npm run build). Configured in next.config.ts."],
            ["ML model not found — using rule-based stub",
             "model.joblib missing from ml_artifacts/",
             "Run: python ml/scripts/train.py. Model auto-trains on first API startup."],
            ["SoilGrids failed — using regional stub",
             "ISRIC API timeout or network issue",
             "Stub values (N=120, P=55, K=70, pH=7.2) used automatically. Results still useful."],
            ["All weather APIs failed",
             "Open-Meteo unreachable + no OPENWEATHER_API_KEY",
             "Add OPENWEATHER_API_KEY to .env. Stub T=25°C used as last resort."],
            ["401 Invalid admin token",
             "Wrong token in X-Admin-Token header",
             "Set ADMIN_TOKEN in .env and use the same value in the admin UI."],
            ["404 Could not find location 'XYZ'",
             "OSM Nominatim doesn't recognise village name",
             "Use GPS button, or try a nearby city/district name."],
            ["CORS error in browser",
             "Frontend origin not in ALLOWED_ORIGINS",
             "Add frontend URL to ALLOWED_ORIGINS env var (JSON array format)."],
            ["npm run build fails with Turbopack error",
             "Custom webpack config not compatible with Turbopack (Next 16 default)",
             "Ensure scripts use --webpack flag (already configured in package.json)."],
        ],
        [4*cm, 4*cm, 7*cm],
    ))
    elems.append(PB())
    return elems


def section_roadmap():
    elems = section_header("15. Future Roadmap", "Roadmap")
    elems.append(styled_table(
        ["Priority", "Feature", "Details"],
        [
            ["High",   "Offline PWA support",          "Cache app shell + last recommendation; service worker + IndexedDB"],
            ["High",   "Real P/K soil data",           "Integrate ISRIC SoilGrids potassium/phosphorus when globally available"],
            ["High",   "PostgreSQL migration",         "Replace SQLite with async PostgreSQL for multi-instance deployment"],
            ["High",   "User accounts",                "Optional phone OTP auth; save history per farmer"],
            ["Medium", "More language support",        "Marathi, Gujarati, Tamil, Telugu, Bengali, Punjabi"],
            ["Medium", "Crop disease image upload",    "CNN-based leaf disease classifier (TensorFlow Lite / ONNX)"],
            ["Medium", "Live mandi price API",         "Integrate data.gov.in APMC mandi data via open API"],
            ["Medium", "Real weather forecast",        "Open-Meteo 7-day forecast cards on /weather page"],
            ["Medium", "Feedback-driven retraining",   "Weekly auto-retrain pipeline incorporating verified farmer outcomes"],
            ["Low",    "WhatsApp Bot",                 "Twilio WhatsApp API for SMS/WhatsApp-based recommendations"],
            ["Low",    "Satellite NDVI layer",         "Sentinel-2 crop health map using ESA Copernicus open data"],
            ["Low",    "Multi-crop rotation planning", "Suggest 2-year rotation sequences based on soil depletion"],
        ],
        [1.8*cm, 4.5*cm, 8.7*cm],
    ))
    elems += [SP(8)]
    elems.append(P(
        "The platform is architected for extension: the service layer, router layer, and frontend "
        "are cleanly separated, allowing each component to evolve independently. "
        "The i18n, ML, and external service layers can all be swapped or enhanced without "
        "touching the core application logic.",
        "DocBody"
    ))
    return elems


# ═══════════════════════════════════════════════════════════════════
# MAIN BUILDER
# ═══════════════════════════════════════════════════════════════════

def build_pdf(output_path: str = "CRS_Documentation.pdf"):
    print(f"Generating PDF → {output_path}")

    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2.2*cm,
        bottomMargin=2*cm,
        title="CRS — Crop Recommendation System — Full Technical Documentation",
        author="CRS Development Team",
        subject="AI-Powered Crop Recommendation System (Fasal Mitra)",
    )

    story = []
    story.append(PB())  # Page 1 = cover (drawn by onFirstPage)
    story += toc()
    story += section_overview()
    story += section_architecture()
    story += section_tech_stack()
    story += section_repo_structure()
    story += section_backend()
    story += section_services()
    story += section_ml()
    story += section_frontend()
    story += section_env()
    story += section_docker()
    story += section_dev()
    story += section_crops_list()
    story += section_api_ref()
    story += section_troubleshoot()
    story += section_roadmap()

    def on_first_page(canvas, doc):
        """Cover page -- drawn entirely via canvas callback."""
        _draw_cover(canvas, doc)

    def on_later_pages(canvas, doc):
        """Header + footer on every content page."""
        canvas.saveState()
        w, h = A4
        canvas.setFillColor(GREEN_DARK)
        canvas.rect(0, h - 1*cm, w, 1*cm, fill=1, stroke=0)
        canvas.setFont('Helvetica-Bold', 8)
        canvas.setFillColor(white)
        canvas.drawString(2*cm, h - 0.65*cm, 'CRS -- Crop Recommendation System')
        canvas.drawRightString(w - 2*cm, h - 0.65*cm, 'Fasal Mitra -- Technical Documentation')
        canvas.setFillColor(GREEN_LIGHT)
        canvas.rect(0, 0, w, 0.8*cm, fill=1, stroke=0)
        canvas.setFont('Helvetica', 7.5)
        canvas.setFillColor(GREEN_DARK)
        canvas.drawString(2*cm, 0.28*cm,
            f"Generated: {datetime.date.today().strftime('%d %B %Y')}  |  Version 1.0  |  Confidential")
        canvas.drawRightString(w - 2*cm, 0.28*cm, f'Page {doc.page}')
        canvas.restoreState()

    doc.build(story, onFirstPage=on_first_page, onLaterPages=on_later_pages)
    print(f'Done! -> {output_path}')


if __name__ == "__main__":
    build_pdf("CRS_Documentation.pdf")
