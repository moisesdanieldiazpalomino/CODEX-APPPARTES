export function normalizeLegacyTimestamp(value) {
  if (!value) return null;
  if (/Z$|[+-]\d\d:\d\d$/.test(value)) return value;
  if (value.includes("T")) return `${value}-05:00`;
  return `${value.replace(" ", "T")}Z`;
}

export function bucketForObjectKey(key) {
  return key.startsWith("documents/") ? "partes-documentos" : "partes-imagenes";
}
