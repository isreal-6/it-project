import React, { useState } from "react";  // ✅ 추가
import { useNavigate } from "react-router-dom";
import "./SignupPage.css";
import { signUpWithEmail } from "../services/auth";

function SignupPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");  // ✅ 비밀번호 상태
  const [passwordConfirm, setPasswordConfirm] = useState("");  // ✅ 비밀번호 확인 상태
  const [passwordError, setPasswordError] = useState(false);  // ✅ 에러 표시 여부 (기존)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState(""); // 비밀번호 에러 메시지
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [emailError, setEmailError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSubmitError("");
    setEmailError("");
    setPasswordErrorMsg("");

    if (!email || !password || !passwordConfirm || !name) {
      setSubmitError("모든 필드를 입력해주세요.");
      return;
    }

    // 간단한 이메일 형식 체크
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSubmitError("유효한 이메일을 입력해주세요.");
      return;
    }

    if (password !== passwordConfirm) {
      setPasswordError(true);       // 에러 상태로 전환
      setPasswordErrorMsg("비밀번호가 일치하지 않습니다.");
      setPasswordConfirm("");       // 비밀번호 확인 입력값 초기화
      return;                       // 이동 중단
    }

    try {
      setSubmitting(true);
      await signUpWithEmail(email, password, name);
      navigate("/");
    } catch (err) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setEmailError("이미 사용 중인 이메일입니다.");
      } else if (code === "auth/invalid-email") {
        setEmailError("유효한 이메일을 입력해주세요.");
      } else if (code === "auth/weak-password") {
        setPasswordError(true);
        setPasswordErrorMsg("비밀번호는 6자리 이상이어야 합니다.");
      } else if (code === "auth/missing-password") {
        setPasswordError(true);
        setPasswordErrorMsg("비밀번호를 입력해주세요.");
      } else {
        setSubmitError("회원가입 중 오류가 발생했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="BackgroundSign">
      <div className="parent">
        <div className="signup-wrapper">
          <h2 className="welcometext">회원가입</h2>

          <form 
            style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} 
            onSubmit={handleSubmit}
          >
            <div className="id">
              <input type="text" placeholder="아이디" />
            </div> 

            <div className="password">
              <input 
                type="password" 
                placeholder="비밀번호" 
                value={password} 
                onChange={(e) => {
                  setPassword(e.target.value);
                  setPasswordError(false);  // 입력 시 에러 메시지 제거
                  setPasswordErrorMsg("");
                }} 
              />
              {passwordErrorMsg && (
                <div style={{ color: 'red', fontSize: 14 }}>{passwordErrorMsg}</div>
              )}
            </div>

            <div className="password1">
              <input 
                type="password" 
                placeholder={passwordError ? "비밀번호가 일치하지 않습니다." : "비밀번호 확인"} 
                value={passwordConfirm} 
                onChange={(e) => {
                  setPasswordConfirm(e.target.value);
                  setPasswordError(false);  // 입력 시 에러 메시지 제거
                }} 
                style={passwordError ? { color: 'red' } : {}}  // 에러 시 빨간 글씨
              />
            </div>

            <div className="signup-name">
              <input 
                type="text" 
                placeholder="이름" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="email">
              <input 
                type="email" 
                placeholder="이메일" 
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
              />
              {emailError && (
                <div style={{ color: 'red', fontSize: 14 }}>{emailError}</div>
              )}
            </div>

            {submitError && (
              <div style={{ color: 'red', fontSize: 14 }}>{submitError}</div>
            )}

            <div>
              <button type="submit" className="signbutton" disabled={submitting}>
                {submitting ? "처리 중..." : "회원가입 완료"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;