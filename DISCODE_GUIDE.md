# Discode 사용 가이드

Slack에서 `home-calculator` 프로젝트를 모니터링하고 제어하는 방법

---

## 🎯 설정 정보

- **Slack 채널**: `#home-calculator-claude`
- **프로젝트**: `home-calculator`
- **에이전트**: Claude Code

---

## 📱 방법 1: Slack 모바일에서 제어 (추천)

### 셋업
1. Slack 앱 열기
2. `#home-calculator-claude` 채널 찾기
3. 채널 오픈

### 사용
메시지로 Claude Code에 지시사항 전송:

```
@discode README 파일 생성해줘
@discode TypeScript 에러 고쳐줘
@discode 폴더 구조 설명해줘
@discode home-calculator 배포해줘
```

---

## 💻 방법 2: 맥 터미널에서 사용

### Claude Code 실행
```bash
cd /Users/user/study/home-calculator
code .
```

- 자동으로 Slack에 연결됨
- 실시간으로 `#home-calculator-claude`에 업로드

---

## 🛠️ 방법 3: Discode 명령어

### 프로젝트 목록 확인
```bash
discode list
```

### Tmux 세션 보기
```bash
discode attach
```

### 특정 프로젝트 중지
```bash
discode stop home-calculator
```

---

## 📊 상태 확인

### Slack 채널 확인
- `#home-calculator-claude` 채널에서 실시간 로그 확인

### 설정 확인
```bash
cat ~/.discode/config.json
```

---

## ⚡ 자주 사용하는 패턴

### 코드 리뷰
```
@discode HomeForm.tsx 코드 검토해줘
```

### 버그 수정
```
@discode 금액 입력 버그 고쳐줘
```

### 기능 추가
```
@discode 모바일 반응형 디자인 추가해줘
```

### 배포
```
@discode 프로덕션 배포해줘
```

---

## 🔄 Discode 재설정 필요시

```bash
# 전체 재설정
rm -rf ~/.discode
discode onboard --platform slack

# Slack 토큰만 업데이트
discode config --platform slack \
  --slack-bot-token YOUR_BOT_TOKEN \
  --slack-app-token YOUR_APP_TOKEN
```

---

## 📝 참고사항

- Slack 메시지는 자동으로 Claude Code로 전송됨
- 모바일에서도 실시간 모니터링 가능
- tmux 세션은 백그라운드에서 계속 실행됨
- 새 터미널 열 때마다 자동으로 Slack과 연동
