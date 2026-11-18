# Add a portfolio project

1. Create a folder under `WorkPages`, such as `WorkPages/Apollo`. Put the photos directly inside it. JPG, PNG, WebP, GIF and AVIF are supported.
2. Copy [Apollo’s project.txt](WorkPages/Apollo/project.txt) into the new folder. Update the four lines at the top, leave a blank line, then write the description. The cover filename must match the uploaded file exactly. Use Professional, Concepts, Photography, Newcastle University or Weston University for the category.
3. Number the photos in gallery order, for example `01-front.jpg`, `02-detail.jpg`. The cover field chooses the homepage photo independently of gallery order.
4. Upload the whole folder to `WorkPages` on GitHub and commit to `main`. GitHub Pages builds the homepage tile, Work card and project gallery automatically. For a local preview, run `node tools/build-projects.mjs` from the repository root before starting the preview server.