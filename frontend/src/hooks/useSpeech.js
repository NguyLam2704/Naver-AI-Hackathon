import { useState, useRef, useCallback, useMemo, useEffect } from "react";

export const useSpeech = () => {
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const inputRef = useRef("");
  const keepAliveIntervalRef = useRef(null);

  const input = useMemo(() => {
    return finalTranscript + (interimTranscript ? " " + interimTranscript : "");
  }, [finalTranscript, interimTranscript]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const cleanup = useCallback(() => {
    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current);
      keepAliveIntervalRef.current = null;
    }

    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.stop) {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        console.warn("Cleanup error:", err);
      }
      mediaRecorderRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.close();
        }
      } catch (err) {
        console.warn("WebSocket close error:", err);
      }
      wsRef.current = null;
    }
    
    setInterimTranscript("");
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // ⚠️ QUAN TRỌNG: Thay YOUR_DEEPGRAM_API_KEY bằng key thật của bạn
      const DEEPGRAM_API_KEY = process.env.REACT_APP_DEEPGRAM_API_KEY;
      
      if (!DEEPGRAM_API_KEY || DEEPGRAM_API_KEY === "YOUR_DEEPGRAM_API_KEY") {
        throw new Error("⚠️ Chưa cấu hình Deepgram API Key!");
      }

      // Cấu hình cho model Flux (streaming conversational)
      const params = new URLSearchParams({
        model: "flux-general-en",    // Hoặc flux-general-vi cho tiếng Việt
        encoding: "linear16",        // PCM linear16
        sample_rate: "16000",        // 16kHz
      });

      const socketUrl = `wss://api.deepgram.com/v2/listen?${params.toString()}`;
      
      wsRef.current = new WebSocket(socketUrl, ["token", DEEPGRAM_API_KEY]);

      wsRef.current.onopen = async () => {
        console.log("🟢 Connected to Deepgram Flux");
        
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            audio: {
              channelCount: 1,         // Mono
              sampleRate: 16000,       // 16kHz
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          
          // Tạo AudioContext để chuyển đổi sang PCM linear16
          const audioContext = new AudioContext({ sampleRate: 16000 });
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Chuyển Float32 sang Int16 (PCM linear16)
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              wsRef.current.send(pcmData.buffer);
            }
          };
          
          source.connect(processor);
          processor.connect(audioContext.destination);
          
          // Lưu để cleanup
          mediaRecorderRef.current = {
            stream,
            audioContext,
            processor,
            source,
            stop: () => {
              try {
                processor.disconnect();
                source.disconnect();
                // Chỉ đóng nếu chưa đóng
                if (audioContext.state !== 'closed') {
                  audioContext.close();
                }
                stream.getTracks().forEach(t => t.stop());
              } catch (err) {
                console.warn("Cleanup warning:", err);
              }
            },
            state: "recording"
          };
          
          // KeepAlive cho Flux
          keepAliveIntervalRef.current = setInterval(() => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(new Uint8Array(0));
            }
          }, 8000);
          
          setIsRecording(true);
          console.log("🎤 Recording started");
          
        } catch (err) {
          console.error("❌ Microphone error:", err);
          alert("Không thể truy cập microphone: " + err.message);
          cleanup();
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          console.log("📩", data.event, ":", data.transcript);
          
          const transcript = data.transcript?.trim();
          
          if (!transcript) return;
          
          // Xử lý theo loại event
          switch (data.event) {
            case "StartOfTurn":
              // Bắt đầu câu mới
              console.log("🎬 Start of turn");
              setInterimTranscript(transcript);
              break;
              
            case "Update":
              // Cập nhật liên tục (interim results)
              setInterimTranscript(transcript);
              break;
              
            case "EagerEndOfTurn":
              // Deepgram nghĩ câu đã kết thúc (nhưng chưa chắc)
              console.log("⏸️ Eager end (might resume)");
              setInterimTranscript(transcript);
              break;
              
            case "TurnResumed":
              // Người dùng nói tiếp sau khi tạm dừng
              console.log("▶️ Turn resumed");
              setInterimTranscript(transcript);
              break;
              
            case "EndOfTurn":
              // KẾT THÚC câu chắc chắn (confidence cao)
              console.log("✅ End of turn - Final:", transcript);
              setFinalTranscript((prev) => {
                const newText = prev ? prev + " " + transcript : transcript;
                return newText;
              });
              setInterimTranscript("");
              break;
              
            default:
              // Các event khác (nếu có)
              console.log("ℹ️ Other event:", data.event);
          }
          
        } catch (e) {
          console.error("❌ Error parsing JSON:", e);
        }
      };

      wsRef.current.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        alert("Lỗi kết nối Deepgram. Kiểm tra API Key!");
        cleanup();
      };

      wsRef.current.onclose = (event) => {
        console.log("🔴 WebSocket Closed:", event.code, event.reason);
        if (event.code === 1008) {
          alert("❌ API Key không hợp lệ!");
        }
        setIsRecording(false);
      };

    } catch (err) {
      console.error("❌ Error starting recording:", err);
      alert("Lỗi: " + err.message);
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    // Dừng audio processor trước
    if (mediaRecorderRef.current?.stop) {
      mediaRecorderRef.current.stop();
    }
    
    // Gửi CloseStream cho Deepgram
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "CloseStream" }));
      
      // Đợi 500ms để nhận kết quả cuối
      setTimeout(() => {
        cleanup();
      }, 500);
    } else {
      cleanup();
    }
  }, [cleanup]);

  const handleVoiceToggle = () => {
    if (isRecording) stopRecording();
    else startRecording();
  };

  useEffect(() => {
    return () => cleanup();
  }, [cleanup]);

  return { 
    input, 
    setInput: setFinalTranscript,
    isRecording, 
    setIsRecording, 
    handleVoiceToggle,
    inputRef,
    clearTranscript: () => {
      setFinalTranscript("");
      setInterimTranscript("");
    }
  };
};