# **Funnel Finished: Platform Feature & UX Specification v3.0**

**Architecture Model:** Service Bureau / Tech-Enabled Service

**Design System:** "Command Deck" (Internal) vs. "Scoreboard" (Client)

## **1\. Executive Summary**

**Funnel Finished** is not a DIY SaaS; it is a delivery vehicle for high-end AI marketing services. The platform is bifurcated into two distinct environments:

1. **Internal Ops (The Command Deck):** A high-density, "Palantir-style" environment for your team to prospect, build demos, and manage live agent infrastructure.  
2. **Client Portal (The Scoreboard):** A streamlined, white-label dashboard for clients to view performance metrics, ROI, and conversation logs.

## **2\. User Roles & Permissions**

* **Super Admin (Internal):** Full access to RADAR, LAB, and MISSION CONTROL. Can see all client workspaces.  
* **Operator (Internal):** Access to manage specific client campaigns and handle "Human in the Loop" interventions.  
* **Client Viewer (External):** Read-only access to the Client Portal. Can view metrics and billing, but cannot alter agent configuration.

## **3\. Module Breakdown**

### **Phase 1: RADAR (Internal Prospecting)**

*The engine for finding your own customers.*

* **Target Acquisition:** Integration with Google Maps/Places API and LinkedIn Scrapers.  
  * *Input:* "Roofers in Austin, TX"  
  * *Output:* List of targets with phone, email, and "Current Tech Stack" analysis.  
* **Campaign Manager:**  
  * **Cold Outreach:** Orchestrate email sequences and LinkedIn connection requests.  
  * **Signal Detection:** Highlight prospects who replied or visited the demo link.

### **Phase 2: THE LAB (Sales & Demos)**

*The environment for closing the deal.*

* **Asset Injection:**  
  * Upload Prospect Logo & Color Hex Codes.  
  * Scrape Prospect Website for context.  
* **The "Magic Link":**  
  * Generates a unique, expiring URL (e.g., demo.funnelfinished.com/v/client-id).  
  * **Experience:** The prospect chats with the agent in a simulated environment (SMS/WhatsApp style).  
  * **Voice Capability:** "Call Me Now" button on the demo page triggers an immediate AI voice call to the prospect.

### **Phase 3: BLUEPRINT (Configuration)**

*The bridge from Sale to Production.*

* **Mission Profiles:**  
  * Select the "Job to be Done" to load pre-set logic templates.  
  * *Options:* Database Reactivation, Inbound Nurture, Customer Service, Review Generation.  
* **The Vault:**  
  * Secure storage for Client API Keys (Twilio SID, CRM Keys, SendGrid).  
  * *Note:* Clients never see this; your team inputs this during onboarding.  
* **Logic Mapping:**  
  * Define "Triggers" (e.g., Lead fills Form B) and "Actions" (e.g., Wait 2 mins \-\> Send SMS).

### **Phase 4: MISSION CONTROL (Live Operations)**

*The daily operating environment.*

* **Data Airlock (Ingestion):**  
  * **Drag-and-Drop:** Upload CSVs of old leads.  
  * **Scrubbing:** Automated validation (Mobile number formatting, DNC list checking).  
  * **Commit:** "Push to Production" button after validation.  
* **Pilot Execution:**  
  * **Batching:** Logic to drip-feed leads (e.g., "50 leads per hour").  
  * **Kill Switch:** Global "Stop All Agents" button for emergencies.

### **Phase 5: CLIENT PORTAL (External)**

*The retention tool.*

* **Dashboard:**  
  * **Visual Funnel:** Sent \-\> Delivered \-\> Replied \-\> Appt Booked \-\> Revenue.  
  * **ROI Calculator:** "Cost per Lead" vs "Revenue Generated".  
* **Activity Feed:** Anonymized or full log of successful interactions.  
* **Billing:** View current usage (SMS segments, AI tokens) and upcoming invoices.

## **4\. Technical Requirements**

* **Frontend:** React, Tailwind CSS, Lucide React Icons.  
* **State Management:** Differentiate clearly between Demo\_Mode (mock data) and Live\_Mode (real API calls).  
* **Security:**  
  * **RBAC:** Strict separation of Client Data.  
  * **Encryption:** API Keys in "The Vault" must be encrypted at rest.  
* **Integrations (Backend):**  
  * Twilio (SMS/Voice).  
  * OpenRouter (LLM Logic).  
  * Stripe (Billing).  
  * Common CRMs (HubSpot, GHL, Salesforce) via Webhooks.

## **5\. User Flows**

**The "Push to Production" Flow:**

1. **Prospecting:** Ops team identifies lead in **RADAR**.  
2. **Sales:** Ops team builds demo in **LAB**. Client says "Yes."  
3. **Config:** Ops team selects "Database Reactivation" profile in **BLUEPRINT**.  
4. **Ingest:** Ops team uploads client's CSV into **DATA AIRLOCK**.  
5. **Launch:** Ops team hits "Start Pilot" in **MISSION CONTROL**.  
6. **Reporting:** Client logs into **PORTAL** to see appointments appearing.