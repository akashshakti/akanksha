/**
 * Akanksha Verma Fine Arts Portfolio — Google Drive Gallery Bridge V2
 * No Google Drive API key is required.
 *
 * 1. Put your artwork folders/files in the public Drive folder.
 * 2. Change ROOT_FOLDER_ID below.
 * 3. Deploy: Deploy > New deployment > Web app
 *    Execute as: Me
 *    Who has access: Anyone
 * 4. Put the /exec URL in NEXT_PUBLIC_GALLERY_API.
 */
const ROOT_FOLDER_ID = '1yck4Rw2h9GsD_QoPVXT5OvpiiACBQa7u';
const CACHE_SECONDS = 300;
const IMAGE_TYPES = ['image/jpeg','image/png','image/webp','image/gif','image/bmp','image/tiff'];

function doGet() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get('gallery-v2');
  if (cached) return json(JSON.parse(cached));

  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const artworks = [];
  walkFolder(root, '', 'All', artworks);

  artworks.sort((a,b) => b.modified.localeCompare(a.modified));
  const categories = [...new Set(artworks.map(x => x.category))].sort((a,b) => a.localeCompare(b));
  const payload = {
    artist: 'Akanksha Verma',
    source: 'Google Drive',
    updatedAt: new Date().toISOString(),
    categories,
    artworks
  };
  cache.put('gallery-v2', JSON.stringify(payload), CACHE_SECONDS);
  return json(payload);
}

function walkFolder(folder, category, parentCategory, artworks) {
  const currentCategory = category || folder.getName() === 'Akanksha Verma Portfolio' ? (category || parentCategory) : folder.getName();
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    if (!IMAGE_TYPES.includes(file.getMimeType())) continue;
    const name = file.getName().replace(/\.[^.]+$/, '');
    const yearMatch = name.match(/(?:19|20)\d{2}/);
    artworks.push({
      id: file.getId(),
      name,
      title: cleanTitle(name),
      category: currentCategory || 'Featured',
      year: yearMatch ? yearMatch[0] : '',
      mimeType: file.getMimeType(),
      modified: file.getLastUpdated().toISOString(),
      image: 'https://drive.google.com/thumbnail?id=' + encodeURIComponent(file.getId()) + '&sz=w2000',
      original: 'https://drive.google.com/uc?export=view&id=' + encodeURIComponent(file.getId())
    });
  }
  const folders = folder.getFolders();
  while (folders.hasNext()) {
    const child = folders.next();
    const childCategory = child.getName();
    walkFolder(child, childCategory, currentCategory || parentCategory, artworks);
  }
}

function cleanTitle(name) {
  return name.replace(/[_-]+/g, ' ').replace(/\b(?:19|20)\d{2}\b/g, '').replace(/\s+/g, ' ').trim() || 'Untitled Artwork';
}

function json(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
