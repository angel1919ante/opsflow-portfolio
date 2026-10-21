# OpsFlow portfolio

An English-language portfolio and a functional CRM workflow demo for US agencies, SaaS teams, and service businesses. The public site contains mock data only and keeps source-client names and operational data out of the repository.

## Run locally

```bash
npm ci
npm start
```

Open `http://127.0.0.1:4173`. The demo is at `/demo/`.

## Verification

```bash
npm test
npm run capture
npm run video
```

The browser test exercises the public workflow from lead creation through qualification, deal conversion, and follow-up task creation. It also checks responsive overflow, page errors, media availability, and common secret formats.

## Delivery boundary

This repository proves a responsive prototype workflow. It does not claim a production backend, customer data migration, third-party integrations, or production deployment. The fixed pilot scope is documented on the public site.

Private compliance and outreach materials live outside the public Git history in the local `sales/` workspace.
