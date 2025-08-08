import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { 
  showToast, 
  ChannelStore, 
  UserStore, 
  SelectedChannelStore
} from "@webpack/common";

const settings = definePluginSettings({
  targetUserId: {
    type: OptionType.STRING,
    description: "Benutzer-ID für Sprachkanal-Benachrichtigungen",
    default: ""
  },
  avatarHoverDelay: {
    type: OptionType.NUMBER,
    description: "Verzögerung beim Hovern (ms)",
    default: 300,
    min: 0,
    max: 10000
  },
  roundedCorners: {
    type: OptionType.BOOLEAN,
    description: "Abgerundete Ecken",
    default: true
  },
  backgroundColor: {
    type: OptionType.STRING,
    description: "Hintergrundfarbe (Hex)",
    default: "#0a0a0f"
  },
  popupWidth: {
    type: OptionType.NUMBER,
    description: "Popup-Breite (px)",
    default: 400,
    min: 100,
    max: 800
  },
  popupMaxHeight: {
    type: OptionType.NUMBER,
    description: "Maximale Höhe (px)",
    default: 420,
    min: 0,
    max: 1000
  },
  restrictToServer: {
    type: OptionType.BOOLEAN,
    description: "Nur auf R6DE Server anzeigen",
    default: true
  },
  defaultPinned: {
    type: OptionType.BOOLEAN,
    description: "Standardmäßig angepinnt",
    default: false
  },
  textColor: {
    type: OptionType.STRING,
    description: "Textfarbe (Hex)",
    default: "#e1e7ff"
  },
  borderSize: {
    type: OptionType.NUMBER,
    description: "Rahmendicke (px)",
    default: 1,
    min: 0,
    max: 10
  },
  borderColor: {
    type: OptionType.STRING,
    description: "Rahmenfarbe (Hex)",
    default: "#2563eb"
  },
  borderStyle: {
    type: OptionType.SELECT,
    description: "Rahmenstil",
    default: "solid",
    options: [
      { label: "Durchgezogen", value: "solid" },
      { label: "Gestrichelt", value: "dashed" },
      { label: "Gepunktet", value: "dotted" },
      { label: "Doppelt", value: "double" }
    ]
  },
  popupOpacity: {
    type: OptionType.NUMBER,
    description: "Deckkraft (0.0 - 1.0)",
    default: 0.95,
    min: 0.0,
    max: 1.0,
    step: 0.05
  },
  tooltipAnimation: {
    type: OptionType.BOOLEAN,
    description: "Animationen aktivieren",
    default: true
  },
  animationDuration: {
    type: OptionType.NUMBER,
    description: "Animationsdauer (ms)",
    default: 300,
    min: 0,
    max: 1000
  },
  popupPosition: {
    type: OptionType.SELECT,
    description: "Popup-Position",
    default: "bottom-right",
    options: [
      { label: "Unten rechts", value: "bottom-right" },
      { label: "Unten links", value: "bottom-left" },
      { label: "Oben rechts", value: "top-right" },
      { label: "Oben links", value: "top-left" }
    ]
  },
  showAvatars: {
    type: OptionType.BOOLEAN,
    description: "Avatare anzeigen",
    default: true
  },
  minimalistPopup: {
    type: OptionType.BOOLEAN,
    description: "Minimalistisches Popup",
    default: false
  },
  glowIntensity: {
    type: OptionType.SELECT,
    description: "Glow-Intensität",
    default: "medium",
    options: [
      { label: "Aus", value: "none" },
      { label: "Schwach", value: "low" },
      { label: "Mittel", value: "medium" },
      { label: "Stark", value: "high" }
    ]
  }
});

interface PenaltyEntry {
  text: string;
  category: string;
  expired: boolean;
  days?: number;
  offense?: string;
  date?: Date;
}

interface WarningEntry {
  offense: string;
  date: Date;
}

interface UnbanEntry {
  reason: string;
  date: Date;
}

interface WatchlistEntry {
  reason: string;
  date: Date;
}

interface StrafakteData {
  warnCount: number;
  unbanCount: number;
  watchlistCount: number;
  penalties: PenaltyEntry[];
  warnings: WarningEntry[];
  unbans: UnbanEntry[];
  watchlist: WatchlistEntry[];
  newestActiveDays: number;
  error?: string;
  avatarUrl?: string;
  username?: string;
}

export default definePlugin({
  name: "R6DEsupporterTool",
  description: "Strafakte, Einladungsvorschau & Sprachbenachrichtigungen - 4.0 Glow Edition ✨",
  authors: [{ id: 549586034242093069n, name: "Saftlos" }],
  settings,
  dependencies: ["ContextMenuAPI"],

  observers: [] as MutationObserver[],

  flux: {
    VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: any[] }) {
      const targetId = settings.store.targetUserId;
      if (!targetId) return;

      for (const state of voiceStates) {
        if (state.userId === targetId && state.channelId && !state.oldChannelId) {
          const channelObj = ChannelStore.getChannel(state.channelId);
          const channelName = channelObj?.name || "Unbekannt";
          const user = UserStore.getUser(state.userId)?.username || state.userId;
          showToast(`${user} ist ${channelName} beigetreten`);
        }
      }
    }
  },

  async start() {
    const GUILD_ID = "787620905269854259";
    const WATCHLIST_CHANNEL_ID = "843185952122077224";
    
    // Popup Container mit modernem Glow Design
    const popup = document.createElement("div");
    popup.id = "r6de-supporter-popup";
    popup.classList.add("r6de-supporter-popup");
    
    // Moderne Glassmorphism + Glow Styles
    Object.assign(popup.style, {
      position: "fixed",
      background: `linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(20, 25, 35, 0.92) 100%)`,
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      color: settings.store.textColor,
      padding: "20px",
      borderRadius: settings.store.roundedCorners ? "16px" : "8px",
      fontSize: "13px",
      zIndex: "9999",
      pointerEvents: "auto",
      display: "none",
      width: settings.store.popupWidth + "px",
      maxHeight: settings.store.popupMaxHeight > 0 ? settings.store.popupMaxHeight + "px" : 'none',
      overflowY: "auto",
      boxShadow: `
        0 16px 48px rgba(0,0,0,0.5),
        0 0 24px rgba(37, 99, 235, 0.15),
        inset 0 1px 0 rgba(255,255,255,0.1)
      `,
      fontFamily: "'Inter', 'SF Pro Display', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontWeight: "400",
      lineHeight: "1.5",
      cursor: "grab",
      border: `1px solid rgba(37, 99, 235, 0.3)`,
      opacity: settings.store.popupOpacity.toString(),
      visibility: "hidden",
      transform: "scale(0.95) translateY(12px)",
      transition: settings.store.tooltipAnimation 
        ? `all ${settings.store.animationDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`
        : "none",
    });
    
    document.body.appendChild(popup);

    // 4.0 CSS mit Glow Effects und Blue Gradients
    const scrollFixStyle = document.createElement("style");
    scrollFixStyle.textContent = `
      .r6de-supporter-popup::-webkit-scrollbar {
        width: 6px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.3);
        border-radius: 8px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 8px;
        box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
      }
      .strafakte-list-container::-webkit-scrollbar {
        width: 4px;
      }
      .strafakte-list-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
      }
      .strafakte-list-container::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 6px;
        box-shadow: 0 0 6px rgba(59, 130, 246, 0.3);
      }
    `;
    document.head.appendChild(scrollFixStyle);

    // Dragging-Logik (bleibt gleich)
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    let userHasDragged = false;
    let dragStartPosition = { x: 0, y: 0 };

    popup.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      userHasDragged = true;
      popup.style.cursor = "grabbing";
      popup.style.transition = "none";
      dragOffsetX = e.clientX - popup.getBoundingClientRect().left;
      dragOffsetY = e.clientY - popup.getBoundingClientRect().top;
      dragStartPosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    });

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging) return;
      
      const moveThreshold = 3;
      const dx = Math.abs(e.clientX - dragStartPosition.x);
      const dy = Math.abs(e.clientY - dragStartPosition.y);
      
      if (dx < moveThreshold && dy < moveThreshold) return;
      
      requestAnimationFrame(() => {
        let newLeft = e.clientX - dragOffsetX;
        let newTop = e.clientY - dragOffsetY;
        const rect = popup.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 10;

        newLeft = Math.max(margin, Math.min(vw - rect.width - margin, newLeft));
        newTop = Math.max(margin, Math.min(vh - rect.height - margin, newTop));

        popup.style.left = newLeft + "px";
        popup.style.top = newTop + "px";
      });
    };

    const mouseUpHandler = () => {
      if (isDragging) {
        isDragging = false;
        popup.style.cursor = "grab";
        popup.style.transition = settings.store.tooltipAnimation 
          ? `all ${settings.store.animationDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`
          : "none";
      }
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
    document.addEventListener("mouseleave", mouseUpHandler);

    // 4.0 Modern CSS mit Glow & Blue Gradients
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      :root {
        --glow-intensity: ${settings.store.glowIntensity === 'none' ? '0' : 
                           settings.store.glowIntensity === 'low' ? '0.3' : 
                           settings.store.glowIntensity === 'medium' ? '0.6' : '1'};
      }
      
      .r6de-supporter-popup {
        --primary-blue: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        --primary-blue-hover: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        --text-primary: #f1f5f9;
        --text-secondary: #cbd5e1;
        --success-gradient: linear-gradient(135deg, #34d399 0%, #10b981 100%);
        --warning-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        --error-gradient: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        --surface-color: linear-gradient(135deg, rgba(30, 35, 50, 0.8) 0%, rgba(25, 30, 45, 0.9) 100%);
        --surface-hover: linear-gradient(135deg, rgba(40, 45, 65, 0.9) 0%, rgba(35, 40, 60, 0.95) 100%);
        scroll-behavior: smooth;
      }
      
      /* Einladungsvorschau 4.0 - Glow Edition */
      .r6de-invite-preview {
        background: linear-gradient(135deg, rgba(15, 15, 25, 0.95) 0%, rgba(20, 25, 35, 0.92) 100%) !important;
        backdrop-filter: blur(20px) !important;
        -webkit-backdrop-filter: blur(20px) !important;
        color: #f1f5f9 !important;
        padding: 20px !important;
        border-radius: ${settings.store.roundedCorners ? "16px" : "8px"} !important;
        font-size: 14px !important;
        font-family: 'Inter', 'SF Pro Display', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 400 !important;
        line-height: 1.5 !important;
        box-shadow: 
          0 16px 48px rgba(0,0,0,0.5),
          0 0 24px rgba(37, 99, 235, calc(0.15 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.1) !important;
        border: 1px solid rgba(37, 99, 235, 0.3) !important;
        opacity: ${settings.store.popupOpacity} !important;
        transition: ${settings.store.tooltipAnimation 
          ? `all ${settings.store.animationDuration}ms cubic-bezier(0.23, 1, 0.32, 1)`
          : "none"} !important;
        position: relative !important;
        overflow: hidden !important;
      }
      
      .r6de-invite-server-icon {
        width: 52px !important;
        height: 52px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(37, 99, 235, 0.3) !important;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
        box-shadow: 
          0 4px 16px rgba(0,0,0,0.3),
          0 0 12px rgba(37, 99, 235, calc(0.2 * var(--glow-intensity))) !important;
        object-fit: cover !important;
      }
      
      .r6de-invite-server-icon:hover {
        border-color: #3b82f6 !important;
        box-shadow: 
          0 6px 24px rgba(0,0,0,0.4),
          0 0 20px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity))) !important;
        transform: translateY(-2px) scale(1.05) !important;
      }
      
      .r6de-invite-server-name {
        font-weight: 700 !important;
        font-size: 17px !important;
        background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%) !important;
        -webkit-background-clip: text !important;
        -webkit-text-fill-color: transparent !important;
        background-clip: text !important;
        margin-bottom: 6px !important;
        letter-spacing: 0.2px !important;
        line-height: 1.3 !important;
        text-shadow: 0 0 20px rgba(255,255,255,calc(0.1 * var(--glow-intensity))) !important;
      }
      
      .r6de-invite-channel-emoji {
        font-size: 15px !important;
        display: inline-block !important;
        filter: drop-shadow(0 0 8px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity)))) !important;
      }
      
      .r6de-invite-members {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%) !important;
        color: #60a5fa !important;
        font-weight: 600 !important;
        font-size: 14px !important;
        padding: 12px 16px !important;
        border-radius: 12px !important;
        border: 1px solid rgba(37, 99, 235, 0.3) !important;
        text-align: center !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        gap: 8px !important;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1) !important;
        box-shadow: 
          0 4px 16px rgba(37, 99, 235, calc(0.1 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.1) !important;
      }
      
      .r6de-invite-members:hover {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.3) 0%, rgba(59, 130, 246, 0.25) 100%) !important;
        border-color: rgba(59, 130, 246, 0.5) !important;
        box-shadow: 
          0 6px 24px rgba(37, 99, 235, calc(0.2 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.15) !important;
        transform: translateY(-1px) !important;
      }
      
      .r6de-invite-members-emoji {
        font-size: 16px !important;
        display: inline-block !important;
        filter: drop-shadow(0 0 8px rgba(96, 165, 250, calc(0.4 * var(--glow-intensity)))) !important;
      }
      
      .strafakte-button {
        background: var(--primary-blue);
        color: white;
        border: none;
        padding: 0;
        border-radius: 10px;
        font-size: 14px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        box-shadow: 
          0 4px 16px rgba(37, 99, 235, calc(0.3 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.2);
        font-weight: 500;
      }
      
.strafakte-button:hover {
  background: var(--primary-blue-hover);
  transform: translateY(-2px) scale(1.05);
  color: var(--text-primary);
  -webkit-text-fill-color: var(--text-primary);
  box-shadow: 
    0 8px 24px rgba(37, 99, 235, calc(0.4 * var(--glow-intensity))),
    0 0 20px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity))),
    inset 0 1px 0 rgba(255,255,255,0.3);
}
      
      .strafakte-button:active {
        transform: translateY(-1px) scale(1.02);
      }
      
      .strafakte-button.pinned {
        background: var(--success-gradient);
        box-shadow: 
          0 4px 16px rgba(16, 185, 129, calc(0.3 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.2);
      }
      
.strafakte-button.pinned:hover {
  color: var(--text-primary);
  -webkit-text-fill-color: var(--text-primary);
  box-shadow: 
    0 8px 24px rgba(16, 185, 129, calc(0.4 * var(--glow-intensity))),
    0 0 20px rgba(52, 211, 153, calc(0.3 * var(--glow-intensity))),
    inset 0 1px 0 rgba(255,255,255,0.3);
}
 
      .strafakte-button.unpinned {
        background: var(--error-gradient);
        box-shadow: 
          0 4px 16px rgba(239, 68, 68, calc(0.3 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.2);
      }
      
.strafakte-button.unpinned:hover {
  color: var(--text-primary);
  -webkit-text-fill-color: var(--text-primary);
  box-shadow: 
    0 8px 24px rgba(239, 68, 68, calc(0.4 * var(--glow-intensity))),
    0 0 20px rgba(248, 113, 113, calc(0.3 * var(--glow-intensity))),
    inset 0 1px 0 rgba(255,255,255,0.3);
}


      .strafakte-button.close {
        background: transparent !important;
        color: #f87171;
        font-size: 20px;
        box-shadow: none;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        width: 36px;
        height: 36px;
        font-weight: 700;
      }
      
.strafakte-button.close:hover {
  color: #ff6b6b;
  -webkit-text-fill-color: #ff6b6b;
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%) !important;
  transform: scale(1.15) rotate(90deg);
  box-shadow: 0 0 16px rgba(248, 113, 113, calc(0.4 * var(--glow-intensity))) !important;
}

      
      .strafakte-button-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }
      
      .strafakte-avatar {
        width: 44px;
        height: 44px;
        border-radius: 12px;
        margin-right: 14px;
        object-fit: cover;
        border: 1px solid rgba(37, 99, 235, 0.3);
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        box-shadow: 
          0 4px 16px rgba(0,0,0,0.3),
          0 0 12px rgba(37, 99, 235, calc(0.2 * var(--glow-intensity)));
      }
      
      .strafakte-avatar:hover {
        border-color: #3b82f6;
        transform: scale(1.08) translateY(-2px);
        box-shadow: 
          0 8px 24px rgba(0,0,0,0.4),
          0 0 20px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity)));
      }
      
      .strafakte-header {
        display: flex;
        align-items: center;
        margin-bottom: 18px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        position: relative;
      }
      
      .strafakte-header::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.5) 50%, transparent 100%);
        box-shadow: 0 0 8px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity)));
      }
      
      .strafakte-user-info {
        flex: 1;
        min-width: 0;
        margin-right: 14px;
      }
      
      .strafakte-username {
        font-weight: 700;
        font-size: 16px;
        background: linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 4px;
        letter-spacing: 0.3px;
        text-shadow: 0 0 20px rgba(255,255,255,calc(0.1 * var(--glow-intensity)));
      }
      
      .strafakte-userid {
        font-size: 11px;
        color: var(--text-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: 'JetBrains Mono', 'Consolas', monospace;
        opacity: 0.8;
        font-weight: 500;
      }
      
      .strafakte-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 10px;
        margin-bottom: 18px;
      }
      
      .strafakte-stat {
        background: var(--surface-color);
        border-radius: 12px;
        padding: 14px 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        border: 1px solid rgba(59, 130, 246, 0.15);
        box-shadow: 
          0 4px 16px rgba(0,0,0,0.2),
          inset 0 1px 0 rgba(255,255,255,0.1);
        position: relative;
        overflow: hidden;
      }
      
      .strafakte-stat::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .strafakte-stat:hover {
        background: var(--surface-hover);
        transform: translateY(-4px) scale(1.02);
        border-color: rgba(59, 130, 246, 0.4);
        box-shadow: 
          0 12px 32px rgba(0,0,0,0.3),
          0 0 24px rgba(59, 130, 246, calc(0.2 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.15);
      }
      
      .strafakte-stat:hover::before {
        opacity: 1;
      }
      
      .strafakte-stat-value {
        font-weight: 700;
        font-size: 20px;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        line-height: 1;
        text-shadow: 0 0 20px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity)));
      }
      
      .strafakte-stat:hover .strafakte-stat-value {
        background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 24px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity)));
      }
      
      .strafakte-stat-label {
        font-size: 10px;
        color: var(--text-secondary);
        margin-top: 6px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        font-weight: 600;
        line-height: 1.2;
        word-wrap: break-word;
        hyphens: auto;
      }
      
      .strafakte-warning {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
        border-radius: 12px;
        padding: 14px 16px;
        margin-bottom: 18px;
        font-size: 13px;
        display: flex;
        align-items: center;
        border: 1px solid rgba(251, 191, 36, 0.3);
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        box-shadow: 
          0 4px 16px rgba(245, 158, 11, calc(0.1 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.1);
      }
      
      .strafakte-warning:hover {
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%);
        border-color: rgba(251, 191, 36, 0.5);
        box-shadow: 
          0 6px 24px rgba(245, 158, 11, calc(0.2 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.15);
      }
      
      .strafakte-list-container {
        max-height: 260px;
        overflow-y: auto;
        padding-right: 6px;
        scroll-behavior: smooth;
        margin-top: 8px;
      }
      
      .strafakte-list-title {
        margin-bottom: 14px;
        font-size: 15px;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        padding-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 700;
        text-shadow: 0 0 20px rgba(59, 130, 246, calc(0.2 * var(--glow-intensity)));
      }
      
.strafakte-back-button {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(59, 130, 246, 0.1) 100%);
  border: 1px solid rgba(37, 99, 235, 0.3);
  color: #60a5fa;
  -webkit-text-fill-color: #60a5fa;
  cursor: pointer;
  font-size: 12px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: 10px;
  transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
  font-weight: 600;
  box-shadow: 
    0 2px 8px rgba(37, 99, 235, calc(0.1 * var(--glow-intensity))),
    inset 0 1px 0 rgba(255,255,255,0.1);
}

.strafakte-back-button:hover {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(59, 130, 246, 0.2) 100%);
  color: #93c5fd;
  -webkit-text-fill-color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.5);
  transform: translateY(-1px);
  box-shadow: 
    0 4px 16px rgba(37, 99, 235, calc(0.2 * var(--glow-intensity))),
    inset 0 1px 0 rgba(255,255,255,0.15);
}

      
      .strafakte-entry {
        padding: 12px 14px;
        margin-bottom: 8px;
        background: var(--surface-color);
        border-radius: 12px;
        border-left: 3px solid;
        font-size: 12px;
        line-height: 1.5;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        cursor: pointer;
        box-shadow: 
          0 2px 8px rgba(0,0,0,0.2),
          inset 0 1px 0 rgba(255,255,255,0.05);
        position: relative;
        overflow: hidden;
      }
      
      .strafakte-entry::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, rgba(255,255,255,0.05) 0%, transparent 100%);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .strafakte-entry:hover {
        background: var(--surface-hover);
        transform: translateX(6px) translateY(-2px);
        box-shadow: 
          0 8px 24px rgba(0,0,0,0.3),
          0 0 16px rgba(59, 130, 246, calc(0.1 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.1);
      }
      
      .strafakte-entry:hover::before {
        opacity: 1;
      }
      
      .strafakte-entry > div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      /* Kategorie-Farben mit Glow */
      .strafakte-penalty-category-A { 
        border-color: #10b981; 
        box-shadow: 0 0 12px rgba(16, 185, 129, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-penalty-category-B { 
        border-color: #f59e0b; 
        box-shadow: 0 0 12px rgba(245, 158, 11, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-penalty-category-C { 
        border-color: #f97316; 
        box-shadow: 0 0 12px rgba(249, 115, 22, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-penalty-category-D { 
        border-color: #ef4444; 
        box-shadow: 0 0 12px rgba(239, 68, 68, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-penalty-category-E { 
        border-color: #8b5cf6; 
        box-shadow: 0 0 12px rgba(139, 92, 246, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-penalty-category-KICK { 
        border-color: #ff9500; 
        box-shadow: 0 0 12px rgba(255, 149, 0, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-penalty-category-UNKNOWN { 
        border-color: #6b7280; 
        box-shadow: 0 0 12px rgba(107, 114, 128, calc(0.1 * var(--glow-intensity)));
      }
      
      .strafakte-warning-entry { 
        border-color: #f59e0b; 
        box-shadow: 0 0 12px rgba(245, 158, 11, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-unban-entry { 
        border-color: #10b981; 
        box-shadow: 0 0 12px rgba(16, 185, 129, calc(0.2 * var(--glow-intensity)));
      }
      .strafakte-watchlist-entry { 
        border-color: #3b82f6; 
        box-shadow: 0 0 12px rgba(59, 130, 246, calc(0.2 * var(--glow-intensity)));
      }
      
      .strafakte-entry-expired {
        opacity: 0.6;
        border-left-style: dashed;
      }
      
      .strafakte-entry-category {
        display: inline-block;
        font-size: 9px;
        padding: 3px 8px;
        border-radius: 12px;
        margin-top: 6px;
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(59, 130, 246, 0.15) 100%);
        border: 1px solid rgba(37, 99, 235, 0.3);
        font-weight: 700;
        letter-spacing: 0.4px;
        text-transform: uppercase;
        box-shadow: 
          0 2px 8px rgba(37, 99, 235, calc(0.1 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.1);
      }
      
      .strafakte-entry-date {
        font-size: 10px;
        opacity: 0.8;
        margin-top: 6px;
        font-style: italic;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .strafakte-section {
        margin-bottom: 14px;
        font-size: 16px;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        padding-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
        font-weight: 700;
        text-shadow: 0 0 20px rgba(59, 130, 246, calc(0.2 * var(--glow-intensity)));
      }
      
      .strafakte-section:hover {
        background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 0 24px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity)));
      }
      
      .strafakte-empty-state {
        text-align: center;
        padding: 24px;
        opacity: 0.7;
        font-style: italic;
        font-size: 14px;
        color: var(--text-secondary);
        font-weight: 500;
      }
      
      .strafakte-tab-content {
        animation: slideInUp 0.4s cubic-bezier(0.23, 1, 0.32, 1);
      }
      
      .strafakte-detail-view {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(59, 130, 246, 0.05) 100%);
        border-radius: 12px;
        padding: 16px;
        margin-top: 12px;
        border: 1px solid rgba(37, 99, 235, 0.2);
        box-shadow: 
          0 4px 16px rgba(37, 99, 235, calc(0.05 * var(--glow-intensity))),
          inset 0 1px 0 rgba(255,255,255,0.05);
      }
      
      .strafakte-detail-title {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 14px;
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        display: flex;
        align-items: center;
        gap: 8px;
        text-shadow: 0 0 20px rgba(59, 130, 246, calc(0.2 * var(--glow-intensity)));
      }
      
      .strafakte-detail-field {
        margin-bottom: 12px;
        padding: 10px 0;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }
      
      .strafakte-detail-field:last-child {
        border-bottom: none;
      }
      
      .strafakte-detail-label {
        font-weight: 700;
        font-size: 11px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 6px;
      }
      
      .strafakte-detail-value {
        font-size: 13px;
        word-break: break-word;
        color: var(--text-primary);
        font-weight: 500;
      }
      
      @keyframes slideInUp {
        from { 
          opacity: 0; 
          transform: translateY(16px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
      
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 40px;
        text-align: center;
      }
      
      .loading-spinner {
        width: 36px;
        height: 36px;
        margin-bottom: 20px;
        border: 3px solid rgba(37, 99, 235, 0.3);
        border-radius: 50%;
        border-top: 3px solid #3b82f6;
        animation: spin 1s linear infinite;
        box-shadow: 0 0 20px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity)));
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 14px;
        color: var(--text-secondary);
        margin-top: 10px;
        font-weight: 500;
      }

      /* Minimalistisches Design */
      .minimalist-popup .strafakte-header {
        padding-bottom: 14px;
        margin-bottom: 14px;
      }
      
      .minimalist-popup .strafakte-avatar {
        width: 40px;
        height: 40px;
        border-radius: 10px;
      }
      
      .minimalist-popup .strafakte-username {
        font-size: 15px;
      }
      
      .minimalist-popup .strafakte-userid {
        font-size: 10px;
      }
      
      .minimalist-popup .strafakte-stat {
        padding: 12px 6px;
        min-width: 85px;
      }
      
      .minimalist-popup .strafakte-stat-value {
        font-size: 18px;
      }
      
      .minimalist-popup .strafakte-stat-label {
        font-size: 9px;
      }
      
      .minimalist-popup .strafakte-warning {
        padding: 12px 14px;
        font-size: 12px;
      }
      
      .minimalist-popup .strafakte-list-container {
        max-height: 200px;
      }
      
      .minimalist-popup .strafakte-entry {
        padding: 10px 12px;
        font-size: 11px;
      }
    `;
    document.head.appendChild(style);

    // Alle anderen Funktionen bleiben gleich, nur mit neuen CSS-Klassen
    let popupHideTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentUserId: string | null = null;
    let isPinned = settings.store.defaultPinned;
    let currentStrafakteData: StrafakteData | null = null;
    let strafakteMouseMoveHandler: ((event: MouseEvent) => void) | null = null;
    const inviteRegex = /https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/([\w-]+)/;
    
    // Interaktionsflags
    let isMouseOverPopup = false;
    let isMouseOverAvatar = false;
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;
    let avatarLeaveTimer: ReturnType<typeof setTimeout> | null = null;
    
    // Aktive Ansicht
    let activeView: 'summary' | 'warnings' | 'unbans' | 'penalties' | 'watchlist' | 'detail' = 'summary';
    let detailEntry: PenaltyEntry | WarningEntry | UnbanEntry | WatchlistEntry | null = null;
    let detailSourceView: 'warnings' | 'unbans' | 'penalties' | 'watchlist' | null = null;
    
    // Variable für letzten Mauszeiger-Event
    let latestAvatarMouseEvent: MouseEvent | null = null;

    // Alle anderen Funktionen bleiben identisch...
    // [Rest des Codes bleibt unverändert - positionPopup, adjustPopupPosition, showPopupWithAnimation, etc.]

    // Positionierung
    function positionPopup(popupElement: HTMLElement, e: MouseEvent, xOffset: number = 15, yOffset: number = 15) {
      requestAnimationFrame(() => {
        const rect = popupElement.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const position = settings.store.popupPosition;
        const margin = 15;

        let left = e.pageX + xOffset;
        let top = e.pageY + yOffset;

        switch (position) {
          case "bottom-left":
            left = e.pageX - rect.width - xOffset;
            break;
          case "top-right":
            top = e.pageY - rect.height - yOffset;
            break;
          case "top-left":
            left = e.pageX - rect.width - xOffset;
            top = e.pageY - rect.height - yOffset;
            break;
        }

        left = Math.max(margin, Math.min(vw - rect.width - margin, left));
        top = Math.max(margin, Math.min(vh - rect.height - margin, top));

        const maxAllowedHeight = Math.min(
          settings.store.popupMaxHeight,
          vh - top - margin
        );
        popupElement.style.maxHeight = maxAllowedHeight + "px";

        popupElement.style.left = left + "px";
        popupElement.style.top = top + "px";
      });
    }

    function adjustPopupPosition() {
      if (!popup || popup.style.display === 'none') return;

      setTimeout(() => {
        const rect = popup.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 20;

        let left = parseFloat(popup.style.left) || 0;
        let top = parseFloat(popup.style.top) || 0;

        if (left + rect.width > vw - margin) {
          left = vw - rect.width - margin;
        }
        if (top + rect.height > vh - margin) {
          top = vh - rect.height - margin;
        }
        if (left < margin) {
          left = margin;
        }
        if (top < margin) {
          top = margin;
        }

        popup.style.left = left + "px";
        popup.style.top = top + "px";
      }, 0);
    }

    function isPopupInViewport(): boolean {
      if (!popup || popup.style.display === 'none') return true;
      
      const rect = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      
      return rect.left >= 0 && rect.top >= 0 && rect.right <= vw && rect.bottom <= vh;
    }

    // Popup-Animationen
    function showPopupWithAnimation() {
      popup.style.display = "block";
      popup.style.visibility = "hidden";
      popup.style.opacity = "0";
      popup.style.transform = "scale(0.95) translateY(12px)";
      
      requestAnimationFrame(() => {
        popup.style.visibility = "visible";
        popup.style.opacity = settings.store.popupOpacity.toString();
        popup.style.transform = "scale(1) translateY(0)";
        
        setTimeout(() => {
          if (!isPopupInViewport()) {
            adjustPopupPosition();
          }
        }, settings.store.animationDuration + 50);
      });
    }

    function hidePopupWithAnimation() {
      if (settings.store.tooltipAnimation) {
        popup.style.opacity = "0";
        popup.style.transform = "scale(0.95) translateY(12px)";
        
        setTimeout(() => {
          popup.style.display = "none";
          popup.style.visibility = "hidden";
        }, settings.store.animationDuration);
      } else {
        popup.style.display = "none";
      }
    }

    // Benutzer-ID Extraktion
    function getUserIdFromElement(el: HTMLElement): string | null {
      for (const key in el) {
        if (key.startsWith("__reactFiber$")) {
          const fiber = (el as any)[key];
          let fiberNode = fiber;
          
          while (fiberNode) {
            const props = fiberNode?.pendingProps || fiberNode?.memoizedProps;
            const userId = props?.user?.id || props?.userId || 
                          (props?.id?.match(/^\d{17,20}$/) ? props.id : null);
            if (userId) return userId;
            
            fiberNode = fiberNode.return;
          }
        }
      }

      const profilePopup = el.closest('[class*="userProfileOuter"]');
      if (profilePopup) {
        const userIdElement = profilePopup.querySelector('[class*="userTag"]');
        if (userIdElement) {
          const userIdMatch = userIdElement.textContent?.match(/\d{17,20}/);
          if (userIdMatch) return userIdMatch[0];
        }
      }

      if (el instanceof HTMLImageElement && el.classList.toString().includes('avatar')) {
        const src = el.src;
        const match = src.match(/avatars\/(\d{17,20})\//) || 
                     src.match(/users\/(\d{17,20})\//);
        if (match) return match[1];
      }
      
      else if (el instanceof HTMLDivElement) {
        const bgImage = el.style.backgroundImage;
        if (bgImage) {
          const match = bgImage.match(/avatars\/(\d{17,20})\//);
          if (match) return match[1];
        }
      }
      
      else if (el.classList.contains('wrapper__44b0c') || el.classList.contains('voiceUser_efcaf8')) {
        const img = el.querySelector('img[class*="avatar"]');
        if (img && img.src) {
          const match = img.src.match(/avatars\/(\d{17,20})\//);
          if (match) return match[1];
        }
      }

      const parentElement = el.closest('[data-user-id], [data-author-id], [class*="user"]');
      if (parentElement) {
        const userId = parentElement.getAttribute('data-user-id') || 
                      parentElement.getAttribute('data-author-id');
        if (userId) return userId;
      }
      
      return null;
    }

    // Kontextmenü-Methode
    async function getUserIdFromContextMenu(el: HTMLElement): Promise<string | null> {
      return new Promise((resolve) => {
        if (!el) return resolve(null);

        const style = document.createElement("style");
        style.setAttribute('data-strafakte-plugin-style', 'true');
        style.textContent = `
          [role="menu"] {
            visibility: hidden !important;
            pointer-events: none !important;
            user-select: none !important;
          }
        `;
        document.head.appendChild(style);

        const rect = el.getBoundingClientRect();
        const contextMenuEvent = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          view: window,
          clientX: rect.left + 1,
          clientY: rect.top + 1,
          button: 2,
        });

        const observer = new MutationObserver((mutations, obs) => {
          for (const mutation of mutations) {
            for (const node of mutation.addedNodes) {
              if (!(node instanceof HTMLElement)) continue;
              const menuItem = node.querySelector("[id^='user-context-devmode-copy-id-']");
              if (menuItem) {
                const userId = menuItem.id.replace("user-context-devmode-copy-id-", "");
                obs.disconnect();
                document.body.click();
                style.remove();
                resolve(userId);
                return;
              }
            }
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        el.dispatchEvent(contextMenuEvent);

        setTimeout(() => {
          observer.disconnect();
          style.remove();
          resolve(null);
        }, 800);
      });
    }

    // Strafe-Kategorisierung
    function parseStrafeKategorie(strafe: string): string {
      const cleanStrafe = strafe.replace(/^\*\*|\*\*$/g, '').trim().toLowerCase();
      
      if (cleanStrafe.includes('ban') && !cleanStrafe.includes('unban') && !cleanStrafe.includes('entban')) {
        return "E";
      }
      
      if (cleanStrafe.includes('warn')) return "B";
      if (cleanStrafe.includes('kick')) return "KICK";
      if (cleanStrafe.includes('1h') || cleanStrafe.includes('1 h') || cleanStrafe.includes('1 stunde')) return "A";
      
      const match = cleanStrafe.match(/(\d+)d/i);
      if (match) {
        const days = parseInt(match[1]);
        if (days <= 3) return "C";
        if (days <= 7) return "D";
        return "E";
      }
      
      return "?";
    }

    // Token-Helper
    let tokenCache: string | undefined;
    async function getToken(): Promise<string | undefined> {
      if (tokenCache) return tokenCache;
      try {
        const reqs: any[] = [];
        (window as any).webpackChunkdiscord_app.push([
          [Math.random()],
          {},
          (req: any) => {
            for (const m in req.c) {
              const mod = req.c[m].exports;
              reqs.push(mod);
              if (mod && typeof mod.getToken === "function") {
                const found = mod.getToken();
                if (found) {
                  tokenCache = found;
                  return tokenCache;
                }
              }
            }
          }
        ]);
      } catch (e) {
        console.error("Token Fehler:", e);
      }
      return tokenCache;
    }

    // Strafakte-Abrufung (bleibt identisch)
    async function fetchStrafakte(userId: string): Promise<StrafakteData> {
      try {
        const user = UserStore.getUser(userId);
        if (user?.bot) {
          return { 
            warnCount: 0, 
            unbanCount: 0, 
            watchlistCount: 0,
            penalties: [], 
            warnings: [],
            unbans: [],
            watchlist: [],
            newestActiveDays: 0,
            error: "Bots haben keine Strafakte",
            username: user.username,
            avatarUrl: user.getAvatarURL()
          };
        }

        const strafakteChannelId = "795999721839525929";
        const watchlistChannelId = "843185952122077224";
        let tokenStr = tokenCache || (await getToken()) || "";
        if (!tokenStr) return { 
          warnCount: 0, 
          unbanCount: 0, 
          watchlistCount: 0,
          penalties: [], 
          warnings: [],
          unbans: [],
          watchlist: [],
          newestActiveDays: 0, 
          error: "Kein Token" 
        };

        // Strafakte abrufen
        const strafakteUrl = `https://discord.com/api/v9/guilds/${GUILD_ID}/messages/search?content=ID%3A%20${userId}&channel_id=${strafakteChannelId}&include_nsfw=true`;
        let res = await fetch(strafakteUrl, { headers: { Authorization: tokenStr } });
        
        if (res.status === 401) {
          tokenCache = undefined;
          tokenStr = (await getToken()) || "";
          if (!tokenStr) return { 
            warnCount: 0, 
            unbanCount: 0, 
            watchlistCount: 0,
            penalties: [], 
            warnings: [],
            unbans: [],
            watchlist: [],
            newestActiveDays: 0, 
            error: "Kein Token (401)" 
          };
          res = await fetch(strafakteUrl, { headers: { Authorization: tokenStr } });
        }
        
        if (!res.ok) {
          return { 
            warnCount: 0, 
            unbanCount: 0, 
            watchlistCount: 0,
            penalties: [], 
            warnings: [],
            unbans: [],
            watchlist: [],
            newestActiveDays: 0, 
            error: `Fehler ${res.status}` 
          };
        }

        const strafakteData = await res.json();
        const strafakteMessages = strafakteData.messages.flat();
        
        // Watchlist abrufen
        let watchlistEntries: WatchlistEntry[] = [];
        const watchlistUrl = `https://discord.com/api/v9/guilds/${GUILD_ID}/messages/search?content=ID%3A%20${userId}&channel_id=${watchlistChannelId}&include_nsfw=true`;
        const watchlistRes = await fetch(watchlistUrl, { headers: { Authorization: tokenStr } });
        
        if (watchlistRes.ok) {
          const watchlistData = await watchlistRes.json();
          const watchlistMessages = watchlistData.messages.flat();
          
          for (const msg of watchlistMessages) {
            const content = msg.content as string;
            if (!content.includes(`ID: ${userId}`)) continue;
            
            const vorwurfLine = content.split("\n").find(line => line.toLowerCase().includes("vorwurf:")) ||
                              content.split("\n").find(line => line.toLowerCase().includes("grund:"));
            
            let vorwurfText = "Kein Vorwurf angegeben";
            if (vorwurfLine) {
              const vorwurfMatch = vorwurfLine.match(/Vorwurf:\s*(.+)|Grund:\s*(.+)/i);
              if (vorwurfMatch) {
                vorwurfText = vorwurfMatch[1] || vorwurfMatch[2] || "Kein Vorwurf angegeben";
              }
            }
            
            watchlistEntries.push({
              reason: vorwurfText,
              date: new Date(msg.timestamp)
            });
          }
        }

        if (strafakteMessages.length === 0 && watchlistEntries.length === 0) {
          return { 
            warnCount: 0, 
            unbanCount: 0, 
            watchlistCount: watchlistEntries.length,
            penalties: [], 
            warnings: [],
            unbans: [],
            watchlist: watchlistEntries,
            newestActiveDays: 0,
            error: "Keine Einträge gefunden",
            username: user?.username || `Benutzer ${userId}`,
            avatarUrl: user?.getAvatarURL()
          };
        }

        // Verarbeitung der Strafakte-Nachrichten
        let warnCount = 0;
        let unbanCount = 0;
        const penalties: PenaltyEntry[] = [];
        const warnings: WarningEntry[] = [];
        const unbans: UnbanEntry[] = [];
        let newestActiveDays = 0;

        strafakteMessages.sort((a: any, b: any) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        for (const msg of strafakteMessages) {
          const content = msg.content as string;
          if (!content.includes(`ID: ${userId}`)) continue;
          
          const unbanKeywords = [
            'unbann', 'entbannung', 'entban', 'unban', 
            'entbannungsantrag', 'entbannungsgesuch', 'entbannungantrag',
            'entbannungs anfrage', 'unban request', 'entbitten'
          ];
          
          const isUnbanRequest = unbanKeywords.some(keyword => 
            content.toLowerCase().includes(keyword.toLowerCase())
          ) && !content.toLowerCase().includes('keine chance auf entbannung');
          
          if (isUnbanRequest) {
            unbanCount++;
            
            const reasonLine = content.split("\n").find(line => line.toLowerCase().startsWith("grund:"));
            const reason = reasonLine?.replace(/Grund:/i, "").trim() || "Kein Grund angegeben";
            
            unbans.push({
              reason,
              date: new Date(msg.timestamp)
            });
            continue;
          }

          const offenseLine = content.split("\n").find(line => line.toLowerCase().startsWith("tat:"));
          const offense = offenseLine?.replace(/Tat:/i, "").trim() || "Keine Tat angegeben";
          
          const strafeLine = content.split("\n").find(line => line.toLowerCase().startsWith("strafe:"));
          const strafeText = strafeLine?.replace(/Strafe:/i, "").trim() || "";

          if (!strafeText) continue;

          const kat = parseStrafeKategorie(strafeText);
          
          if (kat === "B") {
            warnCount++;
            warnings.push({
              offense,
              date: new Date(msg.timestamp)
            });
            continue;
          }
          
          if (kat === "?") continue;

          const timestamp = new Date(msg.timestamp);
          const ageDays = (Date.now() - timestamp.getTime()) / 86400000;
          
          const verfallen = kat !== "E" && kat !== "KICK" && (
            (kat === "A" && ageDays > 1) ||
            (kat === "C" && ageDays > 30) ||
            (kat === "D" && ageDays > 60)
          );

          let days = 0;
          const matchDays = strafeText.match(/(\d+)d/i);
          if (matchDays) days = parseInt(matchDays[1]);

          penalties.push({
            text: strafeText,
            category: kat,
            expired: verfallen,
            days,
            offense,
            date: new Date(msg.timestamp)
          });

          if (!verfallen && days > 0 && days > newestActiveDays) {
            newestActiveDays = days;
          }
        }

        return {
          warnCount,
          unbanCount,
          watchlistCount: watchlistEntries.length,
          penalties,
          warnings,
          unbans,
          watchlist: watchlistEntries,
          newestActiveDays,
          avatarUrl: user?.getAvatarURL(),
          username: user?.username || `Benutzer ${userId}`
        };
      } catch (error) {
        console.error("Strafakte Fehler:", error);
        return { 
          warnCount: 0, 
          unbanCount: 0, 
          watchlistCount: 0,
          penalties: [], 
          warnings: [],
          unbans: [],
          watchlist: [],
          newestActiveDays: 0, 
          error: "Serverfehler" 
        };
      }
    }

    // View-Management
    function changeView(view: 'summary' | 'warnings' | 'unbans' | 'penalties' | 'watchlist' | 'detail') {
      activeView = view;
      renderStrafakteContent();
      adjustPopupPosition();
    }

    function showEntryDetail(entry: PenaltyEntry | WarningEntry | UnbanEntry | WatchlistEntry, sourceView: 'warnings' | 'unbans' | 'penalties' | 'watchlist') {
      detailEntry = entry;
      detailSourceView = sourceView;
      changeView('detail');
    }

    // Detailansicht rendern (bleibt gleich)
    function renderDetailView() {
      if (!detailEntry) return '';

      let detailHtml = `
        <div class="strafakte-detail-title">📋 Detailinformationen</div>
        <div class="strafakte-detail-view">
      `;

      if ('offense' in detailEntry && 'category' in detailEntry) {
        const penalty = detailEntry as PenaltyEntry;
        const categoryDisplay = penalty.category === 'KICK' ? 'Kick' : 
                               penalty.category === '?' ? 'Unbekannt' : penalty.category;
        detailHtml += `
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Kategorie</div>
            <div class="strafakte-detail-value">${categoryDisplay}</div>
          </div>
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Strafe</div>
            <div class="strafakte-detail-value">${penalty.text}</div>
          </div>
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Tat</div>
            <div class="strafakte-detail-value">${penalty.offense || 'Keine Tat angegeben'}</div>
          </div>
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Datum</div>
            <div class="strafakte-detail-value">${penalty.date?.toLocaleDateString('de-DE') || 'Unbekannt'}</div>
          </div>
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Status</div>
            <div class="strafakte-detail-value">${penalty.expired ? 'Abgelaufen' : 'Aktiv'}</div>
          </div>
        `;
      } else if ('offense' in detailEntry) {
        const warning = detailEntry as WarningEntry;
        detailHtml += `
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Tat</div>
            <div class="strafakte-detail-value">${warning.offense}</div>
          </div>
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Datum</div>
            <div class="strafakte-detail-value">${warning.date?.toLocaleDateString('de-DE') || 'Unbekannt'}</div>
          </div>
        `;
      } else if ('reason' in detailEntry) {
        const isUnban = detailSourceView === 'unbans';
        const labelText = isUnban ? "Grund der Entbannung" : "Vorwurf";
        
        detailHtml += `
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">${labelText}</div>
            <div class="strafakte-detail-value">${detailEntry.reason}</div>
          </div>
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Datum</div>
            <div class="strafakte-detail-value">${detailEntry.date?.toLocaleDateString('de-DE') || 'Unbekannt'}</div>
          </div>
        `;
      }

      detailHtml += `
        </div>
        <button class="strafakte-back-button" data-view="${detailSourceView || 'summary'}">← Zurück</button>
      `;

      return detailHtml;
    }

    // Hauptrender-Funktion (identisch, nur mit neuen CSS-Klassen)
    function renderStrafakteContent() {
      if (!currentStrafakteData) {
        popup.innerHTML = "Keine Daten verfügbar";
        return;
      }

      const oldLeft = popup.style.left;
      const oldTop = popup.style.top;
      
      const minimalistClass = settings.store.minimalistPopup ? "minimalist-popup" : "";
      
      let contentHtml = `
        <div class="strafakte-header ${minimalistClass}">
          ${settings.store.showAvatars && currentStrafakteData.avatarUrl ? ` 
            <img src="${currentStrafakteData.avatarUrl}" class="strafakte-avatar" />
          ` : '<div class="strafakte-avatar" style="background:linear-gradient(135deg,rgba(37,99,235,0.2) 0%,rgba(59,130,246,0.15) 100%);display:flex;align-items:center;justify-content:center;font-size:22px;color:#3b82f6;border-radius:12px">👤</div>'}
          <div class="strafakte-user-info">
            <div class="strafakte-username" title="${currentStrafakteData.username}">
              ${currentStrafakteData.username || "Unbekannt"}
            </div>
            <div class="strafakte-userid" title="${currentUserId}">
              ${currentUserId || "ID unbekannt"}
            </div>
          </div>
          <div class="strafakte-button-container">
            <button id="strafakte-pin" class="strafakte-button ${isPinned ? 'pinned' : 'unpinned'}" title="${isPinned ? 'Angepinnt' : 'Anheften'}">
              ${isPinned ? '🔒' : '🔓'}
            </button>
            <button id="strafakte-copy-id" class="strafakte-button" title="ID kopieren">📋</button>
            <button id="strafakte-refresh" class="strafakte-button" title="Aktualisieren">🔄</button>
            <button id="strafakte-close" class="strafakte-button close" title="Schließen">×</button>
          </div>
        </div>
      `;
      
      if (activeView === 'detail') {
        contentHtml += `
          <div class="strafakte-list-title">
            <span>Detailansicht</span>
          </div>
          ${renderDetailView()}
        `;
      } else {
        contentHtml += `<div class="strafakte-tab-content ${minimalistClass}">`;
        
        switch (activeView) {
          case 'summary':
            contentHtml += `
              <div class="strafakte-stats">
                <div class="strafakte-stat" data-view="warnings">
                  <div class="strafakte-stat-value">${currentStrafakteData.warnCount}</div>
                  <div class="strafakte-stat-label">Warnungen</div>
                </div>
                <div class="strafakte-stat" data-view="unbans">
                  <div class="strafakte-stat-value">${currentStrafakteData.unbanCount}</div>
                  <div class="strafakte-stat-label">Entbans</div>
                </div>
                <div class="strafakte-stat" data-view="penalties">
                  <div class="strafakte-stat-value">${currentStrafakteData.penalties.length}</div>
                  <div class="strafakte-stat-label">Strafen</div>
                </div>
                <div class="strafakte-stat" data-view="watchlist">
                  <div class="strafakte-stat-value">${currentStrafakteData.watchlistCount}</div>
                  <div class="strafakte-stat-label">Watchlist</div>
                </div>
              </div>
            `;
            
            if (currentStrafakteData.newestActiveDays > 0) {
              contentHtml += `
                <div class="strafakte-warning">
                  ⚠️ Die nächste Bestrafung kann ${currentStrafakteData.newestActiveDays} Tage hinzufügen!
                </div>
              `;
            }
            
            if (currentStrafakteData.error) {
              contentHtml += `
                <div style="text-align:center;padding:14px;color:#f87171;background:linear-gradient(135deg,rgba(248,113,113,0.15) 0%,rgba(239,68,68,0.1) 100%);border-radius:12px;border:1px solid rgba(248,113,113,0.3);font-weight:500">
                  ${currentStrafakteData.error}
                </div>
              `;
            }
            break;
            
          case 'warnings':
            contentHtml += `
              <div class="strafakte-list-title">
                <span>Verwarnungen (${currentStrafakteData.warnCount})</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.warnings.length > 0) {
              currentStrafakteData.warnings.forEach((w, index) => {
                const dateStr = w.date ? w.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-warning-entry" data-index="${index}">
                    <div><strong>Tat:</strong> ${w.offense.substring(0, 70)}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">Keine Verwarnungen</div>`;
            }
            
            contentHtml += `</div>`;
            break;
            
          case 'unbans':
            contentHtml += `
              <div class="strafakte-list-title">
                <span>Entbannungen (${currentStrafakteData.unbanCount})</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.unbans.length > 0) {
              currentStrafakteData.unbans.forEach((u, index) => {
                const dateStr = u.date ? u.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-unban-entry" data-index="${index}">
                    <div><strong>Grund:</strong> ${u.reason.substring(0, 70)}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">Keine Entbannungen</div>`;
            }
            
            contentHtml += `</div>`;
            break;
            
          case 'penalties':
            contentHtml += `
              <div class="strafakte-list-title">
                <span>Strafen (${currentStrafakteData.penalties.length})</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.penalties.length > 0) {
              currentStrafakteData.penalties.forEach((p, index) => {
                const dateStr = p.date ? p.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                const categoryDisplay = p.category === 'KICK' ? 'Kick' : 
                                       p.category === '?' ? 'Unbekannt' : p.category;
                contentHtml += `
                  <div class="strafakte-entry strafakte-penalty-category-${p.category === '?' ? 'UNKNOWN' : p.category} ${p.expired ? 'strafakte-entry-expired' : ''}" data-index="${index}">
                    <div><strong>Tat:</strong> ${p.offense?.substring(0, 70) || "Keine Tat angegeben"}</div>
                    <div><strong>Strafe:</strong> ${p.text.substring(0, 50)}</div>
                    <div class="strafakte-entry-category">${categoryDisplay}${p.expired ? ' (Abgelaufen)' : ''}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">Keine Strafen</div>`;
            }
            
            contentHtml += `</div>`;
            break;
            
          case 'watchlist':
            contentHtml += `
              <div class="strafakte-list-title">
                <span>Watchlist (${currentStrafakteData.watchlistCount})</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.watchlist.length > 0) {
              currentStrafakteData.watchlist.forEach((w, index) => {
                const dateStr = w.date ? w.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-watchlist-entry" data-index="${index}">
                    <div><strong>Vorwurf:</strong> ${w.reason.substring(0, 70)}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">Keine Watchlist-Einträge</div>`;
            }
            
            contentHtml += `</div>`;
            break;
        }
        
        contentHtml += `</div>`;
      }

      popup.innerHTML = contentHtml;
      
      popup.style.left = oldLeft;
      popup.style.top = oldTop;
      
      setTimeout(() => {
        popup.style.left = oldLeft;
        popup.style.top = oldTop;
        
        setTimeout(() => {
          adjustPopupPosition();
        }, 50);
      }, 25);

      // Event Listener hinzufügen
      const addEventListeners = () => {
        document.querySelectorAll('.strafakte-stat, .strafakte-back-button').forEach(el => {
          const view = el.getAttribute('data-view');
          if (view) {
            el.addEventListener('click', () => changeView(view as any), { passive: true });
          }
        });

        if (activeView !== 'detail' && activeView !== 'summary') {
          document.querySelectorAll('.strafakte-entry').forEach((el, index) => {
            el.addEventListener('click', () => {
              let entry = null;
              switch (activeView) {
                case 'warnings':
                  entry = currentStrafakteData?.warnings[index];
                  break;
                case 'unbans':
                  entry = currentStrafakteData?.unbans[index];
                  break;
                case 'penalties':
                  entry = currentStrafakteData?.penalties[index];
                  break;
                case 'watchlist':
                  entry = currentStrafakteData?.watchlist[index];
                  break;
              }
              if (entry) showEntryDetail(entry, activeView);
            }, { passive: true });
          });
        }

        // Button Event Listeners
        const closeBtn = document.getElementById("strafakte-close");
        const copyBtn = document.getElementById("strafakte-copy-id");
        const refreshBtn = document.getElementById("strafakte-refresh");
        const pinBtn = document.getElementById("strafakte-pin");

        closeBtn?.addEventListener("click", () => {
          hidePopupWithAnimation();
          isPinned = false;
          isMouseOverPopup = false;
          isMouseOverAvatar = false;
          activeView = 'summary';
          detailSourceView = null;
        });

        copyBtn?.addEventListener("click", async () => {
          if (currentUserId) {
            try {
              await navigator.clipboard.writeText(currentUserId);
              copyBtn.textContent = "✓";
              copyBtn.style.background = "var(--success-gradient)";
              setTimeout(() => {
                copyBtn.textContent = "📋";
                copyBtn.style.background = "";
              }, 2000);
            } catch (err) {
              console.error('Copy failed:', err);
            }
          }
        });

        refreshBtn?.addEventListener("click", async () => {
          if (!currentUserId) return;
          
          refreshBtn.style.transform = "rotate(360deg) scale(1.1)";
          refreshBtn.style.transition = "transform 0.6s cubic-bezier(0.23, 1, 0.32, 1)";
          
          setTimeout(() => {
            if (refreshBtn) {
              refreshBtn.style.transform = "rotate(0deg) scale(1)";
              refreshBtn.style.transition = "";
            }
          }, 600);
          
          const oldLeft = popup.style.left;
          const oldTop = popup.style.top;
          
          currentStrafakteData = await fetchStrafakte(currentUserId);
          renderStrafakteContent();
          
          popup.style.left = oldLeft;
          popup.style.top = oldTop;
        });

        pinBtn?.addEventListener("click", () => {
          isPinned = !isPinned;
          if (pinBtn) {
            pinBtn.className = `strafakte-button ${isPinned ? 'pinned' : 'unpinned'}`;
            pinBtn.innerHTML = isPinned ? '🔒' : '🔓';
            pinBtn.title = isPinned ? 'Angepinnt' : 'Anheften';
          }
        });
      };

      requestAnimationFrame(addEventListeners);
      
      popup.style.left = oldLeft;
      popup.style.top = oldTop;
      
      adjustPopupPosition();
      
      setTimeout(() => {
        if (!isPopupInViewport()) {
          adjustPopupPosition();
        }
      }, 10);
    }

    // Popup-Interaktionen (bleibt gleich)
    popup.addEventListener("mouseenter", () => {
      isMouseOverPopup = true;
      if (hoverTimer) {
        clearTimeout(hoverTimer);
        hoverTimer = null;
      }
      if (avatarLeaveTimer) {
        clearTimeout(avatarLeaveTimer);
        avatarLeaveTimer = null;
      }
    });

    popup.addEventListener("mouseleave", () => {
      isMouseOverPopup = false;
      if (!isPinned && !isDragging) {
        if (!isMouseOverAvatar) {
          hoverTimer = setTimeout(() => {
            hidePopupWithAnimation();
            activeView = 'summary';
            detailSourceView = null;
          }, 200);
        }
      }
    });

    // Avatar-Hover-Logik (bleibt identisch)
    const handleAvatarHover = (el: HTMLElement) => {
      if (el.closest("#r6de-supporter-popup")) return;
      if (el.hasAttribute("data-r6de-processed")) return;
      
      el.setAttribute("data-r6de-processed", "true");
      
      let openTimer: ReturnType<typeof setTimeout> | null = null;
      let tempMouseMoveListener: ((event: MouseEvent) => void) | null = null;

      const handleMouseEnter = (e: MouseEvent) => {
        isMouseOverAvatar = true;
        
        if (settings.store.restrictToServer) {
          const channelId = SelectedChannelStore.getChannelId();
          const guildId = channelId ? ChannelStore.getChannel(channelId)?.guild_id : null;
          if (guildId !== GUILD_ID) return;
        }

        if (hoverTimer) {
          clearTimeout(hoverTimer);
          hoverTimer = null;
        }
        if (avatarLeaveTimer) {
          clearTimeout(avatarLeaveTimer);
          avatarLeaveTimer = null;
        }
        
        clearTimeout(openTimer!);
        latestAvatarMouseEvent = e;

        tempMouseMoveListener = (event: MouseEvent) => latestAvatarMouseEvent = event;
        window.addEventListener("mousemove", tempMouseMoveListener, { passive: true });

        openTimer = setTimeout(async () => {
          if (isPinned) return;
          
          const userId = getUserIdFromElement(el) || "?";
          
          popup.innerHTML = `
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <div class="loading-text">Lade Strafakte...</div>
            </div>
          `;
          
          showPopupWithAnimation();
          if (latestAvatarMouseEvent) positionPopup(popup, latestAvatarMouseEvent);

          const finalUserId = userId === "?" ? await getUserIdFromContextMenu(el) : userId;
          
          if (!finalUserId) {
            popup.innerHTML = `
              <div class="strafakte-header">
                <div class="strafakte-avatar" style="background:linear-gradient(135deg,rgba(248,113,113,0.2) 0%,rgba(239,68,68,0.15) 100%);display:flex;align-items:center;justify-content:center;font-size:22px;color:#ef4444;border-radius:12px">❌</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Fehler</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">×</button>
                </div>
              </div>
              <div style="padding:16px;text-align:center;color:#f87171;background:linear-gradient(135deg,rgba(248,113,113,0.15) 0%,rgba(239,68,68,0.1) 100%);border-radius:12px;border:1px solid rgba(248,113,113,0.3);font-weight:500">
                Benutzer-ID konnte nicht extrahiert werden
              </div>
            `;
            
            document.getElementById("strafakte-close")?.addEventListener("click", () => {
              hidePopupWithAnimation();
            });
            return;
          }
          
          const user = UserStore.getUser(finalUserId);
          if (user?.bot) {
            popup.innerHTML = `
              <div class="strafakte-header">
                <div class="strafakte-avatar" style="background:linear-gradient(135deg,rgba(37,99,235,0.2) 0%,rgba(59,130,246,0.15) 100%);display:flex;align-items:center;justify-content:center;font-size:22px;color:#3b82f6;border-radius:12px">🤖</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Bot</div>
                  <div class="strafakte-userid">${finalUserId}</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">×</button>
                </div>
              </div>
              <div style="padding:16px;text-align:center;color:var(--text-secondary);font-weight:500">
                Bots haben keine Strafakte
              </div>
            `;
            
            document.getElementById("strafakte-close")?.addEventListener("click", () => {
              hidePopupWithAnimation();
            });
            return;
          }

          currentUserId = finalUserId;
          currentStrafakteData = await fetchStrafakte(finalUserId);
          renderStrafakteContent();
          if (latestAvatarMouseEvent) positionPopup(popup, latestAvatarMouseEvent);

          if (tempMouseMoveListener) {
            window.removeEventListener("mousemove", tempMouseMoveListener);
            tempMouseMoveListener = null;
          }
        }, settings.store.avatarHoverDelay);
      };

      const handleMouseLeave = () => {
        isMouseOverAvatar = false;
        clearTimeout(openTimer!);
        if (tempMouseMoveListener) {
          window.removeEventListener("mousemove", tempMouseMoveListener);
          tempMouseMoveListener = null;
        }
        
        if (!isMouseOverPopup) {
          avatarLeaveTimer = setTimeout(() => {
            if (!isMouseOverPopup && !isPinned) {
              hidePopupWithAnimation();
              activeView = 'summary';
              detailSourceView = null;
            }
          }, 200);
        }
      };

      const handleMouseDown = () => {
        if (!isPinned) {
          setTimeout(() => {
            hidePopupWithAnimation();
            activeView = 'summary';
            detailSourceView = null;
          }, 100);
        }
      };

      el.addEventListener("mouseenter", handleMouseEnter, { passive: true });
      el.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      el.addEventListener("mousedown", handleMouseDown, { passive: true });
    };

    // Invite-Hover-System (4.0 GLOW Version)
    const handleInvitePreview = (link: HTMLAnchorElement) => {
      if (link.hasAttribute("data-r6de-invite-processed")) return;
      link.setAttribute("data-r6de-invite-processed", "true");

      const code = link.href.match(inviteRegex)?.[3];
      if (!code) return;

      link.title = "";
      link.removeAttribute("title");

      let isDataLoaded = false;
      let cachedData: any = null;
      let currentTooltip: HTMLElement | null = null;
      let isHovering = false;

      // Daten laden
      fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true&with_expiration=true`)
        .then(res => res.json())
        .then(data => {
          isDataLoaded = true;
          cachedData = data;
        })
        .catch(() => {
          console.warn("Invite-Daten nicht verfügbar");
        });

      const createTooltip = (e: MouseEvent) => {
        if (!isDataLoaded || !cachedData || !isHovering) return;

        if (currentTooltip) {
          currentTooltip.remove();
          currentTooltip = null;
        }

        currentTooltip = document.createElement("div");
        currentTooltip.className = "r6de-invite-preview";
        currentTooltip.dataset.created = Date.now().toString();
        
        Object.assign(currentTooltip.style, {
          position: "fixed",
          zIndex: "10002",
          maxWidth: "340px",
          pointerEvents: "none",
          display: "block",
          visibility: "hidden",
          opacity: "0",
          transform: "scale(0.95) translateY(12px)"
        });
        
        document.body.appendChild(currentTooltip);

        const g = cachedData.guild || {};
        const c = cachedData.channel || {};
        
        // Server-Icon mit Glow
        const serverIcon = g.id && g.icon
          ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128" class="r6de-invite-server-icon" />`
          : `<div class="r6de-invite-server-icon" style="background:linear-gradient(135deg,rgba(37,99,235,0.25) 0%,rgba(59,130,246,0.2) 100%);display:flex;align-items:center;justify-content:center;font-size:26px;color:#3b82f6">🌟</div>`;
        
        // Channel-Emoji mit Glow
        const channelEmojis = ["💬", "📱", "🔊", "👥", "📁", "📢", "🛒", "🎭", "💭"];
        const channelEmoji = channelEmojis[c.type] || "💬";
        
        // Member-Count
        const memberCount = cachedData.approximate_member_count || "???";
        
        currentTooltip.innerHTML = `
          <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
            ${serverIcon}
            <div style="flex:1;min-width:0;">
              <div class="r6de-invite-server-name">
                ${g.name || "🔒 Privater Server"}
              </div>
              <div style="color:#cbd5e1;font-size:14px;opacity:0.9;display:flex;align-items:center;gap:6px;margin-bottom:14px;font-weight:500">
                <span class="r6de-invite-channel-emoji">${channelEmoji}</span>
                <span>#${c.name || "general"}</span>
              </div>
            </div>
          </div>
          <div class="r6de-invite-members">
            <span class="r6de-invite-members-emoji">👥</span>
            <span class="r6de-invite-members-count">${memberCount.toLocaleString()} Mitglieder</span>
          </div>
        `;

        // Animation
        requestAnimationFrame(() => {
          if (currentTooltip && isHovering) {
            currentTooltip.style.visibility = "visible";
            currentTooltip.style.opacity = settings.store.popupOpacity.toString();
            currentTooltip.style.transform = "scale(1) translateY(0)";
          }
        });

        positionPopup(currentTooltip, e, 20, 20);
      };

      // ENTER
      link.addEventListener("mouseenter", (e) => {
        isHovering = true;
        setTimeout(() => {
          if (isHovering) createTooltip(e);
        }, 150);
      });

      // MOVE
      link.addEventListener("mousemove", (e) => {
        if (currentTooltip && isHovering) {
          positionPopup(currentTooltip, e, 20, 20);
        }
      });

      // LEAVE
      link.addEventListener("mouseleave", () => {
        isHovering = false;
        setTimeout(() => {
          if (currentTooltip && !isHovering) {
            currentTooltip.style.opacity = "0";
            currentTooltip.style.transform = "scale(0.95) translateY(12px)";
            setTimeout(() => {
              if (currentTooltip) {
                currentTooltip.remove();
                currentTooltip = null;
              }
            }, 200);
          }
        }, 50);
      });
    };

    // Mutation Observer
    const observer = new MutationObserver(mutations => {
      const nodesToProcess: HTMLElement[] = [];
      
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
          nodesToProcess.push(node);
        }
      }

      if (nodesToProcess.length === 0) return;

      requestAnimationFrame(() => {
        const avatarSelectors = [
          'img[class*="avatar"]', 
          '.wrapper__44b0c', 
          '.voiceUser_efcaf8 .userAvatar__55bab',
          '.voiceUser_efcaf8 .avatar__07f91',
          '.avatarContainer__6b330',
          'div[class*="avatar"][style*="background-image"]',
          '[class*="userPopout"] img[class*="avatar"]',
          '[class*="userProfile"] img[class*="avatar"]'
        ].join(', ');

        for (const node of nodesToProcess) {
          const avatars = node.querySelectorAll(avatarSelectors);
          avatars.forEach((avatar: Element) => {
            if (avatar instanceof HTMLElement) {
              handleAvatarHover(avatar);
            }
          });

          const links = node.querySelectorAll<HTMLAnchorElement>("a[href*='discord.gg'], a[href*='discord.com/invite']");
          links.forEach(handleInvitePreview);
        }
      });
    });

    // Initiale Verarbeitung
    requestAnimationFrame(() => {
      const initialAvatars = document.querySelectorAll(`
        img[class*="avatar"], 
        .wrapper__44b0c, 
        .voiceUser_efcaf8 .userAvatar__55bab,
        .voiceUser_efcaf8 .avatar__07f91,
        .avatarContainer__6b330,
        div[class*="avatar"][style*="background-image"],
        [class*="userPopout"] img[class*="avatar"],
        [class*="userProfile"] img[class*="avatar"]
      `);
      
      initialAvatars.forEach((avatar: Element) => {
        if (avatar instanceof HTMLElement) {
          handleAvatarHover(avatar);
        }
      });

      const initialLinks = document.querySelectorAll<HTMLAnchorElement>("a[href*='discord.gg'], a[href*='discord.com/invite']");
      initialLinks.forEach(handleInvitePreview);
    });

    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributeFilter: ['class', 'style']
    });
    
    this.observers.push(observer);

    // Resize-Handler
    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (popup.style.display === 'block') {
          adjustPopupPosition();
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });

    // Scroll-Handler
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (popup.style.display === 'block' && !isPinned && !isDragging) {
          popup.style.opacity = (settings.store.popupOpacity * 0.8).toString();
          
          clearTimeout(scrollTimeout!);
          scrollTimeout = setTimeout(() => {
            if (popup.style.display === 'block') {
              popup.style.opacity = settings.store.popupOpacity.toString();
            }
          }, 300);
        }
      }, 30);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup
    const cleanup = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (hoverTimer) clearTimeout(hoverTimer);
      if (avatarLeaveTimer) clearTimeout(avatarLeaveTimer);
      
      if (cleanupInterval) clearInterval(cleanupInterval);
      
      gentleInviteCleanup();
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };

    // Escape-Key Handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' || e.key === 'Tab') {
        document.querySelectorAll('.r6de-invite-preview').forEach(el => {
          el.remove();
        });
        if (!isPinned) {
          hidePopupWithAnimation();
          activeView = 'summary';
          detailSourceView = null;
        }
      }
    });

    // Invite-Cleanup
    const gentleInviteCleanup = () => {
      document.querySelectorAll('.r6de-invite-preview').forEach(el => {
        const age = Date.now() - (parseInt(el.dataset.created || '0') || Date.now());
        if (age > 3000) {
          el.remove();
        }
      });
    };

    document.addEventListener('scroll', gentleInviteCleanup, { passive: true });
    
    const cleanupInterval = setInterval(gentleInviteCleanup, 5000);

    window.addEventListener('beforeunload', cleanup, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        gentleInviteCleanup();
      }
    });
  },

  stop() {
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    
    let intervalId = setInterval(() => {}, 1000);
    for (let i = 0; i <= intervalId; i++) {
      clearInterval(i);
    }
    
    const popup = document.getElementById("r6de-supporter-popup");
    if (popup) popup.remove();
    
    document.querySelectorAll('.r6de-invite-preview').forEach(el => {
      el.remove();
    });
    
    let timeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i <= timeoutId; i++) {
      clearTimeout(i);
    }
    
    document.querySelectorAll('[data-r6de-processed]').forEach(el => {
      el.removeAttribute("data-r6de-processed");
    });
    document.querySelectorAll('[data-r6de-invite-processed]').forEach(el => {
      el.removeAttribute("data-r6de-invite-processed");
    });
    
    document.querySelectorAll('style[data-strafakte-plugin-style]').forEach(el => el.remove());
    
    ['resize', 'scroll', 'beforeunload', 'keydown', 'visibilitychange'].forEach(event => {
      window.removeEventListener(event, () => {});
      document.removeEventListener(event, () => {});
    });
    
    console.log("R6DE Plugin 4.0 gestoppt!");
  }
});
