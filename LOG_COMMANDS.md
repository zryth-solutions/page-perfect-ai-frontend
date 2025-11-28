# Cloud Functions Log Commands

## Quick Log Commands

### View Latest Logs (Simple)
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=50 \
  --format="value(textPayload)" \
  --project=pageperfectai
```

### View Logs with Timestamps
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=30 \
  --format="table(timestamp,textPayload)" \
  --project=pageperfectai
```

### View Only Errors
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf AND severity>=ERROR" \
  --limit=20 \
  --format="value(textPayload)" \
  --project=pageperfectai
```

### Search for Specific Text
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=50 \
  --format="value(textPayload)" \
  --project=pageperfectai | grep -i "error\|failed\|success"
```

### View Last 100 Lines
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=100 \
  --format="value(textPayload)" \
  --project=pageperfectai | tail -100
```

### Real-time Logs (Stream)
```bash
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --project=pageperfectai
```

## All Cloud Functions Logs

### View All Functions
```bash
gcloud logging read "resource.type=cloud_function" \
  --limit=50 \
  --project=pageperfectai
```

### Specific Function by Name
Replace `FUNCTION_NAME` with: extractPDF, splitContent, updateSplitFile, deleteImage, lockBook, unlockBook

```bash
gcloud logging read "resource.labels.function_name=FUNCTION_NAME" \
  --limit=30 \
  --project=pageperfectai
```

## Firebase CLI Commands

### View Function Logs (Deprecated but still works)
```bash
firebase functions:log --only extractPDF
```

### View All Functions Logs
```bash
firebase functions:log
```

## Advanced Filtering

### Logs from Last Hour
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf AND timestamp>=\"$(date -u -d '1 hour ago' '+%Y-%m-%dT%H:%M:%SZ')\"" \
  --project=pageperfectai
```

### Logs with Specific Error Message
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf AND textPayload:\"utf-8\"" \
  --limit=20 \
  --project=pageperfectai
```

### JSON Format (for parsing)
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=10 \
  --format=json \
  --project=pageperfectai
```

## Useful Grep Patterns

### Find Errors with Context
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=100 \
  --format="value(textPayload)" \
  --project=pageperfectai | grep -A 5 -B 5 "Error\|Exception\|Failed"
```

### Find Successful Operations
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=50 \
  --format="value(textPayload)" \
  --project=pageperfectai | grep -i "success\|completed\|done"
```

### Find Specific Book ID
```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=100 \
  --format="value(textPayload)" \
  --project=pageperfectai | grep "BOOK_ID_HERE"
```

## Web Console

View logs in browser:
https://console.cloud.google.com/logs/query?project=pageperfectai

Filter for extractPDF:
```
resource.type="cloud_run_revision"
resource.labels.service_name="extractpdf"
```

## Troubleshooting

### If "Failed to list log entries"
```bash
# Re-authenticate
gcloud auth login

# Set project
gcloud config set project pageperfectai
```

### If logs are delayed
Logs can take 1-2 minutes to appear. Use `--limit` to get more recent entries.

### If no logs appear
Check if the function was actually called:
```bash
gcloud logging read "resource.labels.function_name=extractPDF" \
  --limit=5 \
  --project=pageperfectai
```

## Save Logs to File

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" \
  --limit=500 \
  --format="value(textPayload)" \
  --project=pageperfectai > extraction_logs.txt
```

## Quick Aliases (Add to ~/.bashrc)

```bash
# Add these to your ~/.bashrc for quick access
alias logs-extract='gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --limit=50 --format="value(textPayload)" --project=pageperfectai'

alias logs-extract-errors='gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf AND severity>=ERROR" --limit=20 --format="value(textPayload)" --project=pageperfectai'

alias logs-extract-tail='gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=extractpdf" --project=pageperfectai'
```

Then use:
```bash
logs-extract
logs-extract-errors
logs-extract-tail
```

