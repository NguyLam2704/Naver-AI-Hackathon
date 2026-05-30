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
        const { processor, source, audioContext, stream } = mediaRecorderRef.current;
        
        if (processor) {
          processor.disconnect();
          processor.onaudioprocess = null;
        }
        if (source) {
          source.disconnect();
        }
        if (stream) {
          stream.getTracks().forEach(t => t.stop());
        }
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      } catch (err) {
        console.warn("Cleanup error:", err);
      }
      mediaRecorderRef.current = null;
    }

    if (wsRef.current) {
      try {
        if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
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
    // Đảm bảo cleanup trước khi bắt đầu session mới
    cleanup();

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
      
      const socket = new WebSocket(socketUrl, ["token", DEEPGRAM_API_KEY]);
      wsRef.current = socket;

      socket.onopen = async () => {
        // Nếu socket đã thay đổi (do user bấm stop/start nhanh), hủy setup này
        if (wsRef.current !== socket) {
            console.log("🔌 Socket changed, aborting setup");
            socket.close();
            return;
        }

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
          const AudioContext = window.AudioContext || window.webkitAudioContext;
          const audioContext = new AudioContext({ sampleRate: 16000 });

          // Resume AudioContext if suspended (browser policy)
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }

          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);
          
          processor.onaudioprocess = (e) => {
            // Chỉ gửi data nếu socket này vẫn là socket hiện tại và đang mở
            if (wsRef.current === socket && socket.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Chuyển Float32 sang Int16 (PCM linear16)
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              socket.send(pcmData.buffer);
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
          };
          
          // KeepAlive cho Flux
          keepAliveIntervalRef.current = setInterval(() => {
            if (wsRef.current === socket && socket.readyState === WebSocket.OPEN) {
              socket.send(new Uint8Array(0));
            }
          }, 3000);
          
          setIsRecording(true);
          console.log("🎤 Recording started");
          
        } catch (err) {
          console.error("❌ Microphone error:", err);
          alert("Không thể truy cập microphone: " + err.message);
          cleanup();
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // console.log("📩", data.event, ":", data.transcript);
          
          const transcript = data.transcript?.trim();
          
          if (!transcript) return;
          
          // Xử lý theo loại event
          switch (data.event) {
            case "StartOfTurn":
            case "Update":
            case "EagerEndOfTurn":
            case "TurnResumed":
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
              // console.log("ℹ️ Other event:", data.event);
              break;
          }
          
        } catch (e) {
          console.error("❌ Error parsing JSON:", e);
        }
      };

      socket.onerror = (err) => {
        console.error("❌ WebSocket Error:", err);
        if (socket.readyState !== WebSocket.CLOSED) {
            // alert("Lỗi kết nối Deepgram. Kiểm tra API Key!");
        }
        cleanup();
      };

      socket.onclose = (event) => {
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

  const handleVoiceToggle = useCallback(() => {
    if (isRecording) stopRecording();
    else startRecording();
    return true;
  }, [isRecording, startRecording, stopRecording]);

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
    clearTranscript: useCallback(() => {
      setFinalTranscript("");
      setInterimTranscript("");
    }, [])
  };
};