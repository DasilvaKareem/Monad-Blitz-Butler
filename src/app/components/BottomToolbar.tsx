import React from "react";
import { SessionStatus } from "@/app/types";

interface BottomToolbarProps {
  sessionStatus: SessionStatus;
  onToggleConnection: () => void;
  isPTTActive: boolean;
  setIsPTTActive: (val: boolean) => void;
  isPTTUserSpeaking: boolean;
  handleTalkButtonDown: () => void;
  handleTalkButtonUp: () => void;
  isEventsPaneExpanded: boolean;
  setIsEventsPaneExpanded: (val: boolean) => void;
  isAudioPlaybackEnabled: boolean;
  setIsAudioPlaybackEnabled: (val: boolean) => void;
  isVisualizerExpanded: boolean;
  setIsVisualizerExpanded: (val: boolean) => void;
  codec: string;
  onCodecChange: (newCodec: string) => void;
}

function BottomToolbar({
  sessionStatus,
  onToggleConnection,
  isPTTActive,
  setIsPTTActive,
  isPTTUserSpeaking,
  handleTalkButtonDown,
  handleTalkButtonUp,
  isEventsPaneExpanded,
  setIsEventsPaneExpanded,
  isAudioPlaybackEnabled,
  setIsAudioPlaybackEnabled,
  isVisualizerExpanded,
  setIsVisualizerExpanded,
  codec,
  onCodecChange,
}: BottomToolbarProps) {
  const isConnected = sessionStatus === "CONNECTED";
  const isConnecting = sessionStatus === "CONNECTING";

  const handleCodecChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCodec = e.target.value;
    onCodecChange(newCodec);
  };

  function getConnectionButtonLabel() {
    if (isConnected) return "Disconnect";
    if (isConnecting) return "Connecting...";
    return "Connect";
  }

  function getConnectionButtonClasses() {
    const baseClasses = "text-sm font-medium p-2.5 w-36 rounded-lg h-full transition-all duration-200";
    const cursorClass = isConnecting ? "cursor-not-allowed" : "cursor-pointer";

    if (isConnected) {
      // Connected -> label "Disconnect" -> bordeaux
      return `bg-bordeaux hover:bg-bordeaux-light text-ivory ${cursorClass} ${baseClasses}`;
    }
    // Disconnected or connecting -> label is either "Connect" or "Connecting" -> gold
    return `btn-gold ${cursorClass} ${baseClasses}`;
  }

  return (
    <div className="p-4 flex flex-row items-center justify-center gap-x-8 border-t border-border bg-charcoal">
      <button
        onClick={onToggleConnection}
        className={getConnectionButtonClasses()}
        disabled={isConnecting}
      >
        {getConnectionButtonLabel()}
      </button>

      <div className="flex flex-row items-center gap-2">
        <input
          id="push-to-talk"
          type="checkbox"
          checked={isPTTActive}
          onChange={(e) => setIsPTTActive(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4 accent-gold"
        />
        <label
          htmlFor="push-to-talk"
          className="flex items-center cursor-pointer text-text-secondary text-sm"
        >
          Push to talk
        </label>
        <button
          onMouseDown={handleTalkButtonDown}
          onMouseUp={handleTalkButtonUp}
          onTouchStart={handleTalkButtonDown}
          onTouchEnd={handleTalkButtonUp}
          disabled={!isPTTActive}
          className={
            (isPTTUserSpeaking ? "bg-gold text-noir" : "bg-surface-elevated text-text-secondary border border-border") +
            " py-1.5 px-4 cursor-pointer rounded-lg text-sm transition-all duration-200" +
            (!isPTTActive ? " opacity-50 cursor-not-allowed" : " hover:border-gold/30")
          }
        >
          Talk
        </button>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="audio-playback"
          type="checkbox"
          checked={isAudioPlaybackEnabled}
          onChange={(e) => setIsAudioPlaybackEnabled(e.target.checked)}
          disabled={!isConnected}
          className="w-4 h-4 accent-gold"
        />
        <label
          htmlFor="audio-playback"
          className="flex items-center cursor-pointer text-text-secondary text-sm"
        >
          Audio playback
        </label>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="logs"
          type="checkbox"
          checked={isEventsPaneExpanded}
          onChange={(e) => setIsEventsPaneExpanded(e.target.checked)}
          className="w-4 h-4 accent-gold"
        />
        <label htmlFor="logs" className="flex items-center cursor-pointer text-text-secondary text-sm">
          Logs
        </label>
      </div>

      <div className="flex flex-row items-center gap-2">
        <input
          id="visualizer"
          type="checkbox"
          checked={isVisualizerExpanded}
          onChange={(e) => setIsVisualizerExpanded(e.target.checked)}
          className="w-4 h-4 accent-gold"
        />
        <label htmlFor="visualizer" className="flex items-center cursor-pointer text-text-secondary text-sm">
          Visualizer
        </label>
      </div>

      <div className="flex flex-row items-center gap-2">
        <span className="text-text-secondary text-sm">Codec:</span>
        <select
          id="codec-select"
          value={codec}
          onChange={handleCodecChange}
          className="bg-surface-elevated border border-border rounded-lg px-3 py-1.5 text-sm text-ivory focus:outline-none focus:border-gold cursor-pointer transition-colors duration-200"
        >
          <option value="opus">Opus (48 kHz)</option>
          <option value="pcmu">PCMU (8 kHz)</option>
          <option value="pcma">PCMA (8 kHz)</option>
        </select>
      </div>
    </div>
  );
}

export default BottomToolbar;
