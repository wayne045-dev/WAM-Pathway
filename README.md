# WAM Pathway

A GitHub Pages-ready Australian university WAM calculator. It calculates current WAM from weighted subject marks, then shows the remaining average WAM needed to reach PASS, CREDIT, DISTINCTION, and HIGH DISTINCTION.

## Deploy from a branch

This project can be deployed without GitHub Actions or any build step.

1. Upload this repository to GitHub.
2. Open the repository on GitHub.
3. Go to **Settings** -> **Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select:
   - Branch: `main`
   - Folder: `/docs`
6. Click **Save**.

GitHub Pages will publish the static site from `docs/index.html`.

If `/docs` still fails, select `/(root)` instead. The root `index.html` redirects to the same static calculator.

## Local preview

Open `docs/index.html` directly in your browser.

## Notes

WAM policies vary between universities. This app uses a standard weighted-average calculation and common Australian grade-band targets. Always check your university handbook for official rules.
