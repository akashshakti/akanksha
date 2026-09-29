# Akanksha Verma — Fine Arts Portfolio V2

Premium digital-gallery portfolio with **Google Drive as the artwork CMS**. This version does **not** use a Google Drive API key in the website.

## Features
- Live Google Drive artwork gallery through Google Apps Script
- Recursive folder scanning
- Folder names become categories
- Search + category filters
- Masonry art wall
- Fullscreen lightbox, next/previous, keyboard navigation
- Original artwork link
- Dark/light theme
- Responsive mobile gallery
- Artist profile, milestones, exhibitions and contact sections
- 5-minute server/cache refresh strategy

## Run locally
```bash
npm install
cp .env.example .env.local
# Put your deployed Apps Script /exec URL into NEXT_PUBLIC_GALLERY_API
npm run dev
```

## Google Drive integration
See `google-apps-script/README.md` and copy `Code.gs` into a Google Apps Script project. Deploy it as a Web App running as you, accessible to anyone. No Google Drive API key is required.

## Drive structure
Recommended:
```text
Akanksha Verma Portfolio/
  Paintings/
  Sketches/
  Portraits/
  Watercolor/
  Digital Art/
  Exhibitions/
```
Subfolder names automatically become gallery categories.
