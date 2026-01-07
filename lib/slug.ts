export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80)
    .replace(/-$/g, '');
}

export function uniqueSlug(base: string, suffix: string) {
  const cleanBase = slugify(base) || 'post';
  return `${cleanBase}-${suffix}`;
}
