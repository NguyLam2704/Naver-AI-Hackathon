import React, { useState, useRef, useEffect } from 'react';
import { recognition } from '../utils/chatHelpers';

export const useSpeech = (handleSend, stagedFiles) => {
  const [input, setInput] = useState('');
  const inputRef = React.useRef(input);
  const [isRecording, setIsRecording] = useState(false);
  const silenceTimeoutRef = useRef(null);

  // Đồng bộ inputRef
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // useEffect cho Speech Recognition
  useEffect(() => {
    if (!recognition) return;
    
    const clearSilenceTimeout = () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = null;
      }
    };

    if (isRecording) {
      recognition.start();
      recognition.onresult = (event) => {
        clearSilenceTimeout(); 
        let interim_transcript = '';
        let final_transcript = '';
        for (let i = 0; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                final_transcript += transcript + ' ';
            } else {
                interim_transcript += transcript;
            }
        }
        setInput(final_transcript + interim_transcript);
      };
      
      recognition.onspeechend = () => {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
              console.log("15s im lặng, tự động ngắt...");
              setIsRecording(false); 
              const finalInput = inputRef.current;
              if (finalInput.trim() || stagedFiles.length > 0) {
                  handleSend();
              }
          }, 15000);
      };
      
      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        clearSilenceTimeout();
        setIsRecording(false);
      };
      recognition.onend = () => {
        clearSilenceTimeout();
        setIsRecording(false);
      };
    } else {
      recognition.stop();
      clearSilenceTimeout();
    }
    return () => {
      if (recognition) recognition.stop();
      clearSilenceTimeout();
    };
  }, [isRecording, stagedFiles, handleSend]); 

  const handleVoiceToggle = () => {
    if (!recognition) {
        console.error("Trình duyệt của bạn không hỗ trợ Speech-to-Text.");
      return false; // Trả về false nếu thất bại
    }
    setIsRecording(!isRecording);
    return true; // Trả về true nếu thành công
  };

  return { input, setInput, isRecording, setIsRecording, handleVoiceToggle, silenceTimeoutRef, inputRef };
};

