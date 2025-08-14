// 백그라운드 서비스 워커
chrome.runtime.onInstalled.addListener(() => {
  console.log('TTS Text Reader 익스텐션이 설치되었습니다.');
});

// 익스텐션 아이콘 클릭 시 처리
chrome.action.onClicked.addListener((tab) => {
  console.log('TTS Text Reader 아이콘이 클릭되었습니다.');
  
  // 현재 탭에서 content script와 통신
  chrome.tabs.sendMessage(tab.id, { action: 'toggle' }, (response) => {
    if (chrome.runtime.lastError) {
      console.log('Content script가 아직 로드되지 않았습니다.');
    }
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
});
