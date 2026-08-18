import { useState } from "react";
import * as auth from "../lib/auth";
import { useLanguage } from "../lib/i18n";

type Mode = "login" | "register";

interface LoginScreenProps {
  onLoggedIn: () => void;
}

export default function LoginScreen({ onLoggedIn }: LoginScreenProps) {
  const { t } = useLanguage();
  const sessionTc = auth.getSessionTcNo();

  const [mode, setMode] = useState<Mode>("login");
  const [tcNo, setTcNo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [showForgot, setShowForgot] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loggedInTc, setLoggedInTc] = useState(sessionTc);

  if (loggedInTc) {
    return (
      <div className="guide-panel">
        <div className="notes-card login-card">
          <p>{t.login_welcome(loggedInTc)}</p>
          <button
            className="home-cta home-cta--secondary"
            onClick={() => {
              auth.logout();
              setLoggedInTc(null);
            }}
          >
            {t.login_logout}
          </button>
        </div>
      </div>
    );
  }

  async function handleLogin() {
    setError(null);
    setInfo(null);
    setLoading(true);
    try {
      const result = await auth.login(tcNo, password);
      if (result.ok) {
        setLoggedInTc(tcNo);
        onLoggedIn();
      } else {
        setError(result.error === "not_found" ? t.login_error_not_found : t.login_error_wrong_password);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    setError(null);
    setInfo(null);
    if (password !== confirmPassword) {
      setError(t.login_error_mismatch);
      return;
    }
    setLoading(true);
    try {
      const result = await auth.register(tcNo, password);
      if (result.ok) {
        setInfo(t.register_success_message);
        setMode("login");
        setPassword("");
        setConfirmPassword("");
      } else {
        setError(result.error === "invalid_tc" ? t.login_error_invalid_tc : t.login_error_weak_password);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="guide-panel">
      <div className="notes-card login-card">
        <h2 className="guide-panel__title">{mode === "login" ? t.login_title : t.register_title}</h2>

        <div className="notes-form">
          <label className="login-field">
            {t.login_tc_label}
            <input
              type="text"
              inputMode="numeric"
              maxLength={11}
              value={tcNo}
              onChange={(e) => setTcNo(e.target.value.replace(/\D/g, ""))}
            />
          </label>

          <label className="login-field">
            {t.login_password_label}
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>

          {mode === "register" && (
            <label className="login-field">
              {t.register_confirm_label}
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>
          )}

          {error && <p className="chat-screen__error">{error}</p>}
          {info && <p className="login-info">{info}</p>}

          <button
            className="home-cta home-cta--primary"
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading || !tcNo || !password}
          >
            {mode === "login" ? t.login_submit : t.register_submit}
          </button>

          {mode === "login" && (
            <>
              <button className="login-link" onClick={() => setShowForgot((v) => !v)}>
                {t.login_forgot_password}
              </button>
              {showForgot && <p className="login-info">{t.login_forgot_password_info}</p>}

              <button
                className="home-cta home-cta--secondary"
                onClick={() => {
                  setMode("register");
                  setError(null);
                  setInfo(null);
                }}
              >
                {t.register_title}
              </button>
            </>
          )}

          {mode === "register" && (
            <button
              className="login-link"
              onClick={() => {
                setMode("login");
                setError(null);
                setInfo(null);
              }}
            >
              {t.login_switch_to_login}
            </button>
          )}

          <p className="login-note">{t.login_local_note}</p>
        </div>
      </div>
    </div>
  );
}
