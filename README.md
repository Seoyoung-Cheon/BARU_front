# Baru App

React Native + Expo로 구성된 모바일 앱 프로젝트입니다.

## 시작하기

### 필수 요구사항
- Node.js (v16 이상)
- npm 또는 yarn
- Expo CLI (`npm install -g expo-cli`)

### 설치 및 실행

1. 의존성 설치:
```bash
npm install
```

2. 앱 실행:
```bash
npm start
```

3. 플랫폼별 실행:
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`

## 프로젝트 구조

```
BARU/
├── App.js              # 메인 앱 컴포넌트
├── app.json            # Expo 설정
├── package.json        # 프로젝트 의존성
├── babel.config.js     # Babel 설정
└── assets/             # 이미지 및 리소스 파일
```

## 개발 가이드

앱을 개발하려면 `App.js` 파일을 수정하세요. 컴포넌트는 `src/components/` 디렉토리에 추가할 수 있습니다.

