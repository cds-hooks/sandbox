// DSTU2 allows family to be an array; R4 servers may also return names with no given or family parts
export default function formatPatientName(names) {
  const name = Array.isArray(names) ? names[0] : null;
  if (!name) {
    return 'Unknown';
  }
  const family = Array.isArray(name.family) ? name.family.join(' ') : name.family;
  const fullName = [...(name.given || []), family].filter(Boolean).join(' ');
  return fullName || name.text || 'Unknown';
}
