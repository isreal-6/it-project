import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";
import { signInWithEmail } from "../services/auth";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError("");
    setPasswordError("");
    setSubmitError("");

    if (!email || !password) {
      if (!email) setEmailError("이메일을 입력해주세요.");
      if (!password) setPasswordError("비밀번호를 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      await signInWithEmail(email, password);
      navigate("/home");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/invalid-email") {
        setEmailError("유효한 이메일을 입력해주세요.");
      } else if (code === "auth/user-disabled") {
        setEmailError("비활성화된 계정입니다. 관리자에게 문의하세요.");
      } else if (code === "auth/user-not-found") {
        setEmailError("등록되지 않은 이메일입니다.");
      } else if (code === "auth/wrong-password") {
        setPasswordError("비밀번호가 올바르지 않습니다.");
      } else {
        setSubmitError("로그인 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="leftbackground">
      <div className="login-container">
        <div className="teamName">CosMove</div>
        <div className="logtext">로그인</div>

        <form onSubmit={handleSubmit}>
          <div className="emailin">
            <input
              type="email"
              placeholder="이메일을 입력하세요"
              className="inputfield"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
            />
          </div>
          {emailError && (
            <div style={{ color: 'red', fontSize: 14 }}>{emailError}</div>
          )}

          <div className="numberin">
            <input
              type="password"
              placeholder="비밀번호를 입력하세요"
              className="inputfield"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPasswordError(""); }}
            />
          </div>
          {passwordError && (
            <div style={{ color: 'red', fontSize: 14 }}>{passwordError}</div>
          )}

          <div className="login-options">
            <label className="keep-logged-in">
              <input type="checkbox" className="checkbox" />
              <span>로그인 유지</span>
            </label>
            <button type="button" className="numberfind">
              비밀번호 찾기
            </button>
          </div>

          {submitError && (
            <div style={{ color: 'red', fontSize: 14, marginTop: 8 }}>{submitError}</div>
          )}

          <button type="submit" className="LoginButton" disabled={submitting}>
            {submitting ? "처리 중..." : "로그인"}
          </button>

          <div className="bottom-links">
            <span
              className="signupbutton"
              onClick={() => navigate("/signup")}
            >
              회원 가입
            </span>
            <span className="emailfind">이메일 찾기</span>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;