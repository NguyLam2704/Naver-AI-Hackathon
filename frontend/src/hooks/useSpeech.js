import React, { useState, useRef, useEffect } from 'react';
import { recognition } from '../utils/chatHelpers';

export const useSpeech = (handleSend, stagedFiles) => {
  const [input, setInput] = useState('');
  const inputRef = React.useRef(input);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false); // Track recording state reliably
  const silenceTimeoutRef = useRef(null);

  // Đồng bộ inputRef
  useEffect(() => {
    inputRef.current = input;
  }, [input]);

  // Đồng bộ isRecordingRef
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

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
      try {
        recognition.start();
      } catch (error) {
        // Ignore error if recognition is already started
        console.warn('Recognition already started or error:', error);
      }
      
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
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setIsRecording(false);
        }
      };
      recognition.onend = () => {
        clearSilenceTimeout();
        // Use ref to get current recording state, not closure value
        if (isRecordingRef.current) {
          // Restart if still recording (handle auto-stop)
          try {
            recognition.start();
          } catch (error) {
            console.warn('Cannot restart recognition:', error);
            setIsRecording(false);
          }
        }
      };
    } else {
      // Clear all event handlers when stopping
      recognition.onresult = null;
      recognition.onspeechend = null;
      recognition.onerror = null;
      recognition.onend = null;
      
      try {
        recognition.stop();
      } catch (error) {
        console.warn('Recognition already stopped:', error);
      }
      clearSilenceTimeout();
    }
    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch (error) {
          // Ignore
        }
      }
      clearSilenceTimeout();
    };
  }, [isRecording, stagedFiles, handleSend]); 

  const handleVoiceToggle = () => {
    if (!recognition) {
        console.error("Trình duyệt của bạn không hỗ trợ Speech-to-Text.");
      return false; // (SỬA) Trả về false nếu thất bại
    }
    setIsRecording(!isRecording);
    return true; // (SỬA) Trả về true nếu thành công
  };

  return { input, setInput, isRecording, setIsRecording, handleVoiceToggle, silenceTimeoutRef, inputRef };
};