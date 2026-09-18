export const getMediaUrl = (path) => {
  if (!path || typeof path !== 'string') return '';
  if (
    path.startsWith('data:') ||
    path.startsWith('blob:') ||
    path.startsWith('http://') ||
    path.startsWith('https://')
  ) {
    return path;
  }
  let cleanPath = path;
  if (!cleanPath.startsWith('/') && !cleanPath.startsWith('uploads/')) {
    cleanPath = `/uploads/documents/${cleanPath}`;
  } else if (!cleanPath.startsWith('/')) {
    cleanPath = `/${cleanPath}`;
  }
  return `http://localhost:5000${cleanPath}`;
};

export const getFileNameOnly = (pathOrName) => {
  if (!pathOrName || typeof pathOrName !== 'string') return '';
  if (pathOrName.startsWith('data:')) return 'Uploaded_Document.pdf';
  const clean = pathOrName.split('?')[0].replace(/\\/g, '/');
  const parts = clean.split('/');
  const filename = parts[parts.length - 1];
  return filename || pathOrName;
};
