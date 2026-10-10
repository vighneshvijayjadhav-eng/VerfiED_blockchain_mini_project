import { createHash } from 'node:crypto';

export const institution = 'Pune Institute of Computer Technology (PICT) — DEMO';
export const academicFields = ['fullName', 'rollNumber', 'department', 'degree', 'academicYear', 'grade', 'completionDate', 'institution'];
export class AppError extends Error {
  constructor(message, status = 400, code = 'INVALID_INPUT') { super(message); this.status = status; this.code = code; }
}
export function normalized(value, field, max = 120) {
  if (typeof value !== 'string') throw new AppError(`${field} must be text.`);
  const result = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (!result || result.length > max || /[\u0000-\u001f\u007f]/u.test(result)) throw new AppError(`${field} must contain 1–${max} printable characters.`);
  // Built-in PDF fonts support the demo's Latin academic text.
  if (/[^\u0020-\u00ff\u2013\u2014\u2018\u2019]/u.test(result)) throw new AppError(`${field}: use Latin characters supported by the demo certificate font.`);
  return result;
}
export function validateId(id) {
  if (typeof id !== 'string' || !/^VED-[A-F0-9]{16}$/.test(id)) throw new AppError('Use a credential ID in the format VED- followed by 16 uppercase hexadecimal characters.');
  return id;
}
export function academicData(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AppError('Credential data is required.');
  const data = Object.fromEntries(academicFields.map(key => [key, normalized(input[key], key, key === 'institution' ? 100 : key === 'fullName' ? 64 : 70)]));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.completionDate) || !Number.isFinite(Date.parse(data.completionDate)) || new Date(data.completionDate).toISOString().slice(0, 10) !== data.completionDate) throw new AppError('Completion date must be a real YYYY-MM-DD date.');
  if (!/^\d{4}-\d{4}$/.test(data.academicYear) || Number(data.academicYear.slice(5)) !== Number(data.academicYear.slice(0,4)) + 1) throw new AppError('Academic year must be consecutive years, for example 2025-2026.');
  return data;
}
export function canonicalize(input) {
  const data = academicData(input);
  const credentialId = validateId(input.credentialId);
  if (typeof input.issuedAt !== 'string' || !Number.isFinite(Date.parse(input.issuedAt))) throw new AppError('A valid issuance timestamp is required.');
  const issuedAt = new Date(input.issuedAt).toISOString();
  // v1 fixed key order, all values strings; JSON escaping prevents ambiguous concatenation.
  return { version: '1', credentialId, fullName: data.fullName, rollNumber: data.rollNumber, department: data.department, degree: data.degree, academicYear: data.academicYear, grade: data.grade, completionDate: data.completionDate, institution: data.institution, issuedAt };
}
export function hashCredential(input) {
  const data = canonicalize(input);
  return { data, hash: '0x' + createHash('sha256').update(JSON.stringify(data), 'utf8').digest('hex') };
}
