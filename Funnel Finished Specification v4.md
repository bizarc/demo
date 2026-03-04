# **Funnel Finished: Platform Feature & UX Specification v4.0**

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
* **RECON Integration:**  
  * RADAR reads RECON intelligence for personalization.
  * RADAR writes net-new prospect research and campaign signals back to RECON.

### **Phase 1.5: RECON (Shared Intelligence)**

*The shared intelligence module used across Funnel Finished.*

* **Ownership Scope:**  
  * Platform-global internal intelligence assets shared across RADAR, THE LAB, and BLUEPRINT.
  * Workspaces are reserved for BLUEPRINT client deployments and Client Portal tenant isolation.
* **Research Store:**  
  * Company profiles, market notes, tech-stack observations, and campaign-relevant context.
* **Knowledge Base Store:**  
  * Reusable document collections (catalogs, FAQs, service menus, review templates) with retrieval-ready indexing.
* **Lifecycle & Governance:**  
  * Assets move through draft -> validated -> production-approved states.
  * Access is RBAC-controlled by internal role (super_admin, operator).

### **Phase 1.6: Skill Runtime (RECON-Centered)**

*The execution and governance layer for reusable AI capabilities.*

* **Core Principle:**  
  * Each research, knowledge, and communication behavior is modeled as a versioned **skill**.
  * Skills can run in three modes: **assist**, **human-in-the-loop**, and **autonomous**.
* **Skill Families:**  
  * **Research:** company, industry, function/technology intelligence.
  * **Knowledge Base:** strategy/design, ingestion/normalization, quality/governance, optimization.
  * **Professional Communication:** prospecting email, LinkedIn messaging, customer service, customer success, marketing/sales copy.
* **Governance Contract:**  
  * Autonomous outputs default to draft state unless policy allows promotion.
  * Promotion to production-approved requires role-appropriate operator approval and audit trail.

### **Phase 1.7: Skill Coverage Matrix (Target State)**

* **Internal System Coverage:**  
  * RECON: intelligence generation, curation, and approval lifecycle.
  * RADAR: prospecting and campaign communication skills.
  * THE LAB: demo-prep enrichment and context quality skills.
  * BLUEPRINT: approved-skill consumption for production deployment.
* **Client Solution Coverage:**  
  * Customer Service skills (support quality, troubleshooting, escalation)
  * Customer Success skills (onboarding, adoption, retention)
  * Marketing skills (campaign framing, persona messaging, offer strategy)
  * Sales skills (prospecting, objection handling, conversion workflows)

### **Phase 2: THE LAB (Sales & Demos)**

*The environment for closing the deal.*

* **Asset Injection:**  
  * Upload Prospect Logo & Color Hex Codes.  
  * Scrape Prospect Website for context.  
  * Read/enrich RECON intelligence (research + knowledge assets).  
* **The "Magic Link":**  
  * Generates a unique, expiring URL (e.g., demo.funnelfinished.com/v/client-id).  
  * **Experience:** The prospect chats with the agent in a simulated environment (SMS/WhatsApp style).  
  * **Voice Capability:** "Call Me Now" button on the demo page triggers an immediate AI voice call to the prospect.

### **Phase 3: BLUEPRINT (Configuration)**

*The bridge from Sale to Production.*

* **Mission Profiles:**  
  * Select the "Job to be Done" to load pre-set logic templates.  
  * *Options:* Database Reactivation, Inbound Nurture, Customer Service, Review Generation.  
* **RECON Consumption:**  
  * BLUEPRINT selects production-approved RECON knowledge assets as deployment inputs.
  * Research context from RECON can be referenced for copy, qualification, and workflow tuning.
* **The Vault:**  
  * Secure storage for Client API Keys (Twilio SID, CRM Keys, SendGrid).  
  * *Note:* Clients never see this; your team inputs this during onboarding.  
* **Logic Mapping:**  
  * Define "Triggers" (e.g., Lead fills Form B) and "Actions" (e.g., Wait 2 mins -> Send SMS).

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
  * **Visual Funnel:** Sent -> Delivered -> Replied -> Appt Booked -> Revenue.  
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
* **Skill Runtime Requirements:**  
  * Skill catalog with versioned schemas (`input_schema`, `output_schema`) and quality gates.
  * Execution-mode policy engine (`assist`, `human-in-the-loop`, `autonomous`) enforced by role.
  * Skill run audit logs with approvals, evidence, and lifecycle transition history.
  * Module contracts where RECON is source of truth and downstream modules consume linked assets.

## **5\. Quality, Testing, and Documentation Requirements**

* **Comprehensive Testing:**  
  * Unit tests for schema validation, parser resilience, and policy checks.
  * Integration tests for research/KB/outreach API contracts and lifecycle transitions.
  * End-to-end tests for RECON, RADAR, LAB, and BLUEPRINT operator workflows.
  * Reliability/performance tests for provider failures, fallback behavior, and execution latency.
* **Quality Gates:**  
  * Autonomous mode enablement is gated per skill family by explicit quality thresholds.
  * Research outputs, retrieval quality, and outreach compliance require recurring regression evaluation.
* **Documentation Standards:**  
  * Architecture documentation for skill catalog/runtime and module contracts.
  * API documentation for skill execution endpoints and schema versioning.
  * Operator playbooks for assist/HITL/autonomous workflows and approvals.
  * Authoring guides for skill packs (research, KB, communication).
  * Rollout runbooks for migration, feature flags, monitoring, and incident handling.

## **6\. User Flows**

**The "Push to Production" Flow:**

1. **Prospecting:** Ops team identifies lead in **RADAR**, leveraging RECON context.  
2. **Intelligence:** Ops team enriches RECON research/knowledge as needed.  
3. **Sales:** Ops team builds demo in **LAB**, consuming RECON assets and adding missing context when needed. Client says "Yes."  
4. **Config:** Ops team configures deployment in **BLUEPRINT** using production-approved RECON knowledge assets.  
5. **Ingest:** Ops team uploads client's CSV into **DATA AIRLOCK**.  
6. **Launch:** Ops team hits "Start Pilot" in **MISSION CONTROL**.  
7. **Reporting:** Client logs into **PORTAL** to see appointments appearing.

**The "Skill-Driven Delivery" Flow:**

1. **Select Skill + Mode:** Operator picks skill family (`research`, `knowledge_base`, `communication`) and run mode (`assist`, `HITL`, `autonomous`).  
2. **Generate Draft Output:** Skill runtime executes with RECON context and produces structured output with evidence.  
3. **Review and Approve:** Operator validates output quality, edits if needed, and promotes lifecycle state.  
4. **Operational Use:** RADAR/THE LAB/BLUEPRINT consume approved skill outputs through RECON links.  
5. **Measure and Improve:** Test/evaluation telemetry feeds back into skill versioning and governance decisions.
