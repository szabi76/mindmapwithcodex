# MindMap Explorer

This repository implements the MindMap Explorer MVP outlined in `mindmap-explorer-spec.md`, including a React frontend, serverless backend handlers, Terraform infrastructure for the AWS Free Tier, and GitHub Actions automation.

## Project Structure
- `backend/` — TypeScript Lambda handlers for exploration APIs (start, expand, explain, list, state, delete).
- `frontend/` — React + Vite + Tailwind client that mirrors the UX specified in the product brief.
- `infra/` — Terraform for DynamoDB, Lambda, and API Gateway (HTTP API) wiring.
- `.github/workflows/` — CI and deployment automation.

## Getting Started
### Backend
```bash
cd backend
npm install
npm run lint
npm run build
```
Build artifacts land in `backend/dist` and are zipped by Terraform.

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Set `VITE_API_URL` to the API Gateway base URL to connect to live endpoints; otherwise, the UI falls back to mock data.

### Infrastructure
Terraform uses local Lambda bundles from `backend/dist`. Build the backend before planning or applying:
```bash
cd backend && npm install && npm run build
cd ../infra
terraform init
terraform plan -out=tfplan
terraform apply tfplan
```
You can override the default demo tokens using `TF_VAR_auth_token_owner` and `TF_VAR_auth_token_friends`.

For Bedrock integration (Claude Sonnet) set Lambda env vars via Terraform:
- `BEDROCK_REGION` (e.g., `eu-north-1`)
- `BEDROCK_MODEL_ID` (e.g., `anthropic.claude-3-5-sonnet-20241022-v2:0`)

### GitHub Actions
- `ci.yml` runs backend linting and frontend builds on pushes/PRs.
- `deploy.yml` can be triggered manually (`workflow_dispatch`) to plan/apply Terraform after building the backend. It expects AWS credentials via `AWS_ROLE_ARN`, `AUTH_TOKEN_OWNER`, and `AUTH_TOKEN_FRIENDS` secrets.
