# 🛰️ Rescue Sync: Indian Tactical Emergency Response System


## 📌 Project Overview
**Rescue Sync** is a mission-critical, high-precision emergency response platform specifically engineered for the Indian subcontinent. By integrating **NavIC (IRNSS)**—India's indigenous satellite navigation system—Rescue Sync provides unparalleled geospatial accuracy for disaster management, search and rescue (SAR) operations, and rapid civilian aid.

The platform bridges the gap between distressed civilians, first responders, and central command using a real-time, AI-augmented tactical dashboard.

---

## 🇮🇳 NavIC (IRNSS) Integration
Rescue Sync is built to leverage India's sovereign positioning capabilities:
- **NavIC Optimized Geolocation**: High-accuracy positioning using the L5 and S bands for superior performance in the Indian region.
- **Indigenous Geospatial Core**: Tactical mapping optimized for Indian coordinates, ensuring zero dependency on external navigation constraints during regional crises.
- **Real-time Status Indicators**: UI badges and status bars that confirm active NavIC Link synchronization for both Admin and Field Personnel.
- **Pure Offline Workflow**: If The Network Fails it still works on Mesh Network System

---

## 🚀 Key Features

### 🏢 Tactical Command Dashboard (Admin)
- **Automatic Dispatch Engine**: Real-time nearest-responder allocation for SOS/Critical missions based on NavIC precision.
- **Field Operation Intelligence**: High-res imagery and geospatial data for every reported incident.
- **Personnel Vetting System**: Comprehensive background and qualification vetting for volunteer onboarding.
- **City-Scale Monitoring**: Live weather feeds and incident heatmaps for urban safety oversight.

### 🛡️ Volunteer Field Ops
- **SOS Mission Center**: Instant mobile alerts for critical incidents with precise turn-by-turn navigation.
- **Rescue Channel**: Real-time, encrypted communication bridge with Central Command.
- **Dynamic Tasking**: Shift from training to active duty with a single tap.

### 🎓 AI-Augmented Academy
- **Smart Training**: AI-generated training modules for First Aid, Fire Safety, and Disaster Response.
- **Assignment Tracking**: Centralized management of volunteer certifications and training progress.

---

## 💻 Tech Stack

### Frontend & UI
- **React 18**: Component-based architecture for mission-critical reliability.
- **TypeScript**: Strict type-safety for error-free tactical logic.
- **Tailwind CSS**: High-contrast, "Bento-style" UI for maximum readability in the field.
- **Leaflet.js**: Lightweight, custom-configured map engine for NavIC geospatial data.

### Backend & Real-time
- **Supabase (PostgreSQL)**: Scalable database with real-time row-level security.
- **WebSockets**: Instantaneous data synchronization for SOS alerts and messaging.
- **Supabase Auth**: Role-based access control (RBAC) for data sovereignty.

### Intelligence & API
- **Gemini 2.0 Flash (via OpenRouter)**: Advanced AI for tactical guidance and automated content generation.
- **Proximity Algorithms**: Custom geospatial calculations for optimized responder dispatch.

---

## 🛠️ Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Kunal-k-24/resue-techathon.git
   cd resue-techathon
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENROUTER_API_KEY=your_openrouter_api_key
   ```

4. **Run the Dashboard**
   ```bash
   npm run dev
   ```

---

## 🛡️ Mission Security
- **Data Sovereignty**: All operational data is stored in encrypted PostgreSQL clusters.
- **NavIC Precision**: Integrated fail-safes for GPS/NavIC switching based on signal reliability.
- **Privacy**: Role-based masking of civilian identities until mission assignment.

---

## 🤝 Contributing
Rescue Sync is built by the community for the community. For major changes, please open an issue first to discuss what you would like to change.

---

**Developed for the Rescue Operations.**
*Empowering India's Responders with Indigenous Innovation.*
