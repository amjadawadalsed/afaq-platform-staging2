// ============================================
// لوحة المشرف - إدارة البرامج
// ============================================

let adminProfile = null;
let programsCache = [];

async function loadPrograms() {
  const listEl = document.getElementById("programsList");
  listEl.innerHTML = `<div class="empty-state">جارٍ التحميل...</div>`;

  const { data, error } = await supabaseClient.from("programs").select("id, name, description").order("name");

  if (error) {
    listEl.innerHTML = `<div class="empty-state">تعذّر تحميل البرامج: ${error.message}</div>`;
    return;
  }

  programsCache = data;

  if (!data.length) {
    listEl.innerHTML = `<div class="empty-state">لا توجد برامج بعد. أضف أول برنامج من الزر أعلاه.</div>`;
    return;
  }

  listEl.innerHTML = data.map(p => `
    <div class="register-row" style="grid-template-columns: 1fr 2fr 0.6fr;">
      <div class="name">${p.name}</div>
      <div class="meta">${p.description || "—"}</div>
      <div class="row-actions">
        <button class="btn-ghost" onclick="openProgramModal('${p.id}')">تعديل</button>
        <button class="btn-ghost" onclick="deleteProgram('${p.id}')">حذف</button>
      </div>
    </div>
  `).join("");
}

function openProgramModal(programId = null) {
  document.getElementById("programForm").reset();
  document.getElementById("programMsg").innerHTML = "";
  document.getElementById("programId").value = programId || "";

  if (programId) {
    const program = programsCache.find(p => p.id === programId);
    document.getElementById("programModalTitle").textContent = "تعديل البرنامج";
    document.getElementById("programName").value = program.name;
    document.getElementById("programDescription").value = program.description || "";
  } else {
    document.getElementById("programModalTitle").textContent = "إضافة برنامج جديد";
  }

  document.getElementById("programModalOverlay").hidden = false;
}

function closeProgramModal() {
  document.getElementById("programModalOverlay").hidden = true;
}

async function deleteProgram(programId) {
  if (!confirm("هل أنت متأكد من حذف هذا البرنامج؟ لن يتمكن الطلاب المرتبطون به من رؤية أي دروس بعد الحذف.")) return;

  const { error } = await supabaseClient.from("programs").delete().eq("id", programId);
  if (error) {
    document.getElementById("listMsg").innerHTML = `<div class="msg msg-error">تعذّر الحذف: ${error.message}</div>`;
    return;
  }
  loadPrograms();
}

document.getElementById("programForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("programSubmitBtn");
  btn.disabled = true;
  btn.textContent = "جارٍ الحفظ...";

  const programId = document.getElementById("programId").value || null;
  const name = document.getElementById("programName").value.trim();
  const description = document.getElementById("programDescription").value.trim() || null;

  try {
    if (programId) {
      const { error } = await supabaseClient.from("programs").update({ name, description }).eq("id", programId);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabaseClient.from("programs").insert({ name, description });
      if (error) throw new Error(error.message);
    }

    closeProgramModal();
    document.getElementById("listMsg").innerHTML = `<div class="msg msg-success">تم الحفظ بنجاح.</div>`;
    loadPrograms();
  } catch (err) {
    document.getElementById("programMsg").innerHTML = `<div class="msg msg-error">${err.message}</div>`;
  }

  btn.disabled = false;
  btn.textContent = "حفظ";
});

(async () => {
  adminProfile = await requireRole("admin");
  if (!adminProfile) return;

  document.getElementById("whoAmI").textContent = `مرحباً، ${adminProfile.full_name}`;
  loadPrograms();
})();
