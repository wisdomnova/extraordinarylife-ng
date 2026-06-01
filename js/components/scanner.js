/** Camera barcode scanner using ZXing */

let stream = null;
let scanning = false;
let animationId = null;

export async function startScanner(videoEl, onDetected) {
  stopScanner();

  const { BrowserMultiFormatReader } = await import(
    'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/+esm'
  );

  const reader = new BrowserMultiFormatReader();
  scanning = true;

  try {
    const devices = await reader.listVideoInputDevices();
    const backCam = devices.find((d) => /back|rear|environment/i.test(d.label));
    const deviceId = backCam?.deviceId || devices[0]?.deviceId;

    await reader.decodeFromVideoDevice(deviceId, videoEl, (result, err) => {
      if (result && scanning) {
        const text = result.getText();
        scanning = false;
        reader.reset();
        onDetected(text);
      }
    });
  } catch (e) {
    throw new Error('Camera access denied or unavailable. Please allow camera permissions.');
  }

  return () => stopScanner();
}

export function stopScanner() {
  scanning = false;
  document.querySelectorAll('video').forEach((v) => {
    const s = v.srcObject;
    if (s && s.getTracks) s.getTracks().forEach((t) => t.stop());
    v.srcObject = null;
  });
}
