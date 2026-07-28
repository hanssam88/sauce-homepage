# TODO

- [x] A/B/C 프리미엄 홈페이지 비교 시안 설계 및 구현

## 핸드오프 블록

2026-07-28 · `codex/premium-homepage-concepts-work` · 다음 도구: Codex

- A/B/C 비교 시안 구현 완료:
  `concepts/a-editorial/`, `concepts/b-cinematic/`, `concepts/c-gallery/`
- Playwright 전체 계약 테스트: 14/14 통과
- 동일 조건 비교 캡처: 9개 생성
  (`artifacts/screenshots/`, 데스크톱 1440×900·모바일 390×844)
- `./scripts/verify-root-untouched.sh` 통과: 루트 `index.html`과 `assets/` 변경 없음
- 원격 push·PR 없음
- 다음 단계: 사용자가 A/B/C 방향을 선택한 뒤 선택안만 운영 수준으로 확장
