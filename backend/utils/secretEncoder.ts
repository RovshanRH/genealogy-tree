async function stringToCryptoKey(secret: string): Promise<CryptoKey> {
  // Кодируем строку в Uint8Array
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  
  // Импортируем как ключ
  const cryptoKey = await crypto.subtle.importKey(
    'raw',           // формат ключа
    keyData,         // данные ключа
    { name: 'HMAC', hash: 'SHA-256' }, // алгоритм
    false,           // можно ли экспортировать
    ['sign', 'verify'] // операции
  );
  
  return cryptoKey;
}

export default stringToCryptoKey; 