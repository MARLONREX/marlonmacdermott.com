# MacDermott Designs — GitHub-ready website

## Publish
1. Extract the ZIP. Open the MacDermott-Designs-GitHub-Ready folder.
2. Add this folder's CONTENTS to a GitHub repository. index.html must be at the repository root, not nested inside another website folder. Upload the extracted files, not the ZIP itself.
3. Use GitHub Desktop or Git to commit and push the folder: some images are larger than the browser uploader's limit.
4. In repository Settings > Pages, select Deploy from a branch, then main and /(root), and Save.
5. GitHub will show the published address in Pages settings after deployment.

No installation or build is needed. This is a static HTML/CSS/JavaScript website. Keep .nojekyll in the repository root.

Official instructions: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site

## Custom domain
CNAME.example preserves the earlier dermottdesign.com setting without enabling it automatically. Only rename it to CNAME after configuring the intended domain in GitHub Pages and its DNS.

## Files and future editing
WorkPages contains your project images, text and documents. Original filenames and the folder system are preserved. Homepage order is saved in gallery-order.json. Project labels and dates are in project-metadata.json. Dormant projects remain saved but are absent from the homepage.

Add images to each project's folder, then ask to update the website: the static HTML must be refreshed before publishing. Files do not automatically appear just because they were added to GitHub. Existing tools are included as working utilities; do not run the old import-web script blindly because it can replace curated layouts and categories.

The original working website remains in Documents/Codex/MacDermott Designs/McDermott-Designs-main. This package is a snapshot for GitHub, not a live synchronised copy.

## Verification
Current homepage and work-page href/src links were checked against files on disk. Browser-based visual verification was unavailable. Older archived redesigns and legacy pages are retained for completeness and may contain pre-existing obsolete links. They are not used by the current homepage.

The website has not been uploaded or published by this preparation task.
