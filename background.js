// 백그라운드 서비스 워커
chrome.runtime.onInstalled.addListener(() => {
  console.log('TTS Text Reader 익스텐션이 설치되었습니다.');
  // 초기 아이콘을 ON 상태로 설정
  updateExtensionIcon(true);
});

// 🎨 익스텐션 아이콘 업데이트 함수
function updateExtensionIcon(isEnabled) {
  const iconSuffix = isEnabled ? 'on' : 'off';
  const iconPaths = {
    16: `icon16_${iconSuffix}.png`,
    32: `icon32_${iconSuffix}.png`,
    48: `icon48_${iconSuffix}.png`,
    128: `icon128_${iconSuffix}.png`
  };
  
  // 액션 아이콘 변경
  chrome.action.setIcon({ path: iconPaths }, () => {
    if (chrome.runtime.lastError) {
      console.error('아이콘 변경 실패:', chrome.runtime.lastError);
    } else {
      console.log(`🎨 아이콘 변경 완료: ${isEnabled ? 'ON' : 'OFF'}`);
    }
  });
}

// 익스텐션 아이콘 클릭 시 처리
chrome.action.onClicked.addListener((tab) => {
  console.log('TTS Text Reader 아이콘이 클릭되었습니다.');
  
  // 익스텐션 아이콘의 위치 정보를 가져오기 위해 액션 영역 정보 요청
  chrome.action.getUserSettings().then((settings) => {
    // 현재 탭에서 content script와 통신 (아이콘 위치 정보 포함)
    chrome.tabs.sendMessage(tab.id, { 
      action: 'toggle',
      iconPosition: 'top-right' // 익스텐션 아이콘은 항상 브라우저 우상단에 위치
    }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('Content script가 아직 로드되지 않았습니다.');
      } else if (response && response.success) {
        // 플러그인 상태에 따라 아이콘 변경
        updateExtensionIcon(response.enabled);
      }
    });
  });
});

// 메시지 리스너 (content script와 통신)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    // content script에서 선택된 텍스트 요청
    chrome.tabs.sendMessage(sender.tab.id, { action: 'getSelectedText' }, (response) => {
      sendResponse(response);
    });
    return true; // 비동기 응답을 위해 true 반환
  }
  
  if (request.action === 'speak') {
    // TTS 기능 구현 예정
    console.log('TTS 기능이 요청되었습니다:', request.text);
    sendResponse({ success: true });
  }
  
  if (request.action === 'updateIcon') {
    // 플러그인 상태 변경 시 아이콘 업데이트
    updateExtensionIcon(request.enabled);
    sendResponse({ success: true });
  }
});
