# Google Cloud Run & GitHub Actions CI/CD Setup Guide

This guide walks through configuring Google Cloud Secret Manager and GitHub Actions to automatically deploy the **Personal Gemini Journal** to Google Cloud Run.

---

## 1. Quick Fix: Create the Missing Secret in Secret Manager

The deployment failed because Cloud Run expects a secret named **`GEMINI_API_KEY`** in your project (`943155960296`). Run these three commands in your **Google Cloud Shell** or terminal:

```bash
# 1. Enable Secret Manager (if not already enabled)
gcloud services enable secretmanager.googleapis.com --project=943155960296

# 2. Create the GEMINI_API_KEY secret
gcloud secrets create GEMINI_API_KEY \
  --replication-policy="automatic" \
  --project=943155960296

# 3. Add your actual Gemini API Key version
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY \
  --data-file=- \
  --project=943155960296

# 4. Grant Cloud Run's Service Account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:943155960296-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" \
  --project=943155960296
```

Once executed, re-run your Cloud Run deployment and it will succeed!

---

## 2. Alternative Quick Test: Deploy with Environment Variable (Bypassing Secret Manager)

If you prefer to deploy immediately without setting up Secret Manager first, deploy using `--set-env-vars` instead of `--set-secrets`:

```bash
gcloud run deploy personal-gemini-journal \
  --image <YOUR_IMAGE_TAG> \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --port 3000 \
  --set-env-vars GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_API_KEY"
```

---

## 3. Fixing the "Setting IAM Policy" Warning (Public Access)

If your project is part of a Google Workspace or Organization with an unauthenticated invocation restriction, run:

```bash
gcloud beta run services add-iam-policy-binding personal-gemini-journal \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/run.invoker" \
  --project=943155960296
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
