# Krishidhan IoT Sensor Model - AI Assistant Briefing

**Copy this entire document and paste it to any AI assistant (Claude, ChatGPT, etc.) when asking about Krishidhan work.**

---

## PROJECT CONTEXT

**Project Name:** Krishidhan (RGSTC-funded agri-tech platform)  
**Status:** Phase 1 ML complete (local), Phase 2 (IoT sensor integration) in progress  
**Student:** Shwet (pre-final year BTech CSE, DYPCET Kolhapur)  
**Faculty Supervisor:** [NAME - Faculty PI]  

**Live Web App:** React/Vite frontend (equipment rental + schemes marketplace)  
**New Component:** Python IoT sensor model (standalone, then integrate)

---

## WHAT'S ALREADY BUILT

### Phase 1 ML Models (Exist but location unknown)
- **Random Forest Crop Recommender:** Soil params (moisture, pH, NPK, EC, temp) + location → Top 3 crop recommendations
- **ICAR Fertilizer Engine:** Rule-based NPK recommendations for Maharashtra crops
- **Soil Health Scorer:** Deterministic scoring (0-100) based on soil parameters
- **Status:** Working locally, need to adapt for real-time sensor input

### Web App (React Frontend)
- **Location:** `krishidhan-webapp/` (Vite project)
- **Tech Stack:** React, Firebase (auth + Firestore), Tailwind CSS
- **Pages:** Home, Categories, Equipment details, Orders, Schemes, ImpactDashboard, Chatbot
- **Current Data Model:** Equipment listings, user profiles, rental requests
- **No ML integration yet:** ImpactDashboard is skeleton; Chatbot is empty
- **Deployment:** Vercel

---

## WHAT NEEDS TO BE BUILT

### Phase 2: IoT Sensor Model System
**Goal:** Build a Python ML pipeline that:
1. Ingests real-time sensor data (7-in-1 soil sensor + DHT22)
2. Runs crop, fertilizer, irrigation, soil health, weather risk models in parallel
3. Generates unified advisories
4. Wraps in FastAPI for integration with React frontend + Android app

**Architecture:**
```
ESP32 (7-in-1 sensor) → FastAPI Backend (Python ML models) → React Frontend + Android app
```

**Scope for Phase 2:**
- Mock sensor data generator (no real hardware yet)
- Adapt Phase 1 RF/ICAR models for sensor input
- Build irrigation + weather advisory engines
- Full pipeline: ingest → preprocess → model → aggregate → output
- FastAPI wrapper
- Deploy to Railway

**No changes to:** Existing React app (will integrate later via API calls)

---

## SENSOR INPUT SPECIFICATION

### Hardware Spec (7-in-1 Capacitive Soil Sensor + Environmental)

| Parameter | Unit | Range | Source |
|-----------|------|-------|--------|
| Soil Moisture | % | 0-100 | Capacitive sensor |
| Soil pH | pH | 3.5-8.5 | 7-in-1 sensor |
| Nitrogen (N) | mg/kg | 0-300 | 7-in-1 sensor |
| Phosphorus (P) | mg/kg | 0-150 | 7-in-1 sensor |
| Potassium (K) | mg/kg | 0-300 | 7-in-1 sensor |
| EC (Conductivity) | mS/cm | 0-2.0 | 7-in-1 sensor |
| Soil Temp | °C | 0-50 | 7-in-1 sensor |
| Air Humidity | % | 0-100 | DHT22/BME680 |
| Air Temp | °C | -40-85 | DHT22/BME680 |
| Rainfall | mm | 0-50/event | Rain gauge |

### Reading Frequency
- Real-time: Every 15 minutes
- Daily: 96 readings/day
- Historical window: 90 days rolling

### Sensor Payload (JSON)
```json
{
  "farm_id": "farm_123",
  "timestamp": "2026-06-19T14:30:00Z",
  "sensor_reading": {
    "soil": {
      "moisture_percent": 65.3,
      "ph": 6.8,
      "nitrogen_mg_kg": 120.5,
      "phosphorus_mg_kg": 45.2,
      "potassium_mg_kg": 180.0,
      "ec_ms_cm": 0.85,
      "temperature_c": 32.1
    },
    "environment": {
      "air_humidity_percent": 72.4,
      "air_temperature_c": 34.5,
      "rainfall_mm": 0.0
    },
    "location": {
      "latitude": 17.3569,
      "longitude": 75.7653,
      "city": "Kolhapur"
    }
  }
}
```

---

## MODEL REQUIREMENTS

### 1. Crop Recommender
**Input:** Soil params (moisture, pH, NPK, EC, temp) + location + season  
**Output:** Top 3 crop recommendations with confidence scores  
**Technique:** Random Forest (existing Phase 1 model)  
**Adaptation needed:** Currently takes static soil type + location → needs real-time sensor input

### 2. Soil Health Scorer
**Input:** All soil params (moisture, pH, NPK, EC)  
**Output:** Score (0-100) + breakdown + flags  
**Technique:** Weighted deterministic scoring  
**Weights (example):**
- pH balance: 25%
- Moisture: 25%
- Nutrients: 25%
- EC salinity: 15%
- Organic matter proxy: 10%

### 3. Fertilizer Recommendation Engine
**Input:** Soil params (NPK, pH, EC) + crop + target yield  
**Output:** NPK dosage (kg/ha) + application schedule  
**Technique:** ICAR rules + RF refinement (existing logic)  
**Adaptation needed:** Dynamic adjustment based on real sensor data vs. current deficit

### 4. Irrigation Advisory
**Input:** Current soil moisture + 7-day trend + rainfall forecast  
**Output:** "Irrigate now" / "Wait 48 hrs" / "Monitor"  
**Technique:** Threshold detection + trend analysis  
**Thresholds (example):**
- Rice: >60% moisture optimal
- Sugarcane: >50% moisture optimal
- Cotton: >40% moisture optimal
- Critical: <25% moisture → immediate irrigation

### 5. Weather-Based Risk Alerts
**Input:** Current conditions + 5-day forecast + historical patterns  
**Output:** Risk alerts (frost, heat stress, waterlogging, pest outbreak)  
**Technique:** Rule-based + anomaly detection  
**Risk types:**
- Frost: Temp <5°C for 3+ consecutive nights (Nov-Feb)
- Heat stress: Temp >38°C + humidity <35% for 5+ days (Apr-Jun)
- Waterlogging: Rainfall >50mm/24hrs + high soil moisture
- Pest risk: Temp 25-32°C + humidity 70-85% for 7+ days
- Disease risk: Humidity >80% + night temp 15-20°C for 3+ days

---

## MOCK DATA STRATEGY

### Why Mock Data First?
- No real sensors available yet
- Allows model validation before hardware arrives
- Synthetic data can stress-test edge cases

### Generation approach:
Create realistic seasonal patterns for Maharashtra (Deccan plateau):

**Monsoon (Jun-Oct):**
- High moisture: 60-80%
- High humidity: 75-90%
- Frequent rainfall: 40% of days
- Moderate temps: 25-36°C
- Example: normal_season.csv

**Dry season / Stress (remaining months):**
- Low moisture: 15-50%
- Low humidity: 30-60%
- Rare rainfall: <5% of days
- Variable temps: cold nights, hot days
- Example: stress_scenario.csv

**Anomalies (for testing detection):**
- Sudden moisture drop (irrigation missed)
- pH spikes (chemical event)
- Waterlogging (excess rainfall)
- Heat shock (temp swing >15°C in 24 hrs)
- Example: anomaly_test.csv

### Output Format
CSV files with columns:
```
timestamp, farm_id, soil_moisture, soil_ph, nitrogen_mg_kg, phosphorus_mg_kg, 
potassium_mg_kg, ec_ms_cm, soil_temp_c, air_humidity, air_temp_c, rainfall_mm
```

**Size:** 90 days × 96 readings/day = 8,640 rows per file

---

## EXPECTED MODEL OUTPUTS

### Combined Advisory (example)
```json
{
  "farm_id": "farm_001",
  "timestamp": "2026-06-19T14:30:00Z",
  "advisories": {
    "crop_recommendation": {
      "crops": [
        {"name": "rice", "confidence": 0.95},
        {"name": "sugarcane", "confidence": 0.78},
        {"name": "soybean", "confidence": 0.65}
      ],
      "reasoning": "High moisture (65%), neutral pH (6.8) ideal for rice in monsoon"
    },
    "soil_health": {
      "score": 82,
      "status": "GOOD",
      "flags": []
    },
    "fertilizer": {
      "nitrogen_kg_ha": 80,
      "phosphorus_kg_ha": 0,
      "potassium_kg_ha": 0,
      "schedule": [
        {"day": 0, "nutrient": "P", "dose": 15},
        {"day": 30, "nutrient": "N", "dose": 40}
      ]
    },
    "irrigation": {
      "action": "MONITOR",
      "moisture_current": 65.3,
      "threshold_crop": 50,
      "next_check_hours": 48
    },
    "weather_alerts": [
      {
        "type": "PEST_RISK",
        "severity": "MEDIUM",
        "action": "Scout for armyworms"
      }
    ]
  }
}
```

---

## TECH STACK & DEPLOYMENT

### Development
- **Language:** Python 3.11+
- **Package manager:** pip + virtual environments
- **IDE:** VS Code
- **ML libraries:** scikit-learn (RF), pandas, numpy
- **API framework:** FastAPI
- **Testing:** pytest

### Deployment (later)
- **Hosting:** Railway.app (PostgreSQL + FastAPI)
- **Database:** PostgreSQL (sensor readings, advisories)
- **Docker:** Containerized Python app
- **Frontend integration:** React app makes API calls to FastAPI

### Development machine specs
- **GPU:** RTX 4050 6GB (not needed for this, but available)
- **OS:** Windows 11 + WSL2
- **Ollama:** Local LLM inference (for Chatbot enhancement, future)

---

## PHASE-WISE BREAKDOWN

### Phase 1: Foundation (Weeks 1-2)
- [ ] Sensor schema + Pydantic validation
- [ ] Mock data generator (3 test CSV files)
- [ ] Data preprocessing (outlier, normalization)

### Phase 2: Core Models (Weeks 3-4)
- [ ] Crop recommender (adapt Phase 1 RF)
- [ ] Soil health scorer (deterministic)
- [ ] Fertilizer engine (ICAR rules)
- [ ] Irrigation advisor (threshold + trend)
- [ ] Weather alerts (rules + anomaly)

### Phase 3: Pipeline (Week 5)
- [ ] Sensor ingestion
- [ ] Batch processing (hourly/daily aggregation)
- [ ] Advisory synthesis (combine 5 models)
- [ ] Storage (JSON + mock DB)

### Phase 4: API (Week 6)
- [ ] FastAPI endpoints
- [ ] Request/response validation
- [ ] Error handling + logging

### Phase 5: Deployment (Week 7)
- [ ] Docker setup
- [ ] Railway deployment
- [ ] Integration test with React frontend

---

## CURRENT BLOCKERS & QUESTIONS

1. **Phase 1 ML code location?**
   - Where is the RF crop model saved? (Pickle? PKL file? In Jupyter?)
   - Where is ICAR fertilizer logic? (Python function? Spreadsheet?)
   - Where is soil health scorer? (Jupyter cell? Separate script?)
   - **Action:** Send Shwet to provide these files

2. **Real sensor data available?**
   - Do you have historical farm readings to validate against?
   - Or purely mock until hardware arrives?
   - **Action:** Confirm if mock-only or validation data exists

3. **7-in-1 sensor model?**
   - Which specific sensor model? (Link datasheet if possible)
   - Or use the spec above as approximation?
   - **Action:** Confirm sensor specs or approve mock spec

4. **QOSI fellowship application?**
   - Still active? Affects timeline?
   - Can this be framed as "research contribution" for application?
   - **Action:** Check status with Shwet

5. **Supervisor approval?**
   - Has your supervisor reviewed the Phase 2 scope?
   - Is she aligned with separate backend approach?
   - **Action:** Present plan, get sign-off before coding

---

## COMMUNICATION STYLE NOTES

**Shwet prefers:**
- Blunt, technical feedback (no fluff)
- Concrete code examples
- Direct problem-solving
- Building > studying theory
- Late-night deep dives acceptable
- Parallel problem-solving welcomed

**Shwet's background:**
- Intermediate Python + FastAPI
- Familiar with ML basics (RF, scaling, validation)
- Experienced with local LLM inference (Ollama)
- Comfortable with cloud deployment (Vercel, Railway)
- Project-first learner

---

## HOW TO USE THIS DOCUMENT

### For AI Assistants:
1. **Context setting:** Read entire document first
2. **Code requests:** Ask for specific files/modules (e.g., "Write crop_recommender.py")
3. **Architecture:** Reference the Phase-wise breakdown
4. **Validation:** Check outputs against expected formats above

### For Shwet:
1. **Before each task:** Paste this doc + specific question (e.g., "Write mock_generator.py for monsoon season")
2. **Code review:** Ask AI to check against Phase checklist
3. **Integration:** When wrapping in FastAPI, reference API endpoints section
4. **Deployment:** Share this with DevOps/Railway setup if needed

---

## KEY FILENAMES (for reference)

When asking for help, use these names:
- `krishidhan_iot/data/mock_generator.py` → Synthetic sensor data
- `krishidhan_iot/data/preprocessing.py` → Validation + normalization
- `krishidhan_iot/models/crop_recommender.py` → RF inference
- `krishidhan_iot/models/soil_health_scorer.py` → Scoring logic
- `krishidhan_iot/models/fertilizer_engine.py` → ICAR + RF
- `krishidhan_iot/models/irrigation_advisor.py` → Threshold + trend
- `krishidhan_iot/models/weather_alerts.py` → Risk detection
- `krishidhan_iot/pipeline/sensor_ingestion.py` → Ingest + validate
- `krishidhan_iot/pipeline/batch_processor.py` → Aggregation
- `krishidhan_iot/pipeline/advisory_synthesizer.py` → Combine models
- `krishidhan_iot/api/main.py` → FastAPI app

---

## LONG-TERM CONTEXT

**Shwet's goals:**
- Build 100M-parameter GPT from scratch (Karpathy Zero to Hero curriculum)
- Paid remote contract with US AI startup
- Funded MS abroad (MBZUAI primary target, Germany backup)
- Research output via Krishidhan + cold-email professor outreach

**This project's role:**
- Research contribution (RGSTC-funded)
- Production-grade full-stack (hardware → ML → API → UI → mobile)
- Demonstrates end-to-end system design (not just ML)
- Supervisor LOR + publications potential

---

**End of briefing. Ready to build!**