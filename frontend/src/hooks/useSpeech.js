import { useState, useRef, useCallback, useMemo, useEffect } from "react";

export const useSpeech = () => {
  // 1. State lưu trữ văn bản
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const wsRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const processorRef = useRef(null);
  const audioCtxRef = useRef(null);
  
  const inputRef = useRef(""); 
  const getApiBaseUrl = () => {
  // 1. Ưu tiên lấy từ biến môi trường (.env)
  
  if (process.env.REACT_APP_API_URL) {
    const url = new URL(process.env.REACT_APP_API_URL);
    const hostAndPath = url.host + url.pathname;
    return hostAndPath;
  }

  // 2. Nếu không có biến môi trường, tự động detect
  if (window.location.hostname === 'localhost') {
    return 'localhost:8000/api'; // Local backend
  }
  
  // 3. Trên Vercel production (cùng domain)
  return `${window.location.host}/api`; 
};
  // 3. Gộp văn bản hiển thị
  const input = useMemo(() => {
    return finalTranscript + (interimTranscript ? " " + interimTranscript : "");
  }, [finalTranscript, interimTranscript]);

  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((t) => t.stop());
      mediaStreamRef.current = null;
    }
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    
    setInterimTranscript("");
    setIsRecording(false);
  }, []);

  const startRecording = useCallback(async () => {
    try {
      // Lưu ý: Đổi URL này thành URL backend của bạn
      
      const socketUrl = `wss://${getApiBaseUrl()}/ws/deepgram`;
      wsRef.current = new WebSocket(socketUrl);
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => console.log("🟢 WS Connected");
      wsRef.current.onclose = () => console.log("🔴 WS Closed");
      wsRef.current.onerror = (err) => console.error("WS Error:", err);

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.is_final) {
            setFinalTranscript((prev) => {
                return prev ? prev + " " + data.text : data.text;
            });
            setInterimTranscript(""); 
          } else {
            setInterimTranscript(data.text);
          }
        } catch (e) {
          console.error("Error parsing JSON:", e);
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            channelCount: 1, 
            sampleRate: 16000
        } 
      });
      mediaStreamRef.current = stream;

      const audioCtx = new AudioContext({ sampleRate: 16000 });
      audioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const processor = audioCtx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;

      processor.onaudioprocess = (e) => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

        const float32 = e.inputBuffer.getChannelData(0);
        const buffer = new ArrayBuffer(float32.length * 2);
        const view = new DataView(buffer);

        for (let i = 0; i < float32.length; i++) {
          let s = Math.max(-1, Math.min(1, float32[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
        }

        wsRef.current.send(buffer);
      };

      source.connect(processor);
      processor.connect(audioCtx.destination);
      
      setIsRecording(true);

    } catch (err) {
      console.error("Error starting recording:", err);
      alert("Không thể truy cập Microphone.");
      cleanup();
    }
  }, [cleanup]);

  const stopRecording = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ text: "flush" }));
    }
    cleanup();
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
    inputRef 
  };
};