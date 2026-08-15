const APP_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxsepwyCXKkdjonTEwVosZORzLWcMI8RjpkSqONVLk-izrX4q6IKtbgi2_Pe1I89Gea/exec";

const products = [
  {
    id: "analisis-markah-sk",
    name: "Template Sistem Analisis Markah (SK)",
    price: 40,
    url: "https://sites.google.com/moe-dl.edu.my/sk-contoh/analisis-markah-sk",
  },
  {
    id: "analisis-markah-smk",
    name: "Template Sistem Analisis Markah (SMK)",
    price: 40,
    url: "https://sites.google.com/moe-dl.edu.my/smk-contoh/smkcontoh",
  },
  {
    id: "analisis-pbd-sekolah",
    name: "Template Analisis PBD Sekolah",
    price: 40,
    url: "https://sites.google.com/moe-dl.edu.my/pbd-sk-contoh/analisispbdcontoh",
  },
  {
    id: "perekodan-pbd",
    name: "Template Perekodan PBD",
    price: 40,
    url: "https://heryanimukhair95-bit.github.io/PEREKODAN-PBD-CONTOH/",
  },
  {
    id: "rekod-penghantaran-tugasan",
    name: "Template rekod penghantaran tugasan dan buku kerja",
    price: 35,
    url: "https://heryanimukhair95-bit.github.io/SEMAKAN-BUKU-KERJA-DAN-TUGASAN/",
  },
  {
    id: "carian-id-delima",
    name: "TEMPLATE CARIAN ID DELIMA",
    price: 20,
    url: "https://rekodhafazandraft.my.canva.site/c92sh2cpkd06wkcn",
  },
  {
    id: "carian-unit-kokurikulum",
    name: "SISTEM CARIAN UNIT KOKURIKULUM",
    price: 35,
    url: "https://rekodhafazandraft.my.canva.site/sistem-carianunitkokosdaya",
  },
  {
    id: "reward-board",
    name: "REWARD BOARD",
    price: 35,
    url: "https://heryanimukhair95-bit.github.io/rewardboard-contoh/",
  },
  {
    id: "pajsk-opr",
    name: "SISTEM PENGURUSAN PAJSK+OPR",
    price: 50,
    url: "https://sites.google.com/moe-dl.edu.my/sk-taman-daya-pajsk-opr/opr-pajsk",
  },
  {
    id: "smart-opr-generator",
    name: "SISTEM SMART OPR GENERATOR",
    price: 35,
    url: "",
  },
  {
    id: "rakaman-gemini-canvas-ebook-prompt",
    name: "RAKAMAN KELAS MEMBINA SISTEM PENDIDIKAN GEMINI CANVAS+ E-BOOK KOLEKSI PROMPT SISTEM PENDIDIKAN",
    price: 35,
    url: "",
  },
];

const state = {
  adminPassword: sessionStorage.getItem("adminPassword") || "",
  records: [],
};

const productGrid = document.querySelector("#productGrid");
const productChoices = document.querySelector("#productChoices");
const subtotalPrice = document.querySelector("#subtotalPrice");
const discountPrice = document.querySelector("#discountPrice");
const totalPrice = document.querySelector("#totalPrice");
const purchaseForm = document.querySelector("#purchaseForm");
const formStatus = document.querySelector("#formStatus");
const receiptInput = document.querySelector("#receiptInput");
const receiptName = document.querySelector("#receiptName");
const recordsBody = document.querySelector("#recordsBody");
const adminPanel = document.querySelector("#adminPanel");
const adminStatus = document.querySelector("#adminStatus");
const editDialog = document.querySelector("#editDialog");
const deleteDialog = document.querySelector("#deleteDialog");
const successDialog = document.querySelector("#successDialog");
const successOrderId = document.querySelector("#successOrderId");

function money(value) {
  return `RM ${Number(value || 0).toLocaleString("ms-MY")}`;
}

function priceBreakdown(chosen) {
  const subtotal = chosen.reduce((sum, product) => sum + product.price, 0);
  const discount = chosen.length > 1 ? subtotal * 0.15 : 0;
  const total = subtotal - discount;
  return { subtotal, discount, total };
}

function setStatus(element, message, type = "") {
  element.textContent = message;
  element.className = `status-box ${type}`.trim();
}

function renderProducts() {
  productGrid.innerHTML = products
    .map(
      (product) => `
        <article class="product-card">
          <div>
            <h3>${product.name}</h3>
            <p class="price">${money(product.price)}</p>
          </div>
          ${
            product.url
              ? `<a class="system-link" href="${product.url}" target="_blank" rel="noopener">Lihat Sistem</a>`
              : `<span class="system-link unavailable">Link akan dikemaskini</span>`
          }
        </article>
      `,
    )
    .join("");

  productChoices.innerHTML = products
    .map(
      (product) => `
        <label class="choice-item" for="item-${product.id}">
          <input id="item-${product.id}" type="checkbox" name="items" value="${product.id}" data-price="${product.price}" />
          <span class="choice-copy">
            <strong>${product.name}</strong>
            <small>${money(product.price)}</small>
          </span>
          ${
            product.url
              ? `<a class="choice-link" href="${product.url}" target="_blank" rel="noopener">Lihat Sistem</a>`
              : `<span class="choice-link unavailable">Link akan dikemaskini</span>`
          }
        </label>
      `,
    )
    .join("");
}

function selectedProducts() {
  return [...document.querySelectorAll('input[name="items"]:checked')].map((input) => {
    return products.find((product) => product.id === input.value);
  });
}

function updateTotal() {
  const chosen = selectedProducts();
  const { subtotal, discount, total } = priceBreakdown(chosen);
  subtotalPrice.textContent = `Subtotal: ${money(subtotal)}`;
  discountPrice.textContent =
    chosen.length > 1 ? `Diskaun 15%: -${money(discount)}` : "Diskaun: RM 0";
  totalPrice.textContent = `Jumlah: ${money(total)}`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      resolve(result.includes(",") ? result.split(",")[1] : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function apiRequest(params) {
  const response = await fetch(APP_SCRIPT_URL, {
    method: "POST",
    body: new URLSearchParams(params),
  });
  const data = await response.json();
  if (!data.success) {
    throw new Error(data.message || "Ralat tidak dikenal pasti.");
  }
  return data;
}

async function submitPurchase(event) {
  event.preventDefault();
  const chosen = selectedProducts();
  if (!chosen.length) {
    setStatus(formStatus, "Sila pilih sekurang-kurangnya satu item pembelian.", "error");
    return;
  }

  const file = receiptInput.files[0];
  if (!file) {
    setStatus(formStatus, "Sila muat naik resit bayaran.", "error");
    return;
  }

  const submitBtn = document.querySelector("#submitBtn");
  submitBtn.disabled = true;
  setStatus(formStatus, "Sedang menghantar borang dan resit...", "");

  try {
    const { subtotal, discount, total } = priceBreakdown(chosen);
    const fileBase64 = await fileToBase64(file);
    const payload = new URLSearchParams();
    payload.set("action", "create");
    payload.set("nama", purchaseForm.elements.nama.value.trim());
    payload.set("emel", purchaseForm.elements.emel.value.trim());
    payload.set("sekolah", purchaseForm.elements.sekolah.value.trim());
    payload.set("telefon", purchaseForm.elements.telefon.value.trim());
    payload.set("itemIds", chosen.map((product) => product.id).join(", "));
    payload.set("items", chosen.map((product) => product.name).join(" | "));
    payload.set("subtotal", String(subtotal));
    payload.set("diskaun", String(discount));
    payload.set("jumlah", String(total));
    payload.set("receiptBase64", fileBase64);
    payload.set("receiptName", file.name);
    payload.set("receiptMimeType", file.type || "application/octet-stream");

    const data = await apiRequest(payload);

    purchaseForm.reset();
    updateTotal();
    receiptName.textContent = "Format imej atau PDF diterima.";
    setStatus(
      formStatus,
      `Berjaya dihantar. ID tempahan: ${data.id}. Emel pengesahan akan dihantar kepada pembeli.`,
      "success",
    );
    successOrderId.textContent = `ID Tempahan: ${data.id}`;
    successDialog.showModal();
  } catch (error) {
    setStatus(formStatus, error.message, "error");
  } finally {
    submitBtn.disabled = false;
  }
}

async function copyAccountNumber() {
  const account = document.querySelector("#accountNumber").textContent.trim();
  await navigator.clipboard.writeText(account);
  document.querySelector("#copyStatus").textContent = "No akaun berjaya disalin.";
}

function renderRecords() {
  if (!state.records.length) {
    recordsBody.innerHTML = `<tr><td colspan="7">Tiada rekod pembelian lagi.</td></tr>`;
    return;
  }

  recordsBody.innerHTML = state.records
    .map(
      (record) => `
        <tr class="${record.status === "Telah Dihantar" ? "completed-order" : ""}">
          <td>${record.tarikh || "-"}</td>
          <td><strong>${record.nama || "-"}</strong><br>${record.sekolah || ""}<br>${record.telefon || ""}</td>
          <td>${record.emel || "-"}</td>
          <td>${record.items || "-"}</td>
          <td>${money(record.jumlah)}</td>
          <td>${record.status || "Baru"}<br><small>${record.notaAdmin || ""}</small></td>
          <td>
            <div class="row-actions">
              <a class="button ghost" href="${record.receiptUrl || "#"}" target="_blank" rel="noopener">Resit</a>
              <button class="button ghost" type="button" data-edit="${record.id}">Edit</button>
              <button class="button danger-button" type="button" data-delete="${record.id}">Padam</button>
            </div>
          </td>
        </tr>
      `,
    )
    .join("");
}

async function loadRecords() {
  setStatus(adminStatus, "Sedang memuat rekod...", "");
  try {
    const data = await apiRequest({
      action: "read",
      adminPassword: state.adminPassword,
    });
    state.records = data.records || [];
    adminPanel.hidden = false;
    renderRecords();
    setStatus(adminStatus, "Rekod berjaya dimuatkan.", "success");
  } catch (error) {
    adminPanel.hidden = false;
    setStatus(adminStatus, error.message, "error");
  }
}

function openEdit(id) {
  const record = state.records.find((item) => item.id === id);
  if (!record) return;
  document.querySelector("#editId").value = record.id;
  document.querySelector("#editStatus").value = record.status || "Baru";
  document.querySelector("#editNota").value = record.notaAdmin || "";
  editDialog.showModal();
}

async function saveEdit(event) {
  event.preventDefault();
  setStatus(adminStatus, "Sedang menyimpan kemas kini...", "");
  try {
    await apiRequest({
      action: "update",
      adminPassword: state.adminPassword,
      id: document.querySelector("#editId").value,
      status: document.querySelector("#editStatus").value,
      notaAdmin: document.querySelector("#editNota").value,
    });
    editDialog.close();
    await loadRecords();
    setStatus(adminStatus, "Rekod berjaya dikemas kini.", "success");
  } catch (error) {
    setStatus(adminStatus, error.message, "error");
  }
}

function openDelete(id) {
  const record = state.records.find((item) => item.id === id);
  document.querySelector("#deleteId").value = id;
  document.querySelector("#deleteMessage").textContent = `Padam rekod ${record?.nama || id}? Tindakan ini tidak menggunakan confirm() pelayar.`;
  deleteDialog.showModal();
}

async function deleteRecord(event) {
  event.preventDefault();
  setStatus(adminStatus, "Sedang memadam rekod...", "");
  try {
    await apiRequest({
      action: "delete",
      adminPassword: state.adminPassword,
      id: document.querySelector("#deleteId").value,
    });
    deleteDialog.close();
    await loadRecords();
    setStatus(adminStatus, "Rekod berjaya dipadam.", "success");
  } catch (error) {
    setStatus(adminStatus, error.message, "error");
  }
}

renderProducts();
updateTotal();

productChoices.addEventListener("change", updateTotal);
productChoices.addEventListener("click", (event) => {
  if (event.target.closest(".choice-link")) {
    event.stopPropagation();
  }
});
purchaseForm.addEventListener("submit", submitPurchase);
document.querySelector("#copyAccountBtn").addEventListener("click", copyAccountNumber);
receiptInput.addEventListener("change", () => {
  receiptName.textContent = receiptInput.files[0]?.name || "Format imej atau PDF diterima.";
});

document.querySelector("#adminLogin").addEventListener("submit", async (event) => {
  event.preventDefault();
  state.adminPassword = document.querySelector("#adminPassword").value;
  sessionStorage.setItem("adminPassword", state.adminPassword);
  adminPanel.hidden = true;
  adminStatus.textContent = "";
  await loadRecords();
});

document.querySelector("#refreshRecords").addEventListener("click", loadRecords);
document.querySelector("#logoutAdmin").addEventListener("click", () => {
  state.adminPassword = "";
  sessionStorage.removeItem("adminPassword");
  adminPanel.hidden = true;
  document.querySelector("#adminPassword").value = "";
});

recordsBody.addEventListener("click", (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;
  if (editId) openEdit(editId);
  if (deleteId) openDelete(deleteId);
});

document.querySelector("#editForm").addEventListener("submit", saveEdit);
document.querySelector("#deleteForm").addEventListener("submit", deleteRecord);
document.querySelector("[data-close-edit]").addEventListener("click", () => editDialog.close());
document.querySelector("[data-close-delete]").addEventListener("click", () => deleteDialog.close());
