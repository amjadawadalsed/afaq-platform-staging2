// ============================================
// لوحة المشرف - إدارة المستخدمين
// ============================================

let currentTab = "student";
let adminProfile = null;
let usersCache = [];
let programsCache = [];
let teachersCache = [];

function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

function statusPill(isActive) {
  return isActive
    ? `<span class="pill pill-sage">مُفعّل</span>`
    : `<span class="pill pill-amber">بانتظار التفعيل</span>`;
}

async function loadLookups() {
  const [{ data: programs }, { data: teachers }] = await Promise.all([
    supabaseClient.from("programs").select("id, name").order("name"),
    supabaseClient.from("users").select("id, full_name").eq("role", "teacher"),
  ]);
  programsCache = programs || [];
  teachersCache = teachers || [];
}

async function loadUsers() {
  const listEl = document.getElementById("usersList");
  listEl.innerHTML = `<div class="empty-state">جارٍ التحميل...</div>`;

  const { data, error } = await supabaseClient
    .from("users")
    .select("id, full_name, email, is_active, created_at, program_id, assigned_teacher_id")
    .eq("role", currentTab)
    .order("created_at", { ascending: false });

  if (error) {
    listEl.innerHTML = `<div class="empty-state">تعذّر تحميل القائمة: ${error.message}</div>`;
    return;
  }

  usersCache = data;

  if (!data.length) {
    listEl.innerHTML = `<div class="empty-state">لا يوجد ${currentTab === "student" ? "طلاب" : "معلمون"} حتى الآن. أنشئ أول حساب من الزر أعلاه.</div>`;
    return;
  }

  listEl.innerHTML = data.map(u => {
    const programName = programsCache.find(p => p.id === u.program_id)?.name;
    const teacherName = teachersCache.find(t => t.id === u.assigned_teacher_id)?.full_name;
    return `
    <div class="register-row">
      <div class="name">${u.full_name}${currentTab === "student" ? `<div class="meta">${programName || "بلا برنامج"} — ${teacherName || "بلا معلم"}</div>` : ""}</div>
      <div class="meta">${u.email}</div>
      <div>${statusPill(u.is_active)}</div>
      <div class="meta">${fmtDate(u.created_at)}</div>
      <div class="row-actions">
        ${currentTab === "student" ? `<button class="btn-ghost" onclick="openAssignModal('${u.id}')">توزيع</button>` : ""}
        <button class="btn-ghost" onclick="toggleActive('${u.id}', ${u.is_active})">
          ${u.is_active ? "تعطيل" : "تفعيل"}
        </button>
      </div>
    </div>
  `;
  }).join("");
}

async function toggleActive(userId, currentlyActive) {
  const { error } = await supabaseClient
    .from("users")
    .update({ is_active: !currentlyActive })
    .eq("id", userId);

  if (error) {
    document.getElementById("listMsg").innerHTML = `<div class="msg msg-error">تعذّر التحديث: ${error.message}</div>`;
    return;
  }
  loadUsers();
}

function switchTab(role) {
  currentTab = role;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.role === role));
  loadUsers();
}

// ============ نافذة إنشاء حساب ============
function openCreateModal() {
  document.getElementById("createModalTitle").textContent =
    currentTab === "student" ? "إنشاء حساب طالب" : "إنشاء حساب معلم";
  document.getElementById("createUserForm").reset();
  document.getElementById("createMsg").innerHTML = "";
  document.getElementById("createModalOverlay").hidden = false;
}

function closeCreateModal() {
  document.getElementById("createModalOverlay").hidden = true;
}

document.getElementById("createUserForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("createSubmitBtn");
  btn.disabled = true;
  btn.textContent = "جارٍ الإنشاء...";

  const full_name = document.getElementById("newFullName").value.trim();
  const email = document.getElementById("newEmail").value.trim();

  const { data: { session } } = await supabaseClient.auth.getSession();

  try {
    const res = await fetch(CREATE_USER_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ email, full_name, role: currentTab }),
    });
    const result = await res.json();

    if (!res.ok) {
      document.getElementById("createMsg").innerHTML = `<div class="msg msg-error">${result.error || "حدث خطأ غير متوقع"}</div>`;
      btn.disabled = false;
      btn.textContent = "إنشاء الحساب";
      return;
    }

    closeCreateModal();
    document.getElementById("listMsg").innerHTML = `<div class="msg msg-success">تم إنشاء الحساب بنجاح. الحساب بانتظار التفعيل.</div>`;
    loadUsers();
  } catch (err) {
    document.getElementById("createMsg").innerHTML = `<div class="msg msg-error">تعذّر الاتصال بالخادم: ${err.message}</div>`;
  }

  btn.disabled = false;
  btn.textContent = "إنشاء الحساب";
});

// ============ نافذة توزيع الطالب على برنامج ومعلم ============
function openAssignModal(studentId) {
  const user = usersCache.find(u => u.id === studentId);
  if (!user) return;

  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "assignModalOverlay";
  overlay.innerHTML = `
    <div class="modal">
      <h2>توزيع ${user.full_name}</h2>
      <div id="assignMsg"></div>
      <div class="field">
        <label for="assignProgram">البرنامج</label>
        <select id="assignProgram">
          <option value="">بلا برنامج</option>
          ${programsCache.map(p => `<option value="${p.id}" ${p.id === user.program_id ? "selected" : ""}>${p.name}</option>`).join("")}
        </select>
      </div>
      <div class="field">
        <label for="assignTeacher">المعلم المسؤول</label>
        <select id="assignTeacher">
          <option value="">بلا معلم</option>
          ${teachersCache.map(t => `<option value="${t.id}" ${t.id === user.assigned_teacher_id ? "selected" : ""}>${t.full_name}</option>`).join("")}
        </select>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-primary" id="assignSaveBtn">حفظ</button>
        <button type="button" class="btn-ghost" onclick="document.getElementById('assignModalOverlay').remove()">إلغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("assignSaveBtn").addEventListener("click", async () => {
    const btn = document.getElementById("assignSaveBtn");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const program_id = document.getElementById("assignProgram").value || null;
    const assigned_teacher_id = document.getElementById("assignTeacher").value || null;

    const { error } = await supabaseClient.from("users").update({ program_id, assigned_teacher_id }).eq("id", studentId);

    if (error) {
      document.getElementById("assignMsg").innerHTML = `<div class="msg msg-error">${error.message}</div>`;
      btn.disabled = false;
      btn.textContent = "حفظ";
      return;
    }

    overlay.remove();
    document.getElementById("listMsg").innerHTML = `<div class="msg msg-success">تم تحديث التوزيع بنجاح.</div>`;
    loadUsers();
  });
}

// ============ تشغيل الصفحة ============
(async () => {
  adminProfile = await requireRole("admin");
  if (!adminProfile) return;

  document.getElementById("whoAmI").textContent = `مرحباً، ${adminProfile.full_name}`;
  await loadLookups();
  loadUsers();
})();
