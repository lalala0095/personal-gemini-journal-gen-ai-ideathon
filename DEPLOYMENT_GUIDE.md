# Google Cloud Run & GitHub Actions CI/CD Setup Guide

This guide walks through configuring Google Cloud Secret Manager and GitHub Actions to automatically deploy the **Personal Gemini Journal** to Google Cloud Run.

---

## 1. Store the Gemini API Key in Google Cloud Secret Manager

Run these commands in your Google Cloud Shell or local `gcloud` CLI:

```bash
# 1. Enable required Google Cloud services
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com

# 2. Create the Secret in Secret Manager
gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic"

# 3. Add your Gemini API key value
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | \
  gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 4. Create Artifact Registry repository for container images
gcloud artifacts repositories create journal-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="Personal Gemini Journal Docker repository"
```

---

## 2. Grant Cloud Run Access to the Secret

Allow the Cloud Run default compute service account to read the secret:

```bash
# Get your Google Cloud Project Number
PROJECT_NUM=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")

# Grant Secret Accessor role
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUM}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 3. Configure GitHub Repository Secrets

In your GitHub repository, navigate to **Settings > Secrets and variables > Actions** and add:

| Secret Name | Description | Example Value |
| :--- | :--- | :--- |
| `GCP_PROJECT_ID` | Your Google Cloud project ID | `my-secure-journal-prod` |
| `GCP_REGION` | Cloud Run and Artifact Registry region | `us-central1` |
| `GCP_SA_KEY` | Base64-encoded JSON or raw JSON key of a service account with Cloud Run Admin & Artifact Registry Writer roles | `{"type": "service_account", ...}` |

*(Optional Recommended Alternative)*: Instead of `GCP_SA_KEY`, you can use **Workload Identity Federation**:
- Set `GCP_WORKLOAD_IDENTITY_PROVIDER`
- Set `GCP_SERVICE_ACCOUNT`

---

## 4. Automatic CI/CD Execution

Whenever you push to the `main` branch, the GitHub Action (`.github/workflows/deploy.yml`) will:
1. Run strict TypeScript linting and build checks
2. Authenticate to Google Cloud
3. Build the hardened container using `Dockerfile`
4. Push to Artifact Registry
5. Deploy to Google Cloud Run with runtime injection of `GEMINI_API_KEY` from Secret Manager
