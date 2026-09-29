# Google Apps Script setup — no API key

1. Open `script.google.com` and create a new project.
2. Replace the default code with `Code.gs`.
3. Confirm `ROOT_FOLDER_ID` is your public artwork folder ID.
4. Deploy → New deployment → Web app.
5. Execute as: **Me**.
6. Who has access: **Anyone**.
7. Copy the `/exec` URL.
8. In the Next.js project create `.env.local`:

`NEXT_PUBLIC_GALLERY_API=YOUR_EXEC_URL`

9. Run `npm install` and `npm run dev`.

### Drive permissions
The artwork files must be viewable by the public audience of the portfolio. Recommended: share the artwork folder/files as **Anyone with the link → Viewer**.

### Categories
Use subfolders under the root folder. Example:

- Paintings
- Sketches
- Portraits
- Watercolor
- Digital Art
- Exhibitions

The subfolder name automatically becomes the website category. You can also nest folders; images inherit the nearest folder category.

### Updating the gallery
Upload/organize images in Drive. The Apps Script cache lasts 5 minutes. To force a refresh, redeploy or temporarily set `CACHE_SECONDS = 0`.
