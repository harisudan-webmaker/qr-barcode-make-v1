// Tab Navigation
document.querySelectorAll(".nav-link").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-link").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

// ================= QR CODE GENERATOR =================
const qrType = document.getElementById("qrType");
const qrFinalCanvas = document.getElementById("qrFinalCanvas");
const qrHiddenHolder = document.getElementById("qrHiddenHolder");
const qrStatus = document.getElementById("qrStatus");
const qrLogoInput = document.getElementById("qrLogoInput");
const logoScaleGroup = document.getElementById("logoScaleGroup");
const logoScale = document.getElementById("logoScale");
const logoScaleVal = document.getElementById("logoScaleVal");

let uploadedLogoImg = null;

qrType.addEventListener("change", () => {
  document.querySelectorAll(".type-fields").forEach((el) => el.classList.remove("active"));
  document.getElementById(`fields-${qrType.value}`).classList.add("active");
  renderQR();
});

function buildQrPayload() {
  const type = qrType.value;
  if (type === "url") {
    return document.getElementById("qrUrlInput").value.trim() || "https://example.com";
  }
  if (type === "wifi") {
    const ssid = document.getElementById("wifiSsid").value.trim();
    const pass = document.getElementById("wifiPass").value;
    const enc = document.getElementById("wifiEnc").value;
    return `WIFI:T:${enc};S:${ssid};P:${pass};;`;
  }
  if (type === "whatsapp") {
    const phone = document.getElementById("waPhone").value.replace(/[^0-9]/g, "");
    const msg = encodeURIComponent(document.getElementById("waMsg").value.trim());
    return msg ? `https://wa.me/${phone}?text=${msg}` : `https://wa.me/${phone}`;
  }
  if (type === "vcard") {
    const name = document.getElementById("vcName").value.trim();
    const phone = document.getElementById("vcPhone").value.trim();
    const email = document.getElementById("vcEmail").value.trim();
    const org = document.getElementById("vcOrg").value.trim();
    return [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${name}`,
      org ? `ORG:${org}` : "",
      phone ? `TEL:${phone}` : "",
      email ? `EMAIL:${email}` : "",
      "END:VCARD"
    ].filter(Boolean).join("\n");
  }
  return "https://example.com";
}

function renderQR() {
  const payload = buildQrPayload();
  const size = parseInt(document.getElementById("qrSize").value, 10);
  const fg = document.getElementById("qrFgColor").value;
  const bg = document.getElementById("qrBgColor").value;

  qrHiddenHolder.innerHTML = "";
  try {
    new QRCode(qrHiddenHolder, {
      text: payload,
      width: size,
      height: size,
      colorDark: fg,
      colorLight: bg,
      correctLevel: uploadedLogoImg ? QRCode.CorrectLevel.H : QRCode.CorrectLevel.M
    });

    setTimeout(() => {
      const sourceCanvas = qrHiddenHolder.querySelector("canvas");
      if (!sourceCanvas) return;

      qrFinalCanvas.width = size;
      qrFinalCanvas.height = size;
      const ctx = qrFinalCanvas.getContext("2d");

      // Draw quiet-zone margin + QR code
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, size, size);
      const pad = Math.round(size * 0.04);
      ctx.drawImage(sourceCanvas, pad, pad, size - pad * 2, size - pad * 2);

      // Draw optional center logo with clean background badge
      if (uploadedLogoImg) {
        const pct = parseInt(logoScale.value, 10) / 100;
        const logoBox = Math.round(size * pct);
        const logoPad = Math.round(logoBox * 0.14);
        const x = Math.round((size - logoBox) / 2);
        const y = Math.round((size - logoBox) / 2);

        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.roundRect(x - logoPad, y - logoPad, logoBox + logoPad * 2, logoBox + logoPad * 2, 12);
        ctx.fill();

        ctx.drawImage(uploadedLogoImg, x, y, logoBox, logoBox);
      }

      qrStatus.classList.remove("error");
      qrStatus.textContent = "Ready to download — scannable & permanent.";
    }, 20);
  } catch (err) {
    qrStatus.classList.add("error");
    qrStatus.textContent = "Text is too long for this QR code. Shorten your input.";
  }
}

qrLogoInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      uploadedLogoImg = img;
      logoScaleGroup.hidden = false;
      renderQR();
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

document.getElementById("clearLogoBtn").addEventListener("click", () => {
  uploadedLogoImg = null;
  qrLogoInput.value = "";
  logoScaleGroup.hidden = true;
  renderQR();
});

logoScale.addEventListener("input", () => {
  logoScaleVal.textContent = logoScale.value;
  renderQR();
});

document.querySelectorAll("#qrTab input, #qrTab select").forEach((el) => {
  if (el.id !== "qrLogoInput" && el.id !== "logoScale") {
    el.addEventListener("input", renderQR);
    el.addEventListener("change", renderQR);
  }
});

document.getElementById("downloadQrBtn").addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = `qr-code-${qrType.value}.png`;
  link.href = qrFinalCanvas.toDataURL("image/png");
  link.click();
});

// ================= BARCODE GENERATOR =================
const bcCanvas = document.getElementById("bcCanvas");
const bcStatus = document.getElementById("bcStatus");
const bcHeight = document.getElementById("bcHeight");
const bcHeightVal = document.getElementById("bcHeightVal");

function renderBarcode() {
  const format = document.getElementById("bcFormat").value;
  const val = document.getElementById("bcValue").value.trim();
  const lineColor = document.getElementById("bcLineColor").value;
  const bg = document.getElementById("bcBgColor").value;
  const height = parseInt(bcHeight.value, 10);
  const displayValue = document.getElementById("bcShowText").value === "true";

  if (!val) {
    bcStatus.classList.add("error");
    bcStatus.textContent = "Enter a value to generate a barcode.";
    return;
  }

  try {
    JsBarcode(bcCanvas, val, {
      format,
      lineColor,
      background: bg,
      width: 2,
      height,
      displayValue,
      margin: 14
    });
    bcStatus.classList.remove("error");
    bcStatus.textContent = `Valid ${format} barcode generated.`;
  } catch (err) {
    bcStatus.classList.add("error");
    bcStatus.textContent = `Invalid input for ${format} (check required digit count/characters).`;
  }
}

bcHeight.addEventListener("input", () => {
  bcHeightVal.textContent = bcHeight.value;
  renderBarcode();
});

document.querySelectorAll("#barcodeTab input, #barcodeTab select").forEach((el) => {
  if (el.id !== "bcHeight") {
    el.addEventListener("input", renderBarcode);
    el.addEventListener("change", renderBarcode);
  }
});

document.getElementById("downloadBcBtn").addEventListener("click", () => {
  if (bcStatus.classList.contains("error")) return;
  const link = document.createElement("a");
  link.download = `barcode-${document.getElementById("bcFormat").value}.png`;
  link.href = bcCanvas.toDataURL("image/png");
  link.click();
});

// Initial Render
renderQR();
renderBarcode();