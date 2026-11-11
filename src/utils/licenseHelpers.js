/**
 * Generates/Retrieves a unique Device ID stored per hardware instance.
 */
export function getDeviceId() {
  let deviceId = localStorage.getItem('tirta_device_id');
  if (!deviceId) {
    // Generate deterministic 16-character hardware identifier tag
    const randomHex = Array.from({ length: 4 }, () => 
      Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1).toUpperCase()
    ).join('-');
    deviceId = `TRT-${randomHex}`;
    localStorage.setItem('tirta_device_id', deviceId);
  }
  return deviceId;
}

/**
 * Secret algorithm to generate matching Serial Key for a given Device ID.
 * (Gunakan rumus ini di laptop/HP developer Anda untuk membuat Serial Key client)
 */
export function generateSerialKey(deviceId) {
  if (!deviceId) return '';
  const cleanId = deviceId.replace(/[^A-Z0-9]/g, '');
  
  // Custom Obfuscation / Hash Logic (Secret Salt: "TIRTA_PERKASA_SECRET_2026")
  let hash = 0;
  const salt = "TIRTA_PERKASA_SECRET_2026";
  const combined = cleanId + salt;
  
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  const posHash = Math.abs(hash).toString(16).padStart(8, '0').toUpperCase();
  const rawKey = `LIC-${posHash.substring(0, 4)}-${posHash.substring(4, 8)}`;
  return rawKey;
}

/**
 * Verifies if entered serial key matches the hardware device ID.
 */
export function verifyLicenseKey(inputKey) {
  const currentDeviceId = getDeviceId();
  const expectedKey = generateSerialKey(currentDeviceId);
  
  const cleanInput = (inputKey || '').trim().toUpperCase();
  if (cleanInput === expectedKey) {
    localStorage.setItem('tirta_license_status', 'ACTIVATED');
    localStorage.setItem('tirta_activated_key', cleanInput);
    return true;
  }
  return false;
}

/**
 * Checks if the application is currently activated on this hardware.
 */
export function checkIsActivated() {
  const status = localStorage.getItem('tirta_license_status');
  const savedKey = localStorage.getItem('tirta_activated_key');
  if (status === 'ACTIVATED' && savedKey) {
    const currentDeviceId = getDeviceId();
    const expectedKey = generateSerialKey(currentDeviceId);
    return savedKey === expectedKey;
  }
  return false;
}