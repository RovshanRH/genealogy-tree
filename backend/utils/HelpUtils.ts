// Полезные утилиты
export class HelpUtils {
  validateNull(value?: string | null) {
    if (value == null) {
        return null
    }
  }
  normalizeText(value?: string | null) {
    const normalized = value?.trim();
    return normalized ? normalized : undefined;
  }
  parseDate(dateString?: string | null): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    // Проверяем, что дата валидная
    if (isNaN(date.getTime())) {
      return null;
    }
    return date;
  } catch {
    return null;
  }
}
}
