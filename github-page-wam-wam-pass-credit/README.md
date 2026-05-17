# WAM Pathway

A GitHub Pages-ready Australian university WAM calculator. It calculates current WAM from weighted subject marks, then shows the remaining average WAM needed to reach PASS, CREDIT, DISTINCTION, and HIGH DISTINCTION.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The deployable static output is created in `dist/`.

## GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`. After pushing to GitHub, enable Pages with **Source: GitHub Actions** in the repository settings.

## Notes

WAM policies vary between universities. This app uses a standard weighted-average calculation and common Australian grade-band targets. Always check your university handbook for official rules.
