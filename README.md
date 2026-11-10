# DNSC Service Quality Audit (TQM Platform)

Total Quality Management (TQM) audit application built for **Davao del Norte State College (DNSC)** in Panabo City, Davao del Norte. The application facilitates Voice of the Customer (VOC) employee interviews via an AI "Audit Guide", benchmarks response times against DNSC institutional service standards, generates Critical-to-Quality (CTQ) Trees, and equips college administrators with a real-time institutional CTQ Scorecard and consolidated accreditation reports.

---

## 1. System Architecture & Threat Modeling

- **Zero Insecure Defaults**: Database reads and writes are user-isolated via strict Attribute-Based Access Control (ABAC). The client browser directly writes only the signed-in user's profile, audits, and messages.
- **Stateless Admin Server**: The backend Express service writes nothing to Firestore; it validates Firebase ID tokens via the Firebase Admin SDK and reads via the Firestore REST API using the caller's verified bearer token.
- **Resilient Model Fallback Ladder**: Automated multi-tier fallback protocol across `gemini-3.6-flash` → `gemini-3.1-flash-lite` → `gemini-flash-latest` → `gemini-3.7-flash` with circuit breaker recovery.
- **Untrusted Input Wrapping**: All prompt inputs (profile fields, uploaded standards, chat messages) are delimited in explicit tags `<profile>`, `<standards>`, `<transcript>` with instruction-ignoring directives.

---

## 2. Environment & Prerequisites

Ensure the following Google Cloud and Firebase CLI tools are installed:

```bash
# Verify Google Cloud SDK installation
gcloud version

# Verify Firebase CLI installation
firebase --version

# Enable necessary Google Cloud APIs
gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com
```

---

## 3. Secret Management Setup (Google Cloud Secret Manager)

In compliance with Directive 4 (Zero-Hardcoding Hygiene), operational credentials and API keys are stored in Secret Manager:

```bash
# 1. Create and populate the Gemini API key secret
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"
echo -n "YOUR_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 2. Grant the default Cloud Run service account access to read the secret
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Database Security Configuration (Cloud Firestore)

Deploy the user-isolated Firestore Security Rules (`firestore.rules`):

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Global denial default
    match /{document=**} {
      allow read, write: if false;
    }

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && exists(/databases/$(database)/documents/admins/$(request.auth.uid));
    }

    match /admins/{uid} {
      allow get: if isSignedIn() && request.auth.uid == uid;
      allow list, write: if false;
    }

    match /users/{userId} {
      allow read: if isOwner(userId) || isAdmin();
      allow write: if isOwner(userId);

      match /audits/{auditId} {
        allow read: if isOwner(userId) || isAdmin();
        allow write: if isOwner(userId);
      }

      match /interactions/{interactionId} {
        allow read: if isOwner(userId) || isAdmin();
        allow write: if isOwner(userId);
      }
    }

    match /{path=**}/audits/{auditId} {
      allow read: if isAdmin();
    }

    match /{path=**}/interactions/{interactionId} {
      allow read: if isAdmin();
    }

    match /settings/serviceStandards {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /scorecardReports/{reportId} {
      allow read, write: if isAdmin();
    }
  }
}
```

Deploy the rules to your named Firestore database:

```bash
firebase deploy --only firestore:rules
```

---

## 5. Super Administrator Provisioning

The application designates one super administrator based on the `ADMIN_EMAIL` environment variable.
To complete super admin setup:

1. Sign in to the application with Google using the configured admin email.
2. Open the **Profile** tab to view your exact Firebase Auth UID.
3. In the Firebase Console, navigate to Cloud Firestore and manually create the administrator document:
   - **Collection:** `admins`
   - **Document ID:** `<YOUR_FIREBASE_AUTH_UID>`
   - **Field:** `role` (string) = `"superadmin"`
4. Refresh the application to unlock Standards, Scorecard, and Reports tabs.

---

## 6. Google Cloud Run Deployment Flow

Build and deploy the full-stack container to Cloud Run:

```bash
# 1. Build the production bundle
npm run build

# 2. Deploy to Cloud Run with Secret Manager environment injection
gcloud run deploy dnsc-service-audit \
  --source . \
  --region asia-southeast1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="NODE_ENV=production,ADMIN_EMAIL=yellalonzaga@gmail.com,FORCE_MODEL_FAILURE=false" \
  --set-secrets="GEMINI_API_KEY=GEMINI_API_KEY:latest"
```

---

## 7. Required Campaign Verification Binding

Apply the mandatory resource label to register the Cloud Run deployment for challenge verification:

```bash
gcloud run services update dnsc-service-audit \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=asia-southeast1
```
