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
    default: 380,
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
    default: 0.98,
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
    default: 250,
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
  description: "Strafakte, Einladungsvorschau & Sprachbenachrichtigungen",
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
    
    // Popup Container mit modernem Design
    const popup = document.createElement("div");
    popup.id = "r6de-supporter-popup";
    popup.classList.add("r6de-supporter-popup");
    
// Modernes schwarzes Design mit blauen Akzenten
Object.assign(popup.style, {
  position: "fixed",
  background: `linear-gradient(135deg, rgba(10, 10, 15, 0.95), rgba(15, 15, 25, 0.90))`,
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  color: settings.store.textColor,
  padding: "18px",
  borderRadius: settings.store.roundedCorners ? "14px" : "0",
  fontSize: "13px",
  zIndex: "9999",
  pointerEvents: "auto",
  display: "none",
  width: settings.store.popupWidth + "px",
  maxHeight: settings.store.popupMaxHeight > 0 ? settings.store.popupMaxHeight + "px" : 'none',
  overflowY: "auto",
  boxShadow: `
    0 25px 50px rgba(0,0,0,0.7),
    0 10px 25px rgba(37, 99, 235, 0.2),
    inset 0 1px 0 rgba(255,255,255,0.1),
    0 0 0 1px rgba(255,255,255,0.05)
  `,
  fontFamily: "'Inter', 'SF Pro Display', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  fontWeight: "500",
  lineHeight: "1.6",
  cursor: "grab",
  border: `1px solid rgba(255,255,255,0.08)`,
  opacity: settings.store.popupOpacity.toString(),
  visibility: "hidden",
  transform: "scale(0.95) translateY(10px)",
  transition: settings.store.tooltipAnimation 
    ? `all ${settings.store.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
    : "none",
  willChange: "transform, opacity"
});
    
    document.body.appendChild(popup);

    // Erweiterte CSS-Styles für modernes Design mit Animationen
    const scrollFixStyle = document.createElement("style");
    scrollFixStyle.textContent = `
      .r6de-supporter-popup::-webkit-scrollbar {
        width: 6px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #2563eb, #1d4ed8);
        border-radius: 3px;
        transition: background 0.3s ease;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #3b82f6, #2563eb);
      }
      .strafakte-list-container::-webkit-scrollbar {
        width: 4px;
      }
      .strafakte-list-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 2px;
      }
      .strafakte-list-container::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #2563eb80, #1d4ed880);
        border-radius: 2px;
      }
    `;
    document.head.appendChild(scrollFixStyle);

    // Verbesserte Dragging-Logik mit Performance-Optimierung
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
          ? `all ${settings.store.animationDuration}ms cubic-bezier(0.4, 0.0, 0.2, 1)`
          : "none";
      }
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
    document.addEventListener("mouseleave", mouseUpHandler);

    // Erweitertes CSS für ultra-modernes Design
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      .r6de-supporter-popup {
        --primary-blue: #2563eb;
        --primary-blue-dark: #1d4ed8;
        --primary-blue-light: #3b82f6;
        --primary-blue-glow: rgba(37, 99, 235, 0.4);
        --surface-color: rgba(15, 15, 25, 0.95);
        --surface-hover: rgba(25, 25, 40, 0.8);
        --text-primary: #e1e7ff;
        --text-secondary: #9ca3af;
        --success-color: #10b981;
        --warning-color: #f59e0b;
        --error-color: #ef4444;
        --shadow-glow: 0 0 20px var(--primary-blue-glow);
      }
      
      /* Einladungsvorschau Styling */
      .r6de-invite-preview {
        background: linear-gradient(135deg, rgba(10, 10, 15, 0.95), rgba(15, 15, 25, 0.90)) !important;
        backdrop-filter: blur(20px) saturate(180%) !important;
        -webkit-backdrop-filter: blur(20px) saturate(180%) !important;
        color: var(--text-primary) !important;
        padding: 18px !important;
        border-radius: ${settings.store.roundedCorners ? "14px" : "0"} !important;
        font-size: 13px !important;
        font-family: 'Inter', 'SF Pro Display', 'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif !important;
        font-weight: 500 !important;
        line-height: 1.6 !important;
        box-shadow: 
          0 25px 50px rgba(0,0,0,0.7),
          0 10px 25px rgba(37, 99, 235, 0.2),
          inset 0 1px 0 rgba(255,255,255,0.1),
          0 0 0 1px rgba(255,255,255,0.05) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        opacity: ${settings.store.popupOpacity} !important;
        transition: ${settings.store.tooltipAnimation 
          ? `all ${settings.store.animationDuration}ms cubic-bezier(0.34, 1.56, 0.64, 1)`
          : "none"} !important;
        will-change: transform, opacity !important;
      }
      
      .r6de-invite-preview img {
        border: 2px solid rgba(37, 99, 235, 0.4) !important;
        transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1) !important;
        box-shadow: 0 3px 12px rgba(0,0,0,0.3) !important;
      }
      
      .r6de-invite-preview img:hover {
        transform: scale(1.05) !important;
        border-color: var(--primary-blue) !important;
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4) !important;
      }
      
      .strafakte-button {
        background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
        color: white;
        border: none;
        padding: 0;
        border-radius: 8px;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 3px 8px rgba(37, 99, 235, 0.3);
        position: relative;
        overflow: hidden;
        transform-origin: center;
      }
      
      .strafakte-button::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.5s ease;
      }
      
      .strafakte-button:hover {
        transform: scale(1.08) translateY(-1px);
        box-shadow: 0 6px 16px rgba(37, 99, 235, 0.4), var(--shadow-glow);
        background: linear-gradient(135deg, var(--primary-blue-light), var(--primary-blue));
      }
      
      .strafakte-button:hover::before {
        left: 100%;
      }
      
      .strafakte-button:active {
        transform: scale(1.05) translateY(-1px);
        transition: all 0.1s ease;
      }
      
      .strafakte-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
      }
      
      .strafakte-button.pinned {
        background: linear-gradient(135deg, var(--success-color), #059669);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
      }
      
      .strafakte-button.pinned:hover {
        background: linear-gradient(135deg, #34d399, var(--success-color));
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
      }
      
      .strafakte-button.unpinned {
        background: linear-gradient(135deg, var(--error-color), #dc2626);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
      }
      
      .strafakte-button.unpinned:hover {
        background: linear-gradient(135deg, #f87171, var(--error-color));
        box-shadow: 0 8px 20px rgba(239, 68, 68, 0.5);
      }

      .strafakte-button.close {
        background: none !important;
        color: var(--error-color);
        font-size: 20px;
        box-shadow: none;
        transition: all 0.3s ease;
        width: 36px;
        height: 36px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      .strafakte-button.close:hover {
        transform: scale(1.2) rotate(90deg);
        color: #ff6b6b;
        text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
        background: rgba(255, 107, 107, 0.1) !important;
        border-radius: 50%;
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
        border-radius: 50%;
        margin-right: 12px;
        object-fit: cover;
        border: 2px solid rgba(37, 99, 235, 0.4);
        transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 3px 12px rgba(0,0,0,0.3);
        position: relative;
      }
      
      .strafakte-avatar::before {
        content: '';
        position: absolute;
        inset: -2px;
        border-radius: 50%;
        background: linear-gradient(45deg, var(--primary-blue), var(--primary-blue-light), var(--primary-blue));
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: -1;
      }
      
      .strafakte-avatar:hover {
        transform: scale(1.15) rotate(5deg);
        border-color: var(--primary-blue);
        box-shadow: 0 8px 24px rgba(37, 99, 235, 0.4);
      }
      
      .strafakte-avatar:hover::before {
        opacity: 1;
      }
      
      .strafakte-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(37, 99, 235, 0.2);
        position: relative;
      }
      
      .strafakte-header::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 1px;
        background: linear-gradient(90deg, transparent, var(--primary-blue), transparent);
        opacity: 0.6;
      }
      
      .strafakte-user-info {
        flex: 1;
        min-width: 0;
        margin-right: 12px;
      }
      
      .strafakte-username {
        font-weight: 700;
        font-size: 16px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.2px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        background: linear-gradient(135deg, #fff, #e1e7ff);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        transition: all 0.3s ease;
      }
      
      .strafakte-username:hover {
        transform: translateX(2px);
      }
      
      .strafakte-userid {
        font-size: 12px;
        color: var(--text-secondary);
        margin-top: 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: 'JetBrains Mono', 'Consolas', monospace;
        opacity: 0.8;
        transition: color 0.3s ease;
      }
      
      .strafakte-userid:hover {
        color: var(--primary-blue-light);
      }
      
      .strafakte-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(85px, 1fr));
        gap: 10px;
        margin-bottom: 16px;
      }
      
      .strafakte-stat {
        background: linear-gradient(135deg, var(--surface-color), rgba(25, 25, 40, 0.6));
        border-radius: 10px;
        padding: 12px 8px;
        text-align: center;
        cursor: pointer;
        transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        border: 1px solid rgba(37, 99, 235, 0.1);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
      }
      
      .strafakte-stat::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--primary-blue), var(--primary-blue-light));
        transform: scaleX(0);
        transition: transform 0.3s ease;
      }
      
      .strafakte-stat:hover {
        background: linear-gradient(135deg, var(--surface-hover), rgba(37, 99, 235, 0.1));
        transform: translateY(-4px) scale(1.02);
        box-shadow: 0 12px 28px rgba(0,0,0,0.3), 0 0 20px rgba(37, 99, 235, 0.2);
        border-color: var(--primary-blue);
      }
      
      .strafakte-stat:hover::before {
        transform: scaleX(1);
      }
      
      .strafakte-stat:active {
        transform: translateY(-2px) scale(1.01);
      }
      
      .strafakte-stat-value {
        font-weight: 800;
        font-size: 20px;
        color: var(--primary-blue-light);
        line-height: 1;
        text-shadow: 0 2px 8px rgba(37, 99, 235, 0.3);
        transition: all 0.3s ease;
      }
      
      .strafakte-stat:hover .strafakte-stat-value {
        color: #fff;
        text-shadow: 0 0 15px var(--primary-blue-glow);
        transform: scale(1.08);
      }
      
      .strafakte-stat-label {
        font-size: 10px;
        color: var(--text-secondary);
        margin-top: 6px;
        letter-spacing: 0.8px;
        text-transform: uppercase;
        font-weight: 600;
        transition: color 0.3s ease;
      }
      
      .strafakte-stat:hover .strafakte-stat-label {
        color: var(--text-primary);
      }
      
      .strafakte-warning {
        background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05));
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 16px;
        font-size: 12px;
        display: flex;
        align-items: center;
        border-left: 3px solid var(--warning-color);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
      }
      
      .strafakte-warning::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(45deg, transparent, rgba(245, 158, 11, 0.1), transparent);
        transform: translateX(-100%);
        transition: transform 0.6s ease;
      }
      
      .strafakte-warning:hover::before {
        transform: translateX(100%);
      }
      
      .strafakte-list-container {
        max-height: 240px;
        overflow-y: auto;
        padding-right: 6px;
        scroll-behavior: smooth;
        margin-top: 6px;
      }
      
      .strafakte-list-title {
        margin-bottom: 12px;
        font-size: 15px;
        color: var(--primary-blue-light);
        border-bottom: 2px solid rgba(37, 99, 235, 0.2);
        padding-bottom: 10px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 700;
        position: relative;
      }
      
      .strafakte-list-title::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 40px;
        height: 2px;
        background: var(--primary-blue);
        transition: width 0.3s ease;
      }
      
      .strafakte-list-title:hover::after {
        width: 100%;
      }
      
      .strafakte-back-button {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
        border: 1px solid rgba(37, 99, 235, 0.3);
        color: var(--primary-blue-light);
        cursor: pointer;
        font-size: 13px;
        display: flex;
        align-items: center;
        padding: 8px 12px;
        border-radius: 8px;
        transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
        font-weight: 600;
        backdrop-filter: blur(10px);
      }
      
      .strafakte-back-button:hover {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1));
        color: #fff;
        transform: translateX(-3px);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
      }
      
      .strafakte-entry {
        padding: 10px 12px;
        margin-bottom: 8px;
        background: linear-gradient(135deg, var(--surface-color), rgba(25, 25, 40, 0.4));
        border-radius: 10px;
        border-left: 3px solid;
        font-size: 12px;
        line-height: 1.5;
        transition: all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1);
        box-shadow: 0 3px 8px rgba(0,0,0,0.2);
        cursor: pointer;
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
      }
      
      .strafakte-entry::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.05), transparent);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      .strafakte-entry:hover {
        transform: translateX(6px) translateY(-2px);
        background: linear-gradient(135deg, var(--surface-hover), rgba(37, 99, 235, 0.1));
        box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(37, 99, 235, 0.15);
      }
      
      .strafakte-entry:hover::before {
        opacity: 1;
      }
      
      .strafakte-entry > div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        transition: color 0.3s ease;
      }
      
      .strafakte-entry:hover > div {
        color: var(--text-primary);
      }
      
      /* Kategorie-Farben mit Glow-Effekten */
      .strafakte-penalty-category-A { 
        border-color: var(--success-color);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }
      .strafakte-penalty-category-B { 
        border-color: var(--warning-color);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }
      .strafakte-penalty-category-C { 
        border-color: #f97316;
        box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
      }
      .strafakte-penalty-category-D { 
        border-color: var(--error-color);
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
      }
      .strafakte-penalty-category-E { 
        border-color: #8b5cf6;
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.2);
      }
      .strafakte-penalty-category-KICK { 
        border-color: #ff9500;
        box-shadow: 0 4px 12px rgba(255, 149, 0, 0.2);
      }
      .strafakte-penalty-category-UNKNOWN { 
        border-color: #6b7280;
        box-shadow: 0 4px 12px rgba(107, 114, 128, 0.2);
      }
      
      .strafakte-warning-entry { 
        border-color: var(--warning-color);
        box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2);
      }
      .strafakte-unban-entry { 
        border-color: var(--success-color);
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
      }
      .strafakte-watchlist-entry { 
        border-color: var(--primary-blue);
        box-shadow: 0 4px 12px rgba(37, 99, 235, 0.2);
      }
      
      .strafakte-entry-expired {
        opacity: 0.6;
        border-left-style: dashed;
        filter: grayscale(40%);
      }
      
      .strafakte-entry-category {
        display: inline-block;
        font-size: 10px;
        padding: 4px 10px;
        border-radius: 16px;
        margin-top: 8px;
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(37, 99, 235, 0.1));
        border: 1px solid rgba(37, 99, 235, 0.3);
        font-weight: 700;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        transition: all 0.3s ease;
      }
      
      .strafakte-entry:hover .strafakte-entry-category {
        background: linear-gradient(135deg, var(--primary-blue), var(--primary-blue-dark));
        color: white;
        transform: scale(1.05);
      }
      
      .strafakte-entry-date {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 8px;
        font-style: italic;
        color: var(--text-secondary);
        transition: color 0.3s ease;
      }
      
      .strafakte-entry:hover .strafakte-entry-date {
        color: var(--primary-blue-light);
      }
      
      .strafakte-section {
        margin-bottom: 12px;
        font-size: 16px;
        color: var(--primary-blue-light);
        border-bottom: 2px solid rgba(37, 99, 235, 0.2);
        padding-bottom: 12px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 700;
        position: relative;
      }
      
      .strafakte-section:hover {
        color: #fff;
        text-shadow: 0 0 10px var(--primary-blue-glow);
        transform: translateX(4px);
      }
      
      .strafakte-empty-state {
        text-align: center;
        padding: 24px;
        opacity: 0.6;
        font-style: italic;
        font-size: 14px;
        color: var(--text-secondary);
        transition: all 0.3s ease;
      }
      
      .strafakte-empty-state:hover {
        opacity: 0.8;
        color: var(--text-primary);
      }
      
      .strafakte-tab-content {
        animation: slideInUp 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
      }
      
      .strafakte-detail-view {
        background: linear-gradient(135deg, rgba(37, 99, 235, 0.1), rgba(37, 99, 235, 0.05));
        border-radius: 12px;
        padding: 16px;
        margin-top: 12px;
        animation: slideInUp 0.4s ease;
        border: 1px solid rgba(37, 99, 235, 0.2);
        backdrop-filter: blur(10px);
      }
      
      .strafakte-detail-title {
        font-weight: 700;
        font-size: 16px;
        margin-bottom: 12px;
        color: var(--primary-blue-light);
        display: flex;
        align-items: center;
        gap: 8px;
        text-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }
      
      .strafakte-detail-title::before {
        content: "📋";
        filter: drop-shadow(0 0 5px rgba(37, 99, 235, 0.5));
      }
      
      .strafakte-detail-field {
        margin-bottom: 12px;
        padding: 12px 0;
        border-bottom: 1px solid rgba(37, 99, 235, 0.1);
        transition: all 0.3s ease;
      }
      
      .strafakte-detail-field:hover {
        background: rgba(37, 99, 235, 0.05);
        border-radius: 8px;
        padding: 12px;
        margin: 4px 0;
      }
      
      .strafakte-detail-label {
        font-weight: 700;
        font-size: 12px;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 6px;
        transition: color 0.3s ease;
      }
      
      .strafakte-detail-field:hover .strafakte-detail-label {
        color: var(--primary-blue-light);
      }
      
      .strafakte-detail-value {
        font-size: 14px;
        word-break: break-word;
        color: var(--text-primary);
        transition: color 0.3s ease;
      }
      
      .strafakte-detail-field:hover .strafakte-detail-value {
        color: #fff;
      }
      
      @keyframes slideInUp {
        from { 
          opacity: 0; 
          transform: translateY(20px); 
        }
        to { 
          opacity: 1; 
          transform: translateY(0); 
        }
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
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
        width: 56px;
        height: 56px;
        margin-bottom: 20px;
        border: 4px solid rgba(37, 99, 235, 0.2);
        border-radius: 50%;
        border-top-color: var(--primary-blue);
        animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
        filter: drop-shadow(0 0 10px var(--primary-blue-glow));
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 15px;
        color: var(--text-secondary);
        margin-top: 12px;
        animation: pulse 2s ease-in-out infinite;
      }

      /* Minimalistisches Design */
      .minimalist-popup .strafakte-header {
        padding-bottom: 16px;
        margin-bottom: 16px;
      }
      
      .minimalist-popup .strafakte-avatar {
        width: 40px;
        height: 40px;
      }
      
      .minimalist-popup .strafakte-username {
        font-size: 15px;
      }
      
      .minimalist-popup .strafakte-userid {
        font-size: 10px;
      }
      
      .minimalist-popup .strafakte-stat {
        padding: 12px 6px;
        min-width: 75px;
      }
      
      .minimalist-popup .strafakte-stat-value {
        font-size: 18px;
      }
      
      .minimalist-popup .strafakte-stat-label {
        font-size: 9px;
      }
      
      .minimalist-popup .strafakte-warning {
        padding: 10px 12px;
        font-size: 12px;
      }
      
      .minimalist-popup .strafakte-list-container {
        max-height: 200px;
      }
      
      .minimalist-popup .strafakte-entry {
        padding: 10px 12px;
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);

    let popupHideTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentUserId: string | null = null;
    let isPinned = settings.store.defaultPinned;
    let currentStrafakteData: StrafakteData | null = null;
    let strafakteMouseMoveHandler: ((event: MouseEvent) => void) | null = null;
    const inviteRegex = /https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/([\w-]+)/;
    
    // Verbesserte Interaktionsflags
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

    // Verbesserte Positionierung mit Performance-Optimierung
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

    // Positionsanpassung nur bei Bedarf - keine kontinuierliche Überwachung
    function adjustPopupPosition() {
      if (!popup || popup.style.display === 'none') return;

      requestAnimationFrame(() => {
        const rect = popup.getBoundingClientRect();
        const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
        const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
        const margin = 10;

        let left = parseFloat(popup.style.left) || 0;
        let top = parseFloat(popup.style.top) || 0;
        let needsUpdate = false;

        // Prüfe rechten Rand
        if (left + rect.width > vw - margin) {
          left = vw - rect.width - margin;
          needsUpdate = true;
        }
        
        // Prüfe unteren Rand  
        if (top + rect.height > vh - margin) {
          top = vh - rect.height - margin;
          needsUpdate = true;
        }
        
        // Prüfe linken Rand
        if (left < margin) {
          left = margin;
          needsUpdate = true;
        }
        
        // Prüfe oberen Rand
        if (top < margin) {
          top = margin;
          needsUpdate = true;
        }

        // Nur updaten wenn nötig
        if (needsUpdate) {
          popup.style.left = left + "px";
          popup.style.top = top + "px";
        }

        // Dynamische Höhenanpassung
        const maxAllowedHeight = Math.min(
          settings.store.popupMaxHeight,
          vh - top - margin
        );
        
        if (parseInt(popup.style.maxHeight) !== maxAllowedHeight) {
          popup.style.maxHeight = maxAllowedHeight + "px";
        }
      });
    }

    // Monitor-Check vor Content-Updates
    function isPopupInViewport(): boolean {
      if (!popup || popup.style.display === 'none') return true;
      
      const rect = popup.getBoundingClientRect();
      const vw = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
      const vh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
      
      return (
        rect.left >= 0 &&
        rect.top >= 0 &&
        rect.right <= vw &&
        rect.bottom <= vh
      );
    }

    // Popup-Animationen ohne kontinuierliche Überwachung
    function showPopupWithAnimation() {
      popup.style.display = "block";
      popup.style.visibility = "hidden";
      popup.style.opacity = "0";
      popup.style.transform = "scale(0.95) translateY(10px)";
      
      requestAnimationFrame(() => {
        popup.style.visibility = "visible";
        popup.style.opacity = settings.store.popupOpacity.toString();
        popup.style.transform = "scale(1) translateY(0)";
        
        // Position nach Animation anpassen
        setTimeout(() => adjustPopupPosition(), settings.store.animationDuration);
      });
    }

    function hidePopupWithAnimation() {
      if (settings.store.tooltipAnimation) {
        popup.style.opacity = "0";
        popup.style.transform = "scale(0.95) translateY(10px)";
        
        setTimeout(() => {
          popup.style.display = "none";
          popup.style.visibility = "hidden";
        }, settings.store.animationDuration);
      } else {
        popup.style.display = "none";
      }
    }

    // Benutzer-ID Extraktion (unverändert)
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

    // Kontextmenü-Methode (unverändert)
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

    // VERBESSERTE Strafe-Kategorisierung mit korrekter Ban-Erkennung
    function parseStrafeKategorie(strafe: string): string {
      const cleanStrafe = strafe.replace(/^\*\*|\*\*$/g, '').trim().toLowerCase();
      
      // CRITICAL FIX: Ban-Erkennung hat höchste Priorität
      if (cleanStrafe.includes('ban') && !cleanStrafe.includes('unban') && !cleanStrafe.includes('entban')) {
        return "E"; // Alle Bans sind Kategorie E
      }
      
      // Warn-Erkennung
      if (cleanStrafe.includes('warn')) return "B";
      
      // Kick-Erkennung
      if (cleanStrafe.includes('kick')) return "KICK";
      
      // Zeit-basierte Strafen (nur wenn kein Ban erkannt wurde)
      if (cleanStrafe.includes('1h') || cleanStrafe.includes('1 h') || cleanStrafe.includes('1 stunde')) return "A";
      
      // Tage-basierte Strafen (nur wenn kein Ban erkannt wurde)
      const match = cleanStrafe.match(/(\d+)d/i);
      if (match) {
        const days = parseInt(match[1]);
        if (days <= 3) return "C";
        if (days <= 7) return "D";
        return "E"; // Längere Zeitstrafen sind auch E
      }
      
      // Alles andere was nicht erkannt wird
      return "?";
    }

    // Token-Helper (unverändert)
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

    // Verbesserte Strafakte-Abrufung mit korrekter Ban/Unban-Unterscheidung
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

        // Verarbeitung der Strafakte-Nachrichten mit verbesserter Ban/Unban-Logik
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
          
          // VERBESSERTE Entbannungs-Erkennung: Prüfe explizit auf Entbannungs-Keywords
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

          // Verarbeite normale Strafen
          const offenseLine = content.split("\n").find(line => line.toLowerCase().startsWith("tat:"));
          const offense = offenseLine?.replace(/Tat:/i, "").trim() || "Keine Tat angegeben";
          
          const strafeLine = content.split("\n").find(line => line.toLowerCase().startsWith("strafe:"));
          const strafeText = strafeLine?.replace(/Strafe:/i, "").trim() || "";

          if (!strafeText) continue;

          const kat = parseStrafeKategorie(strafeText);
          
          // Verwarnungen separat behandeln
          if (kat === "B") {
            warnCount++;
            warnings.push({
              offense,
              date: new Date(msg.timestamp)
            });
            continue;
          }
          
          // Unbekannte Kategorien überspringen
          if (kat === "?") continue;

          const timestamp = new Date(msg.timestamp);
          const ageDays = (Date.now() - timestamp.getTime()) / 86400000;
          
          // Ablauf-Logik: Kicks und Bans (E) laufen nie ab
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

    // View-Management (unverändert)
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

    // Detailansicht rendern (unverändert aber mit verbessertem Styling)
    function renderDetailView() {
      if (!detailEntry) return '';

      let detailHtml = `
        <div class="strafakte-detail-title">Detailinformationen</div>
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

    // Hauptrender-Funktion mit verbessertem Design
    function renderStrafakteContent() {
      if (!currentStrafakteData) {
        popup.innerHTML = "Keine Daten verfügbar";
        return;
      }

      // Monitor-Check vor Content-Update
      if (!isPopupInViewport()) {
        adjustPopupPosition();
      }

      const oldLeft = popup.style.left;
      const oldTop = popup.style.top;
      
      const minimalistClass = settings.store.minimalistPopup ? "minimalist-popup" : "";
      
      let contentHtml = `
        <div class="strafakte-header ${minimalistClass}">
          ${settings.store.showAvatars && currentStrafakteData.avatarUrl ? ` 
            <img src="${currentStrafakteData.avatarUrl}" class="strafakte-avatar" />
          ` : '<div class="strafakte-avatar" style="background:linear-gradient(135deg,#2c2f33,#1a1d21);display:flex;align-items:center;justify-content:center;font-size:24px;color:#7289da">👤</div>'}
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
              ${isPinned ? '🔒' : '📌'}
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
                  <div class="strafakte-stat-label">Verwarnungen</div>
                </div>
                <div class="strafakte-stat" data-view="unbans">
                  <div class="strafakte-stat-value">${currentStrafakteData.unbanCount}</div>
                  <div class="strafakte-stat-label">Entbannungen</div>
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
                <div style="text-align:center;padding:15px;color:var(--error-color);background:rgba(239,68,68,0.1);border-radius:12px;border:1px solid rgba(239,68,68,0.3)">
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

      // Event Listener hinzufügen mit verbesserter Performance
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
              copyBtn.style.background = "linear-gradient(135deg, var(--success-color), #059669)";
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
          
          refreshBtn.style.transform = "rotate(360deg)";
          refreshBtn.style.transition = "transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1)";
          
          setTimeout(() => {
            if (refreshBtn) {
              refreshBtn.style.transform = "rotate(0deg)";
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
            pinBtn.innerHTML = isPinned ? '🔒' : '📌';
            pinBtn.title = isPinned ? 'Angepinnt' : 'Anheften';
          }
        });
      };

      requestAnimationFrame(addEventListeners);
      
      // Sofortige Positionsanpassung nach Content-Update
      requestAnimationFrame(() => {
        adjustPopupPosition();
      });
    }

    // Verbesserte Popup-Interaktionen
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

    // Verbesserte Avatar-Hover-Logik
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
                <div class="strafakte-avatar" style="background:linear-gradient(135deg,#2c2f33,#1a1d21);display:flex;align-items:center;justify-content:center;font-size:24px;color:#7289da">❌</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Fehler</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">×</button>
                </div>
              </div>
              <div style="padding:24px;text-align:center;color:var(--error-color);background:rgba(239,68,68,0.1);border-radius:12px;border:1px solid rgba(239,68,68,0.3)">
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
                <div class="strafakte-avatar" style="background:linear-gradient(135deg,#2c2f33,#1a1d21);display:flex;align-items:center;justify-content:center;font-size:24px;color:#7289da">🤖</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Bot</div>
                  <div class="strafakte-userid">${finalUserId}</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">×</button>
                </div>
              </div>
              <div style="padding:24px;text-align:center;color:var(--text-secondary)">
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

    // Verbesserte Einladungsvorschau mit komplettem Styling und Anti-Stuck-Mechanismus
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
      let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
      let leaveTimeout: ReturnType<typeof setTimeout> | null = null;

      // Daten vorab laden
      fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true&with_expiration=true`)
        .then(res => res.json())
        .then(data => {
          isDataLoaded = true;
          cachedData = data;
        })
        .catch(error => {
          console.error("Fehler beim Abrufen der Einladung:", error);
        });

      const cleanupTooltip = () => {
        if (currentTooltip) {
          if (settings.store.tooltipAnimation) {
            currentTooltip.style.opacity = "0";
            currentTooltip.style.transform = "scale(0.95) translateY(10px)";
            
            setTimeout(() => {
              if (currentTooltip) {
                currentTooltip.remove();
                currentTooltip = null;
              }
            }, settings.store.animationDuration);
          } else {
            currentTooltip.remove();
            currentTooltip = null;
          }
        }
      };

      const showTooltip = (e: MouseEvent) => {
        // Cleanup existing tooltip
        if (currentTooltip) {
          cleanupTooltip();
        }

        if (!isDataLoaded || !cachedData) return;

        currentTooltip = document.createElement("div");
        currentTooltip.className = "r6de-invite-preview";
        
        Object.assign(currentTooltip.style, {
          position: "fixed",
          zIndex: "10001",
          maxWidth: "320px",
          pointerEvents: "none",
          display: "block",
          visibility: "hidden",
          opacity: "0",
          transform: "scale(0.95) translateY(10px)"
        });
        
        document.body.appendChild(currentTooltip);

        const g = cachedData.guild || {}, c = cachedData.channel || {};
        const icon = g.id && g.icon
          ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64" style="width:52px;height:52px;border-radius:12px;margin-bottom:12px;">`
          : `<div style="width:52px;height:52px;border-radius:12px;margin-bottom:12px;background:linear-gradient(135deg,#2c2f33,#1a1d21);display:flex;align-items:center;justify-content:center;font-size:24px;color:#7289da;border:2px solid rgba(37, 99, 235, 0.4);">🏷️</div>`;
        
        const channelTypes = ["Text", "DM", "Voice", "Gruppen-DM", "Kategorie", "Neuigkeiten", "Shop", "Bühne", "Forum"];

        currentTooltip.innerHTML = `
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
            ${icon}
            <div>
              <div style="font-weight:700;font-size:16px;color:#fff;margin-bottom:4px;background: linear-gradient(135deg, #fff, #e1e7ff);-webkit-background-clip: text;-webkit-text-fill-color: transparent;background-clip: text;">🏷️ ${g.name || "Unbekannt oder abgelaufen"}</div>
              <div style="color:var(--text-secondary);font-size:13px;opacity:0.8;">💬 #${c.name || "?"} (${channelTypes[c.type] || "Unbekannt"})</div>
            </div>
          </div>
          <div style="color:var(--primary-blue-light);font-weight:600;font-size:14px;text-shadow: 0 2px 4px rgba(0,0,0,0.3);">👥 ${cachedData.approximate_member_count || "Unbekannt"} Mitglieder</div>
        `;

        // Animation
        requestAnimationFrame(() => {
          if (currentTooltip) {
            currentTooltip.style.visibility = "visible";
            currentTooltip.style.opacity = settings.store.popupOpacity.toString();
            currentTooltip.style.transform = "scale(1) translateY(0)";
          }
        });

        positionPopup(currentTooltip, e as MouseEvent, 15, 15);
      };

      link.addEventListener("mouseenter", (e) => {
        e.stopPropagation();
        e.preventDefault();
        
        // Clear any existing timeouts
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (leaveTimeout) clearTimeout(leaveTimeout);
        
        // Debounce hover
        hoverTimeout = setTimeout(() => {
          showTooltip(e);
        }, 100);
      });

      link.addEventListener("mousemove", (e) => {
        if (currentTooltip && currentTooltip.style.opacity !== "0") {
          positionPopup(currentTooltip, e as MouseEvent, 15, 15);
        }
      });

      link.addEventListener("mouseleave", () => {
        // Clear hover timeout
        if (hoverTimeout) {
          clearTimeout(hoverTimeout);
          hoverTimeout = null;
        }
        
        // Debounced cleanup
        leaveTimeout = setTimeout(() => {
          cleanupTooltip();
        }, 50);
      });

      // Emergency cleanup on click
      link.addEventListener("click", () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        if (leaveTimeout) clearTimeout(leaveTimeout);
        cleanupTooltip();
      });
    };

    // Performance-optimierte Mutation Observer
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
          // Avatar-Hover verarbeiten
          const avatars = node.querySelectorAll(avatarSelectors);
          avatars.forEach((avatar: Element) => {
            if (avatar instanceof HTMLElement) {
              handleAvatarHover(avatar);
            }
          });

          // Einladungslinks verarbeiten
          const links = node.querySelectorAll<HTMLAnchorElement>("a[href*='discord.gg'], a[href*='discord.com/invite']");
          links.forEach(handleInvitePreview);
        }
      });
    });

    // Initiale Verarbeitung vorhandener Elemente
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

    // Performance-optimierte Observer-Konfiguration
    observer.observe(document.body, { 
      childList: true, 
      subtree: true,
      attributeFilter: ['class', 'style'] // Nur relevante Attribute überwachen
    });
    
    this.observers.push(observer);

    // Resize-Handler mit Throttling
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

    // Scroll-Handler für bessere Positionierung
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleScroll = () => {
      if (scrollTimeout) clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        if (popup.style.display === 'block' && !isPinned && !isDragging) {
          // Popup bei Scrollen leicht ausblenden
          popup.style.opacity = (settings.store.popupOpacity * 0.7).toString();
          
          clearTimeout(scrollTimeout!);
          scrollTimeout = setTimeout(() => {
            if (popup.style.display === 'block') {
              popup.style.opacity = settings.store.popupOpacity.toString();
            }
          }, 500);
        }
      }, 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Cleanup bei Page-Unload mit verbesserter Invite-Cleanup
    const cleanup = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      if (scrollTimeout) clearTimeout(scrollTimeout);
      if (hoverTimer) clearTimeout(hoverTimer);
      if (avatarLeaveTimer) clearTimeout(avatarLeaveTimer);
      
      // Force-cleanup aller Invite-Tooltips
      document.querySelectorAll('.r6de-invite-preview').forEach(el => {
        el.remove();
      });
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };

    // Cleanup bei Page-Unload und auch bei Visibility-Change
    window.addEventListener('beforeunload', cleanup, { once: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        // Cleanup wenn Tab nicht sichtbar
        document.querySelectorAll('.r6de-invite-preview').forEach(el => {
          el.remove();
        });
      }
    });

    // Globaler Escape-Key Handler für Cleanup
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
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
  },

  stop() {
    // Cleanup alle Observer
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];
    
    // Entferne alle Plugin-Elemente
    const popup = document.getElementById("r6de-supporter-popup");
    if (popup) popup.remove();
    
    // FORCE-CLEANUP: Entferne alle hängenden Invite-Previews
    document.querySelectorAll('.r6de-invite-preview').forEach(el => {
      el.remove();
    });
    
    // Clear alle Timeouts global
    let timeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i <= timeoutId; i++) {
      clearTimeout(i);
    }
    
    // Reset alle Attribute
    document.querySelectorAll('[data-r6de-processed]').forEach(el => {
      el.removeAttribute("data-r6de-processed");
    });
    document.querySelectorAll('[data-r6de-invite-processed]').forEach(el => {
      el.removeAttribute("data-r6de-invite-processed");
    });
    
    // Entferne Plugin-Styles
    document.querySelectorAll('style[data-strafakte-plugin-style]').forEach(el => el.remove());
    
    // Cleanup Event-Listener
    window.removeEventListener('resize', () => {});
    window.removeEventListener('scroll', () => {});
    window.removeEventListener('beforeunload', () => {});
    
    console.log("R6DE Plugin erfolgreich gestoppt - Alle Tooltips entfernt");
  }
});
