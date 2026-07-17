import React from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";

export default function JitsiVideoCall({ roomName, displayName, email, onEndCall }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 99999, background: "#000" }}>
      <button 
        onClick={onEndCall}
        style={{
          position: "absolute", top: 16, left: 16, zIndex: 100000,
          background: "#ef4444", color: "#fff", border: "none", 
          padding: "10px 20px", borderRadius: "8px", fontWeight: "bold",
          cursor: "pointer", fontFamily: "'Sora', sans-serif"
        }}
      >
        Leave / End Call
      </button>
      <JitsiMeeting
        domain="meet.jit.si"
        roomName={roomName}
        configOverwrite={{
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableModeratorIndicator: true,
          prejoinPageEnabled: false,
        }}
        interfaceConfigOverwrite={{
          DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
        }}
        userInfo={{
          displayName: displayName || "User",
          email: email || "",
        }}
        onApiReady={(externalApi) => {
          // Listen for when the user hangs up internally in Jitsi
          externalApi.addListener("videoConferenceLeft", () => {
            onEndCall();
          });
        }}
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = "100%";
          iframeRef.style.width = "100%";
        }}
      />
    </div>
  );
}
