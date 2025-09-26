import { useState, KeyboardEvent, useRef, useEffect } from "react";

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSend: () => void;
  onTyping: () => void;
  placeholder: string;
  onFocus?: () => void;
  onBlur?: () => void;
  isMobile?: boolean;
}

export function MessageInput({ 
  message, 
  setMessage, 
  onSend, 
  onTyping, 
  placeholder,
  onFocus,
  onBlur,
  isMobile = false
}: MessageInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    onTyping();
  };

  const handleFocus = () => {
    setIsFocused(true);
    onFocus?.();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur?.();
  };

  useEffect(() => {
    // Auto-focus on mobile when component mounts
    if (isMobile) {
      inputRef.current?.focus();
    }
  }, [isMobile]);

  return (
    <div className={`p-4 border-t border-discord-border bg-discord-secondary/50 backdrop-blur-sm ${
      isMobile ? 'safe-area-bottom' : ''
    }`}>
      <div className="flex items-center space-x-3">
        {/* Input field */}
        <div className={`flex-1 relative transition-all duration-300 ${isFocused ? 'transform scale-[1.02]' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className={`w-full px-4 py-3 bg-discord-dark border-2 rounded-full text-white placeholder-discord-text focus:outline-none transition-all duration-300 ${
              isFocused 
                ? 'border-discord-accent shadow-glow' 
                : 'border-discord-border hover:border-discord-text'
            }`}
            maxLength={2000}
            style={{ fontSize: isMobile ? '16px' : '14px' }} // Prevent zoom on iOS
          />
          
          {/* Character count */}
          {message.length > 1800 && (
            <div className={`absolute -top-6 right-2 text-xs ${
              message.length > 1950 ? 'text-discord-danger' : 'text-discord-warning'
            }`}>
              {message.length}/2000
            </div>
          )}
        </div>

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!message.trim()}
          className={`p-3 rounded-full font-semibold transition-all duration-300 transform ${
            message.trim()
              ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-glow hover:scale-110 hover:shadow-glow-lg'
              : 'bg-discord-border text-discord-text cursor-not-allowed'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </div>
  );
}
