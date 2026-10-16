// ============================================
// ⚠️ هذا اتصال مشروع STAGING التجريبي - وليس الإنتاج الحقيقي ⚠️
// عدّل القيمتين التاليتين بمعلومات مشروع Staging الخاص بك
// (تجدهما في: Supabase Dashboard → مشروع Afaq-Staging → Project Settings → API)
// ============================================

const SUPABASE_URL = "https://tbtwzandcqwyxdzfppvg.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_KWR5azGTQH3Q90v-fEF1tg_5WOSJuFv";

// عميل Supabase (متاح عالمياً لبقية ملفات JS عبر <script> عادي)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// رابط الـ Edge Function الخاصة بإنشاء المستخدمين
const CREATE_USER_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-user`;

// رابط الـ Edge Function الخاصة بإنشاء فيديو في Bunny Stream وتوليد توقيع الرفع
const CREATE_BUNNY_VIDEO_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/create-bunny-video`;
