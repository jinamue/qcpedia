function normalizeBasePath(basePath) {
  const trimmedBasePath = basePath?.trim();

  if (!trimmedBasePath || trimmedBasePath === '/') {
    return '/';
  }

  const withLeadingSlash = trimmedBasePath.startsWith('/')
    ? trimmedBasePath
    : `/${trimmedBasePath}`;

  return withLeadingSlash.endsWith('/') ? withLeadingSlash : `${withLeadingSlash}/`;
}

export const APP_BASE_PATH = normalizeBasePath(import.meta.env.VITE_APP_BASE_PATH);
