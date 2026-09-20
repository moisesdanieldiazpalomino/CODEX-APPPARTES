export function textValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function requiredText(formData: FormData, key: string, label: string) {
  const value = textValue(formData, key);
  if (!value) throw new Error(`${label} es obligatorio.`);
  return value;
}

export function optionalText(formData: FormData, key: string) {
  return textValue(formData, key) || null;
}

export function selectedValues(formData: FormData, key: string) {
  return formData.getAll(key).filter((value): value is string => typeof value === "string" && value.length > 0);
}
