/**
 * Gemini API 호출 모듈
 * YouTube 동영상 내용을 책의 문장으로 재구성하는 기능
 */

class GeminiAPI {
  constructor() {
    this.API_KEY = 'AIzaSyCaq-loSooOhJzXv_1N1ha5JVwfqV4ipxw';
    this.API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    this.MODEL = 'gemini-1.5-flash';
    this.FALLBACK_MODEL = 'gemini-1.0-pro';
    this.FALLBACK_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent';
    this.YOUTUBE_API_KEY = 'AIzaSyBrc-5zYbIGATxlDWz_DTfZcyH5CSPoaYg'; // YouTube Data API 키
  }

  // YouTube URL에서 비디오 ID 추출
  extractVideoId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  // YouTube Data API로 비디오 정보 가져오기
  async getYouTubeVideoInfo(videoId) {
    try {
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails,statistics&id=${videoId}&key=${this.YOUTUBE_API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`YouTube API 오류: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const video = data.items[0];
        return {
          title: video.snippet.title,
          description: video.snippet.description,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          duration: video.contentDetails.duration,
          viewCount: video.statistics.viewCount,
          likeCount: video.statistics.likeCount
        };
      } else {
        throw new Error('비디오 정보를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('YouTube Data API 호출 실패:', error);
      throw error;
    }
  }

  // YouTube URL을 책의 문장으로 재구성하는 요청
  async convertYouTubeToBookContent(youtubeUrl) {
    try {
      console.log('🎥 YouTube: 비디오 정보 수집 시작');
      
      // 비디오 ID 추출
      const videoId = this.extractVideoId(youtubeUrl);
      if (!videoId) {
        throw new Error('유효하지 않은 YouTube URL입니다.');
      }
      
      // YouTube Data API로 비디오 정보 가져오기
      const videoInfo = await this.getYouTubeVideoInfo(videoId);
      console.log('🎥 YouTube: 비디오 정보 수집 완료', videoInfo);
      
      // Gemini API로 분석 요청
      const prompt = `다음 YouTube 비디오 정보를 바탕으로 요약해줘:

제목: ${videoInfo.title}
채널: ${videoInfo.channelTitle}
업로드 날짜: ${videoInfo.publishedAt}
조회수: ${videoInfo.viewCount}
좋아요 수: ${videoInfo.likeCount}
설명: ${videoInfo.description.substring(0, 500)}...

이 영상을 책의 문장으로 활용하게 충분한 분량으로 재구성 해줘. 해당 콘텐츠에 맞는 문체로, 문장의 나열로, 표나 카테고리 구분을 짓지 않고, 소제목도 필요없어. 가능하다면 여러 문단으로 구성해줘. 만약 댓글이 있다면 댓글내용도 요약해서 마지막에 문장 하나로 구성해줘. 내용 앞뒤에 답변도 절대 달지 말아줘.`;

      const response = await this.callAPITextOnly(prompt);
      return response;
    } catch (error) {
      console.error('Gemini API 호출 실패:', error);
      return null;
    }
  }

  // Gemini API 텍스트 전용 호출
  async callAPITextOnly(prompt, retryCount = 0) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        // 429 에러 (할당량 초과) 처리
        if (response.status === 429 && retryCount < 3) {
          console.log(`Gemini API 할당량 초과, ${5 * (retryCount + 1)}초 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, 5000 * (retryCount + 1)));
          return this.callAPITextOnly(prompt, retryCount + 1);
        }
        
        throw new Error(`Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Gemini API 응답 구조 확인
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`콘텐츠 차단됨: ${data.promptFeedback.blockReason}`);
      } else {
        throw new Error('Gemini API 응답 형식 오류');
      }
    } catch (error) {
      console.error('Gemini API 호출 실패:', error);
      throw error;
    }
  }

  // Gemini API 비디오 호출 (향후 사용)
  async callAPI(prompt, youtubeUrl) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                fileData: {
                  fileUri: youtubeUrl,
                  mimeType: 'video/mp4'
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      // Gemini API 응답 구조 확인
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`콘텐츠 차단됨: ${data.promptFeedback.blockReason}`);
      } else {
        throw new Error('Gemini API 응답 형식 오류');
      }
    } catch (error) {
      console.error('Gemini API 호출 실패:', error);
      throw error;
    }
  }

  // 스트리밍 응답 처리 (텍스트 전용)
  async callAPIStreaming(prompt, onChunk) {
    try {
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      };

      const response = await fetch(`${this.API_URL}?key=${this.API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API 오류: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const content = data.candidates[0].content.parts[0].text;
        if (onChunk) {
          // 스트리밍 시뮬레이션 (실제 스트리밍은 별도 엔드포인트 필요)
          const chunks = content.split(' ');
          for (const chunk of chunks) {
            onChunk(chunk + ' ');
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }
        return content;
      } else {
        throw new Error('Gemini API 응답 형식 오류');
      }
    } catch (error) {
      console.error('Gemini API 스트리밍 호출 실패:', error);
      throw error;
    }
  }

  // YouTube URL 유효성 검사
  isValidYouTubeUrl(url) {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    return youtubeRegex.test(url);
  }

  // YouTube URL 정규화
  normalizeYouTubeUrl(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    if (match) {
      return `https://www.youtube.com/watch?v=${match[1]}`;
    }
    return url;
  }
}

// 전역 인스턴스 생성
window.geminiAPI = new GeminiAPI();

console.log('Gemini API 모듈 로드 완료');
