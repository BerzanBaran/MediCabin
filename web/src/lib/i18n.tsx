import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Language = "tr" | "en";

const KEY = "ilac-dolabi-language";

const dictionaries = {
  tr: {
    appName: "İlaç Dolabı Asistanı",
    tab_home: "Ana Sayfa",
    tab_chat: "Sohbet",
    tab_meds: "İlaç Dolabım",
    tab_settings: "Ayarlar",

    hero_title_1: "İlaçlarınız hakkında",
    hero_title_2: "güvenilir bilgi",
    hero_subtitle:
      "Resmî prospektüslerden, kaynak göstererek yanıtlar. Verileriniz cihazınızdan çıkmaz — tamamen yerel ve gizli.",
    badge_offline: "Offline çalışır",
    badge_local: "Veri cihazda kalır",
    badge_sourced: "Kaynaklı yanıt",
    cta_start: "Başlayalım",
    cta_guide: "İlaç Rehberini Aç",

    card_profile_title: "Profilim",
    card_profile_desc: "Hastalık, alerji ve kişisel bilgiler",
    card_guide_title: "İlaç Rehberi",
    card_guide_desc: "Prospektüsleri gözat ve oku",
    card_qa_title: "Soru-Cevap",
    card_qa_desc: "Yazılı olarak sor — yerel RAG",
    card_notes_title: "Notlar & Yorumlar",
    card_notes_desc: "Kullanım durumu ve ilaç yorumu",
    card_analysis_title: "Analiz",
    card_analysis_desc: "Grafikler + yerel AI yorumu",
    card_symptom_title: "Belirti Kontrolü",
    card_symptom_desc: "Bu belirti ilacımdan mı?",
    card_safety_title: "Güvenlik Denetimi",
    card_safety_desc: "Etkileşim + mükerrer kontrol",
    card_photo_title: "Fotoğrafla Analiz Et",
    card_photo_desc: "İlaç kutusunun fotoğrafını çek, analiz et",
    card_calendar_title: "Takvim & Hatırlatıcı",
    card_calendar_desc: "Dozları zamanında al",
    badge_soon: "Yakında",

    chat_hint: "Örnek: \"Coumadin ile Nurofen'i birlikte alabilir miyim?\"",
    chat_placeholder: "İlaçlarınız hakkında bir soru sorun…",
    chat_send: "Gönder",
    chat_preparing: "Yanıt hazırlanıyor…",
    chat_sources_label: "Kaynaklar:",
    interaction_title: "⚠ Etkileşim Uyarısı",
    interaction_body: (drugs: string) =>
      `Sorunuz ${drugs} ilaçlarını birlikte içeriyor. Aşağıdaki cevabı dikkatle okuyun ve kesin bilgi için eczacınıza veya doktorunuza danışın.`,
    interaction_and: "ve",

    meds_loading: "Yükleniyor…",
    meds_empty: "İlaç dolabınız boş.",
    meds_chunks: "parça",

    settings_server_label: "Sunucu Adresi",
    settings_save: "Kaydet",
    settings_test: "Bağlantıyı Test Et",
    settings_testing: "Bağlantı test ediliyor…",
    settings_ok: "✓ Bağlantı başarılı, ilaç dolabı hazır.",
    settings_ok_no_index: "✓ Sunucuya ulaşıldı ama index henüz yüklenmedi.",
    settings_error: (msg: string) => `✗ Bağlantı hatası: ${msg}`,
    settings_note: (url: string) =>
      `Backend ve web arayüzü aynı bilgisayarda çalıştığı için genelde varsayılan adres (${url}) yeterlidir.`,

    unknown_error: "Bilinmeyen bir hata oluştu.",

    guide_header_title: "İlaç Rehberi",
    guide_header_subtitle: "Yerel asistan",
    guide_badge_local: "Yerel · Gizli · Cihazda",
    guide_nav_group_main: "ANA",
    guide_nav_panel: "Panel",
    guide_nav_profile: "Profilim",
    guide_nav_guide: "İlaç Rehberi",
    guide_nav_my_meds: "İlaçlarım",
    guide_nav_qa: "Soru-Cevap",
    guide_nav_group_track: "TAKİP",
    guide_nav_notes: "Notlar & Yorumlar",
    guide_nav_analysis: "Analiz",
    guide_nav_symptom: "Belirti Kontrolü",
    guide_nav_calendar: "Takvim",
    guide_nav_side_effects: "Yan Etki Günlüğü",
    guide_nav_group_safety: "GÜVENLİK",
    guide_nav_interactions: "Etkileşim",
    guide_nav_interactions_sub: "İlaç ikililerini tara",
    guide_nav_polypharmacy: "Polifarmasi",
    guide_nav_polypharmacy_sub: "Mükerrer & rapor",

    panel_search_placeholder: "Bir ilaç hakkında soru sorun…",
    panel_security_prefix: "Güvenlik durumu:",
    risk_high: "Yüksek risk",
    risk_medium: "Orta risk",
    risk_low: "Düşük risk",
    panel_security_summary: (drugs: number, interactions: number, dupes: number) =>
      `${drugs} ilaç · ${interactions} etkileşim · ${dupes} mükerrer etken madde`,
    panel_today_title: "Bugünkü ilaçlarınız",
    panel_today_empty: "Henüz doz saati eklemediniz.",
    panel_today_cta: "İlaçlarım'dan zaman ekleyin →",
    panel_loading: "Yükleniyor…",

    soon_body: "Bu özellik yakında burada olacak.",

    interactions_title: "İlaç Etkileşimleri",
    interactions_empty: "Dolabınızdaki ilaçlar arasında bilinen bir etkileşim bulunamadı.",

    polypharmacy_title: "Mükerrer Etken Madde",
    polypharmacy_empty: "Dolabınızda aynı etkin maddeyi içeren birden fazla ilaç bulunamadı.",

    my_meds_title: "İlaçlarım",
    my_meds_time_label: "Doz saatleri (virgülle ayırın, örn. 08:00, 20:00)",
    my_meds_save: "Kaydet",
    my_meds_saved: "Kaydedildi ✓",

    symptom_title: "Yaşadığınız belirti, kullandığınız ilaçların yan etkisi olabilir mi?",
    symptom_subtitle: (link: string) =>
      `Belirtinizi yazın; ${link} listenizdeki ilaçların prospektüs yan etki bölümleriyle karşılaştırılır. Tamamen yerel çalışır.`,
    symptom_placeholder: "örn. midem bulanıyor",
    symptom_check_button: "Kontrol Et",
    symptom_checking: "Kontrol ediliyor…",
    symptom_examples: ["başım dönüyor", "midem bulanıyor", "kaşıntı ve döküntü var", "çarpıntı hissediyorum"],
    symptom_result_prefix: (symptom: string) =>
      `"${symptom}" belirtisi, kullandığınız şu ilaçların prospektüsündeki yan etkilerle örtüşüyor olabilir:`,
    symptom_no_match: (symptom: string) =>
      `"${symptom}" belirtisi, dolabınızdaki ilaçların prospektüs yan etki bölümlerinde bulunamadı.`,
    symptom_direct_match: "doğrudan eşleşme",
    symptom_related_match: "olası eşleşme",
    symptom_save_to_log: "Günlüğe Kaydet",
    symptom_saved_to_log: "Günlüğe kaydedildi ✓",
    symptom_checked_drugs: (drugs: string) => `Kontrol edilen ilaçlar: ${drugs}.`,
    symptom_disclaimer:
      "Bu sonuç kesin bir teşhis değildir; yalnızca prospektüse dayalı bir bilgilendirmedir. Belirtinin nedenini ve ilacınızı değiştirip değiştirmeyeceğinizi yalnızca hekiminiz belirleyebilir.",

    log_title: "Yan Etki Günlüğü",
    log_empty: "Henüz kaydedilmiş bir yan etki kaydı yok.",
    log_remove: "Sil",

    notes_today_title: "Bugünkü Kullanım Durumu",
    notes_status_aldim: "Aldım",
    notes_status_atladim: "Atladım",
    notes_status_gecikti: "Gecikti",
    notes_status_sorun: "Sorun",
    notes_add_title: "Yorum Ekle",
    notes_drug_label: "İlaç",
    notes_rating_label: "Memnuniyet (1-5)",
    notes_severity_label: "Ciddiyet (1-5)",
    notes_comment_placeholder: "Bu ilaç hakkında notunuz…",
    notes_add_button: "Ekle",
    notes_list_title: "Yorumlarım",
    notes_list_empty: "Henüz bir yorum eklemediniz.",
    notes_author_label: "Yazan",
    notes_author_self: "Siz",

    profile_title: "Profilim",
    profile_add_title: "Yeni Profil Ekle",
    profile_name_label: "Ad Soyad",
    profile_age_label: "Yaş",
    profile_gender_label: "Cinsiyet",
    profile_gender_kadin: "Kadın",
    profile_gender_erkek: "Erkek",
    profile_conditions_label: "Hastalıklar (virgülle ayırın)",
    profile_allergies_label: "Alerjiler (virgülle ayırın)",
    profile_note_label: "Not",
    profile_add_button: "Ekle",
    profile_list_empty: "Henüz profil eklenmedi.",
    profile_no_conditions: "Bilinen hastalık yok",
    profile_no_allergies: "Bilinen alerji yok",

    analysis_header_title: "Kullanım ve yan etki görünümü",
    analysis_header_subtitle:
      "İlaç planı, kullanım notları, yan etki günlüğü ve yorumlarınızdan üretilen özet grafikler. AI yorumu tamamen yerel model ile çalışır; tıbbi tavsiye değildir.",
    analysis_ai_button: "AI Yorumu",
    analysis_ai_loading: "Yorumlanıyor…",
    analysis_stat_plan: "İlaç Planı",
    analysis_stat_side_effect: "Yan Etki",
    analysis_stat_usage_note: "Kullanım Notu",
    analysis_stat_comment: "Yorum",
    analysis_stat_severity: "Ort. Şiddet",
    analysis_stat_rating: "Ort. Puan",
    analysis_chart_title: "Günlük kullanım durumu",
    analysis_chart_empty: "Henüz kullanım kaydı yok. Notlar & Yorumlar'dan bugünkü durumu işaretleyin.",

    tab_login: "Giriş",
    login_title: "Giriş Yap",
    login_tc_label: "TC Kimlik No",
    login_password_label: "Şifre",
    login_submit: "Giriş Yap",
    login_forgot_password: "Şifremi unuttum",
    login_forgot_password_info:
      "Bu, tamamen yerel çalışan bir demo hesabı — kurtarma e-postası/SMS sunucusu yok. Şifrenizi unuttuysanız yeniden kayıt olabilirsiniz.",
    login_switch_to_register: "Hesabınız yok mu? Kayıt olun",
    login_switch_to_login: "Zaten hesabınız var mı? Giriş yapın",
    login_error_not_found: "Bu TC Kimlik No ile kayıtlı hesap bulunamadı.",
    login_error_wrong_password: "Şifre hatalı.",
    login_error_invalid_tc: "Geçerli bir TC Kimlik No girin (11 haneli).",
    login_error_weak_password: "Şifre en az 4 karakter olmalı.",
    login_error_mismatch: "Şifreler eşleşmiyor.",
    login_success_message: "Giriş başarılı.",
    register_title: "Kayıt Ol",
    register_confirm_label: "Şifre (Tekrar)",
    register_submit: "Kayıt Ol",
    register_success_message: "Kayıt başarılı! Şimdi giriş yapabilirsiniz.",
    login_welcome: (tc: string) => `Hoş geldiniz. (TC: ${tc.slice(0, 3)}••••••${tc.slice(-2)})`,
    login_logout: "Çıkış Yap",
    login_local_note: "Bu bilgiler yalnızca cihazınızda saklanır, hiçbir sunucuya gönderilmez.",
  },
  en: {
    appName: "Medicine Cabinet Assistant",
    tab_home: "Home",
    tab_chat: "Chat",
    tab_meds: "My Cabinet",
    tab_settings: "Settings",

    hero_title_1: "Trustworthy information",
    hero_title_2: "about your medicines",
    hero_subtitle:
      "Answers sourced from official leaflets. Your data never leaves your device — fully local and private.",
    badge_offline: "Works offline",
    badge_local: "Data stays on device",
    badge_sourced: "Sourced answers",
    cta_start: "Get started",
    cta_guide: "Open medicine guide",

    card_profile_title: "My Profile",
    card_profile_desc: "Conditions, allergies and personal info",
    card_guide_title: "Medicine Guide",
    card_guide_desc: "Browse and read leaflets",
    card_qa_title: "Q&A",
    card_qa_desc: "Ask in writing — local RAG",
    card_notes_title: "Notes & Comments",
    card_notes_desc: "Usage status and remarks",
    card_analysis_title: "Analysis",
    card_analysis_desc: "Charts + local AI insights",
    card_symptom_title: "Symptom Check",
    card_symptom_desc: "Is this symptom from my medicine?",
    card_safety_title: "Safety Audit",
    card_safety_desc: "Interaction + duplicate check",
    card_photo_title: "Analyze by Photo",
    card_photo_desc: "Photograph a medicine box to analyze it",
    card_calendar_title: "Calendar & Reminders",
    card_calendar_desc: "Take doses on time",
    badge_soon: "Coming soon",

    chat_hint: 'Example: "Can I take Coumadin and Nurofen together?"',
    chat_placeholder: "Ask a question about your medicines…",
    chat_send: "Send",
    chat_preparing: "Preparing answer…",
    chat_sources_label: "Sources:",
    interaction_title: "⚠ Interaction Warning",
    interaction_body: (drugs: string) =>
      `Your question involves ${drugs} together. Read the answer below carefully and consult your pharmacist or doctor for certainty.`,
    interaction_and: "and",

    meds_loading: "Loading…",
    meds_empty: "Your medicine cabinet is empty.",
    meds_chunks: "chunks",

    settings_server_label: "Server Address",
    settings_save: "Save",
    settings_test: "Test Connection",
    settings_testing: "Testing connection…",
    settings_ok: "✓ Connected, medicine cabinet ready.",
    settings_ok_no_index: "✓ Server reached, but index not loaded yet.",
    settings_error: (msg: string) => `✗ Connection error: ${msg}`,
    settings_note: (url: string) =>
      `Since the backend and web app run on the same computer, the default address (${url}) is usually enough.`,

    unknown_error: "An unknown error occurred.",

    guide_header_title: "Medicine Guide",
    guide_header_subtitle: "Local assistant",
    guide_badge_local: "Local · Private · On-device",
    guide_nav_group_main: "MAIN",
    guide_nav_panel: "Dashboard",
    guide_nav_profile: "My Profile",
    guide_nav_guide: "Medicine Guide",
    guide_nav_my_meds: "My Medicines",
    guide_nav_qa: "Q&A",
    guide_nav_group_track: "TRACK",
    guide_nav_notes: "Notes & Comments",
    guide_nav_analysis: "Analysis",
    guide_nav_symptom: "Symptom Check",
    guide_nav_calendar: "Calendar",
    guide_nav_side_effects: "Side Effect Log",
    guide_nav_group_safety: "SAFETY",
    guide_nav_interactions: "Interactions",
    guide_nav_interactions_sub: "Scan drug pairs",
    guide_nav_polypharmacy: "Polypharmacy",
    guide_nav_polypharmacy_sub: "Duplicates & report",

    panel_search_placeholder: "Ask a question about a medicine…",
    panel_security_prefix: "Safety status:",
    risk_high: "High risk",
    risk_medium: "Medium risk",
    risk_low: "Low risk",
    panel_security_summary: (drugs: number, interactions: number, dupes: number) =>
      `${drugs} medicines · ${interactions} interactions · ${dupes} duplicate ingredients`,
    panel_today_title: "Today's medications",
    panel_today_empty: "You haven't added any dose times yet.",
    panel_today_cta: "Add times from My Medicines →",
    panel_loading: "Loading…",

    soon_body: "This feature is coming soon.",

    interactions_title: "Drug Interactions",
    interactions_empty: "No known interaction found among your cabinet's medicines.",

    polypharmacy_title: "Duplicate Active Ingredients",
    polypharmacy_empty: "No two medicines in your cabinet share the same active ingredient.",

    my_meds_title: "My Medicines",
    my_meds_time_label: "Dose times (comma-separated, e.g. 08:00, 20:00)",
    my_meds_save: "Save",
    my_meds_saved: "Saved ✓",

    symptom_title: "Could what you're feeling be a side effect of your medicines?",
    symptom_subtitle: (link: string) =>
      `Type your symptom; it's checked against the side-effect sections of the medicines in your ${link}. Runs entirely on-device.`,
    symptom_placeholder: "e.g. feeling nauseous",
    symptom_check_button: "Check",
    symptom_checking: "Checking…",
    symptom_examples: ["feeling dizzy", "feeling nauseous", "itching and rash", "heart palpitations"],
    symptom_result_prefix: (symptom: string) =>
      `"${symptom}" may overlap with the side effects listed for these of your medicines:`,
    symptom_no_match: (symptom: string) =>
      `"${symptom}" wasn't found in the side-effect sections of your cabinet's medicines.`,
    symptom_direct_match: "direct match",
    symptom_related_match: "possible match",
    symptom_save_to_log: "Save to Log",
    symptom_saved_to_log: "Saved to log ✓",
    symptom_checked_drugs: (drugs: string) => `Medicines checked: ${drugs}.`,
    symptom_disclaimer:
      "This is not a diagnosis — only information based on the leaflet. Only your doctor can determine the cause of a symptom or whether to change your medicine.",

    log_title: "Side Effect Log",
    log_empty: "No side effect entries logged yet.",
    log_remove: "Remove",

    notes_today_title: "Today's Usage Status",
    notes_status_aldim: "Taken",
    notes_status_atladim: "Skipped",
    notes_status_gecikti: "Delayed",
    notes_status_sorun: "Problem",
    notes_add_title: "Add a Note",
    notes_drug_label: "Medicine",
    notes_rating_label: "Satisfaction (1-5)",
    notes_severity_label: "Severity (1-5)",
    notes_comment_placeholder: "Your note about this medicine…",
    notes_add_button: "Add",
    notes_list_title: "My Notes",
    notes_list_empty: "You haven't added any notes yet.",
    notes_author_label: "Written by",
    notes_author_self: "You",

    profile_title: "My Profile",
    profile_add_title: "Add New Profile",
    profile_name_label: "Full Name",
    profile_age_label: "Age",
    profile_gender_label: "Gender",
    profile_gender_kadin: "Female",
    profile_gender_erkek: "Male",
    profile_conditions_label: "Conditions (comma-separated)",
    profile_allergies_label: "Allergies (comma-separated)",
    profile_note_label: "Note",
    profile_add_button: "Add",
    profile_list_empty: "No profiles added yet.",
    profile_no_conditions: "No known conditions",
    profile_no_allergies: "No known allergies",

    analysis_header_title: "Usage & side-effect overview",
    analysis_header_subtitle:
      "Summary charts generated from your medication plan, usage notes, side effect log and comments. The AI summary runs entirely on a local model; not medical advice.",
    analysis_ai_button: "AI Summary",
    analysis_ai_loading: "Summarizing…",
    analysis_stat_plan: "Medication Plan",
    analysis_stat_side_effect: "Side Effects",
    analysis_stat_usage_note: "Usage Notes",
    analysis_stat_comment: "Comments",
    analysis_stat_severity: "Avg. Severity",
    analysis_stat_rating: "Avg. Rating",
    analysis_chart_title: "Daily usage status",
    analysis_chart_empty: "No usage entries yet. Mark today's status from Notes & Comments.",

    tab_login: "Log In",
    login_title: "Log In",
    login_tc_label: "National ID No.",
    login_password_label: "Password",
    login_submit: "Log In",
    login_forgot_password: "Forgot password?",
    login_forgot_password_info:
      "This is a fully local demo account — there's no recovery email/SMS server. If you forgot your password, you can just register again.",
    login_switch_to_register: "Don't have an account? Register",
    login_switch_to_login: "Already have an account? Log in",
    login_error_not_found: "No account found with this National ID number.",
    login_error_wrong_password: "Incorrect password.",
    login_error_invalid_tc: "Enter a valid National ID number (11 digits).",
    login_error_weak_password: "Password must be at least 4 characters.",
    login_error_mismatch: "Passwords don't match.",
    login_success_message: "Logged in successfully.",
    register_title: "Register",
    register_confirm_label: "Confirm Password",
    register_submit: "Register",
    register_success_message: "Registered successfully! You can log in now.",
    login_welcome: (tc: string) => `Welcome. (ID: ${tc.slice(0, 3)}••••••${tc.slice(-2)})`,
    login_logout: "Log Out",
    login_local_note: "This information is stored only on your device and never sent to a server.",
  },
} as const;

type Dictionary = typeof dictionaries.tr;

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(KEY);
  return stored === "en" ? "en" : "tr";
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  function setLanguage(lang: Language) {
    localStorage.setItem(KEY, lang);
    setLanguageState(lang);
  }

  const value = useMemo(
    () => ({ language, setLanguage, t: dictionaries[language] }),
    [language]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}
