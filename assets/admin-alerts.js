// ============================================
// لوحة المشرف - التنبيهات
// ============================================

let adminProfile = null;
let currentFilter = "unread";

const TYPE_META = {
  student_absent: { label: "غياب طالب", cls: "pill-amber" },
  teacher_late_grading: { label: "تأخر معلم", cls: "pill-brick" },
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "short", day: "numeric" });
}

async function loadAlerts() {
  const listEl = document.getElementById("alertsList");
  listEl.innerHTML = `<div class="empty-state">جارٍ التحميل...</div>`;

  let query = supabaseClient.from("admin_alerts").select("id, alert_type, message, alert_date, is_read").order("created_at", { ascending: false });
  if (currentFilter === "unread") query = query.eq("is_read", false);

  const { data, error } = await query;

  if (error) {
    listEl.innerHTML = `<div class="empty-state">تعذّر تحميل التنبيهات: ${error.message}</div>`;
    return;
  }

  if (!data.length) {
    listEl.innerHTML = `<div class="empty-state">لا توجد تنبيهات ${currentFilter === "unread" ? "غير مقروءة" : ""} حالياً. كل شيء تحت السيطرة! ✅</div>`;
    return;
  }

  listEl.innerHTML = data.map(a => {
    const meta = TYPE_META[a.alert_type] || { label: a.alert_type, cls: "pill" };
    return `
      <div class="register-row" style="grid-template-columns: 0.6fr 2fr 0.7fr 0.6fr;">
        <div><span class="pill ${meta.cls}">${meta.label}</span></div>
        <div class="meta">${a.message}</div>
        <div class="meta">${fmtDate(a.alert_date)}</div>
        <div class="row-actions">
          ${!a.is_read ? `<button class="btn-ghost" onclick="markAsRead('${a.id}')">تم الاطلاع</button>` : `<span class="meta">✓ مقروء</span>`}
        </div>
      </div>
    `;
  }).join("");
}

async function markAsRead(alertId) {
  const { error } = await supabaseClient.from("admin_alerts").update({ is_read: true }).eq("id", alertId);
  if (error) {
    document.getElementById("listMsg").innerHTML = `<div class="msg msg-error">تعذّر التحديث: ${error.message}</div>`;
    return;
  }
  loadAlerts();
}

function switchFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.toggle("active", b.dataset.filter === filter));
  loadAlerts();
}

(async () => {
  adminProfile = await requireRole("admin");
  if (!adminProfile) return;

  document.getElementById("whoAmI").textContent = `مرحباً، ${adminProfile.full_name}`;
  loadAlerts();
})();
