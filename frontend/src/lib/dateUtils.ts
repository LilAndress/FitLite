/**
 * Utilidades de fecha para FitLite.
 * Genera la fecha local en formato YYYY-MM-DD usando los componentes locales del dispositivo:
 * getFullYear(), getMonth() y getDate().
 * NUNCA utiliza toISOString() para evitar discrepancias por la zona horaria UTC.
 */
export const fechaLocalISO = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

