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
    max: 2000
  },
  roundedCorners: {
    type: OptionType.BOOLEAN,
    description: "Abgerundete Ecken",
    default: true
  },
  backgroundColor: {
    type: OptionType.STRING,
    description: "Hintergrundfarbe (Hex)",
    default: "#0a0b0f"
  },
  popupWidth: {
    type: OptionType.NUMBER,
    description: "Popup-Breite (px)",
    default: 480,
    min: 300,
    max: 800
  },
  popupMaxHeight: {
    type: OptionType.NUMBER,
    description: "Maximale Höhe (px)",
    default: 600,
    min: 400,
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
    default: "#ffffff"
  },
  accentColor: {
    type: OptionType.STRING,
    description: "Akzentfarbe (Hex)",
    default: "#5865f2"
  },
  showAvatars: {
    type: OptionType.BOOLEAN,
    description: "Avatare anzeigen",
    default: true
  },
  glassEffect: {
    type: OptionType.BOOLEAN,
    description: "Glasmorphismus-Effekt",
    default: true
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
  description: "Moderne Strafakte & Einladungsvorschau mit kräftigen Animationen",
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
    
    // Popup Container
    const popup = document.createElement("div");
    popup.id = "r6de-supporter-popup";
    popup.classList.add("r6de-supporter-popup");
    
    // Moderne Styling-Eigenschaften
    const glassEffect = settings.store.glassEffect;
    Object.assign(popup.style, {
      position: "fixed",
      background: glassEffect 
        ? `linear-gradient(135deg, ${settings.store.backgroundColor}ee, ${settings.store.backgroundColor}dd)`
        : settings.store.backgroundColor,
      backdropFilter: glassEffect ? "blur(20px) saturate(180%)" : "none",
      WebkitBackdropFilter: glassEffect ? "blur(20px) saturate(180%)" : "none",
      color: settings.store.textColor,
      padding: "0",
      borderRadius: settings.store.roundedCorners ? "20px" : "8px",
      fontSize: "14px",
      fontWeight: "500",
      zIndex: "10000",
      pointerEvents: "auto",
      display: "none",
      width: `${settings.store.popupWidth}px`,
      maxHeight: `${settings.store.popupMaxHeight}px`,
      overflowY: "hidden",
      boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
      fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
      cursor: "grab",
      border: `1px solid rgba(255, 255, 255, 0.1)`,
      opacity: "0",
      visibility: "hidden",
      transform: "scale(0.9) translateY(20px)",
      transition: "all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1)",
      willChange: "transform, opacity"
    });
    
    document.body.appendChild(popup);

    // Modernes CSS mit kräftigen Animationen
    const style = document.createElement("style");
    style.textContent = `
      * {
        box-sizing: border-box;
      }
      
      .r6de-supporter-popup {
        --primary: ${settings.store.accentColor};
        --primary-hover: ${settings.store.accentColor}dd;
        --success: #00d26a;
        --warning: #ffb02e;
        --danger: #f23f43;
        --purple: #8b5cf6;
        --orange: #ff6b35;
        --gray: #6b7280;
        --surface: rgba(255, 255, 255, 0.05);
        --surface-hover: rgba(255, 255, 255, 0.1);
        --text-primary: ${settings.store.textColor};
        --text-secondary: ${settings.store.textColor}cc;
        --text-muted: ${settings.store.textColor}88;
      }
      
      .r6de-supporter-popup::-webkit-scrollbar {
        width: 6px;
      }
      
      .r6de-supporter-popup::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .r6de-supporter-popup::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 3px;
        transition: background 0.3s ease;
      }
      
      .r6de-supporter-popup::-webkit-scrollbar-thumb:hover {
        background: var(--primary-hover);
      }
      
      .strafakte-header {
        display: flex;
        align-items: center;
        padding: 24px;
        background: linear-gradient(135deg, var(--surface), transparent);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        position: relative;
        overflow: hidden;
      }
      
      .strafakte-header::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, var(--primary), var(--purple), var(--primary));
        animation: shimmer 2s ease-in-out infinite;
      }
      
      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      
      .strafakte-avatar {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        margin-right: 16px;
        object-fit: cover;
        border: 2px solid var(--primary);
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        position: relative;
        overflow: hidden;
      }
      
      .strafakte-avatar::after {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
        transition: left 0.6s ease;
      }
      
      .strafakte-avatar:hover {
        transform: scale(1.1) rotate(5deg);
        border-color: var(--success);
        box-shadow: 0 8px 25px rgba(88, 101, 242, 0.4);
      }
      
      .strafakte-avatar:hover::after {
        left: 100%;
      }
      
      .strafakte-user-info {
        flex: 1;
        min-width: 0;
        margin-right: 16px;
      }
      
      .strafakte-username {
        font-weight: 700;
        font-size: 18px;
        color: var(--text-primary);
        margin-bottom: 4px;
        background: linear-gradient(135deg, var(--text-primary), var(--primary));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: textGlow 3s ease-in-out infinite alternate;
      }
      
      @keyframes textGlow {
        from { filter: brightness(1); }
        to { filter: brightness(1.2); }
      }
      
      .strafakte-userid {
        font-size: 12px;
        color: var(--text-muted);
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      
      .strafakte-button-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .strafakte-button {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        transform-origin: center;
        background: var(--surface);
        color: var(--text-primary);
      }
      
      .strafakte-button::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.2);
        transition: all 0.4s ease;
        transform: translate(-50%, -50%);
      }
      
      .strafakte-button:hover {
        transform: scale(1.15) translateY(-2px);
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
      }
      
      .strafakte-button:hover::before {
        width: 100%;
        height: 100%;
      }
      
      .strafakte-button:active {
        transform: scale(0.95);
      }
      
      .strafakte-button.pinned {
        background: linear-gradient(135deg, var(--success), #00b359);
        color: white;
        animation: pulse 2s ease-in-out infinite;
      }
      
      .strafakte-button.unpinned {
        background: linear-gradient(135deg, var(--danger), #e73c40);
        color: white;
      }
      
      .strafakte-button.close {
        background: linear-gradient(135deg, var(--danger), #e73c40);
        color: white;
      }
      
      @keyframes pulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(0, 210, 106, 0.4); }
        50% { box-shadow: 0 0 0 8px rgba(0, 210, 106, 0); }
      }
      
      .strafakte-content {
        padding: 24px;
        max-height: ${settings.store.popupMaxHeight - 120}px;
        overflow-y: auto;
      }
      
      .strafakte-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      
      .strafakte-stat {
        background: var(--surface);
        border-radius: 16px;
        padding: 20px 16px;
        text-align: center;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
        border: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .strafakte-stat::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent);
        transition: left 0.6s ease;
      }
      
      .strafakte-stat:hover {
        transform: translateY(-8px) scale(1.02);
        background: var(--surface-hover);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        border-color: var(--primary);
      }
      
      .strafakte-stat:hover::before {
        left: 100%;
      }
      
      .strafakte-stat-value {
        font-weight: 800;
        font-size: 24px;
        line-height: 1;
        margin-bottom: 8px;
        background: linear-gradient(135deg, var(--primary), var(--purple));
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .strafakte-stat-label {
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
      }
      
      .strafakte-warning {
        background: linear-gradient(135deg, rgba(255, 176, 46, 0.15), rgba(255, 176, 46, 0.05));
        border: 1px solid var(--warning);
        border-radius: 16px;
        padding: 16px 20px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        gap: 12px;
        animation: warningPulse 2s ease-in-out infinite alternate;
      }
      
      @keyframes warningPulse {
        from { box-shadow: 0 0 0 0 rgba(255, 176, 46, 0.2); }
        to { box-shadow: 0 0 0 4px rgba(255, 176, 46, 0); }
      }
      
      .strafakte-warning-icon {
        font-size: 20px;
        animation: bounce 2s ease-in-out infinite;
      }
      
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-4px); }
      }
      
      .strafakte-list-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        position: relative;
      }
      
      .strafakte-list-title::after {
        content: '';
        position: absolute;
        bottom: -2px;
        left: 0;
        width: 40px;
        height: 2px;
        background: linear-gradient(90deg, var(--primary), var(--purple));
        transition: width 0.4s ease;
      }
      
      .strafakte-list-title:hover::after {
        width: 100%;
      }
      
      .strafakte-list-title h3 {
        font-size: 18px;
        font-weight: 700;
        color: var(--text-primary);
        margin: 0;
      }
      
      .strafakte-back-button {
        background: var(--surface);
        border: none;
        color: var(--primary);
        padding: 8px 16px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .strafakte-back-button:hover {
        background: var(--primary);
        color: white;
        transform: translateX(-4px);
      }
      
      .strafakte-list-container {
        max-height: 300px;
        overflow-y: auto;
        padding-right: 8px;
      }
      
      .strafakte-list-container::-webkit-scrollbar {
        width: 4px;
      }
      
      .strafakte-list-container::-webkit-scrollbar-track {
        background: transparent;
      }
      
      .strafakte-list-container::-webkit-scrollbar-thumb {
        background: var(--primary);
        border-radius: 2px;
      }
      
      .strafakte-entry {
        background: var(--surface);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        transition: all 0.3s cubic-bezier(0.165, 0.84, 0.44, 1);
        border-left: 4px solid;
        animation: slideInUp 0.4s ease var(--delay, 0s) both;
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
      
      .strafakte-entry::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
        transition: left 0.6s ease;
      }
      
      .strafakte-entry:hover {
        transform: translateX(8px) translateY(-2px);
        background: var(--surface-hover);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
      }
      
      .strafakte-entry:hover::before {
        left: 100%;
      }
      
      .strafakte-penalty-category-A { border-left-color: var(--success); }
      .strafakte-penalty-category-B { border-left-color: var(--warning); }
      .strafakte-penalty-category-C { border-left-color: var(--orange); }
      .strafakte-penalty-category-D { border-left-color: var(--danger); }
      .strafakte-penalty-category-E { border-left-color: var(--purple); }
      .strafakte-penalty-category-KICK { border-left-color: var(--orange); }
      .strafakte-penalty-category-UNKNOWN { border-left-color: var(--gray); }
      
      .strafakte-warning-entry { border-left-color: var(--warning); }
      .strafakte-unban-entry { border-left-color: var(--success); }
      .strafakte-watchlist-entry { border-left-color: var(--primary); }
      
      .strafakte-entry-expired {
        opacity: 0.6;
        border-left-style: dashed;
        position: relative;
      }
      
      .strafakte-entry-expired::after {
        content: 'ABGELAUFEN';
        position: absolute;
        top: 8px;
        right: 12px;
        font-size: 10px;
        font-weight: 700;
        color: var(--danger);
        background: rgba(242, 63, 67, 0.1);
        padding: 4px 8px;
        border-radius: 6px;
        border: 1px solid var(--danger);
      }
      
      .strafakte-entry-category {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 24px;
        height: 24px;
        font-size: 11px;
        font-weight: 700;
        padding: 0 8px;
        border-radius: 8px;
        margin-top: 8px;
        background: var(--primary);
        color: white;
      }
      
      .strafakte-entry-date {
        font-size: 11px;
        color: var(--text-muted);
        margin-top: 8px;
        font-weight: 500;
      }
      
      .strafakte-detail-view {
        background: var(--surface);
        border-radius: 16px;
        padding: 20px;
        margin-top: 16px;
        animation: slideInUp 0.4s ease;
      }
      
      .strafakte-detail-title {
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 16px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .strafakte-detail-field {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }
      
      .strafakte-detail-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        color: var(--text-secondary);
        margin-bottom: 4px;
      }
      
      .strafakte-detail-value {
        font-size: 14px;
        color: var(--text-primary);
        word-break: break-word;
        line-height: 1.5;
      }
      
      .strafakte-empty-state {
        text-align: center;
        padding: 40px 20px;
        color: var(--text-muted);
        font-style: italic;
        animation: fadeIn 0.6s ease;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 40px;
        text-align: center;
      }
      
      .loading-spinner {
        width: 60px;
        height: 60px;
        margin-bottom: 20px;
        border: 4px solid rgba(88, 101, 242, 0.2);
        border-radius: 50%;
        border-top-color: var(--primary);
        animation: spin 1s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-secondary);
        animation: textPulse 1.5s ease-in-out infinite alternate;
      }
      
      @keyframes textPulse {
        from { opacity: 0.6; }
        to { opacity: 1; }
      }
      
      /* Einladungsvorschau */
      .r6de-invite-preview {
        background: ${settings.store.glassEffect 
          ? `linear-gradient(135deg, ${settings.store.backgroundColor}ee, ${settings.store.backgroundColor}dd)` 
          : settings.store.backgroundColor} !important;
        backdrop-filter: ${settings.store.glassEffect ? 'blur(20px) saturate(180%)' : 'none'} !important;
        -webkit-backdrop-filter: ${settings.store.glassEffect ? 'blur(20px) saturate(180%)' : 'none'} !important;
        color: ${settings.store.textColor} !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: ${settings.store.roundedCorners ? '16px' : '8px'} !important;
        padding: 20px !important;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4) !important;
        font-family: 'Inter', 'Segoe UI', system-ui, sans-serif !important;
        font-weight: 500 !important;
        max-width: 320px !important;
        animation: slideInUp 0.3s ease !important;
      }
      
      /* Responsive Design */
      @media (max-width: 600px) {
        .r6de-supporter-popup {
          width: 90vw !important;
          max-width: 400px !important;
        }
        
        .strafakte-stats {
          grid-template-columns: repeat(2, 1fr);
        }
        
        .strafakte-header {
          padding: 20px;
        }
        
        .strafakte-content {
          padding: 20px;
        }
      }
    `;
    document.head.appendChild(style);

    let popupHideTimeout: ReturnType<typeof setTimeout> | null = null;
    let currentUserId: string | null = null;
    let isPinned = settings.store.defaultPinned;
    let currentStrafakteData: StrafakteData | null = null;
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
    
    let latestAvatarMouseEvent: MouseEvent | null = null;

    // Dragging Logik
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    popup.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      popup.style.cursor = "grabbing";
      dragOffsetX = e.clientX - popup.getBoundingClientRect().left;
      dragOffsetY = e.clientY - popup.getBoundingClientRect().top;
      e.preventDefault();
    });

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging) return;
      
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;
      const rect = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 20;

      newLeft = Math.max(margin, Math.min(vw - rect.width - margin, newLeft));
      newTop = Math.max(margin, Math.min(vh - rect.height - margin, newTop));

      popup.style.left = `${newLeft}px`;
      popup.style.top = `${newTop}px`;
    };

    const mouseUpHandler = () => {
      isDragging = false;
      popup.style.cursor = "grab";
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);

    // Positionierung
    function positionPopup(popupElement: HTMLElement, e: MouseEvent, xOffset: number = 20, yOffset: number = 20) {
      const rect = popupElement.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 20;

      let left = e.pageX + xOffset;
      let top = e.pageY + yOffset;

      if (left + rect.width > vw - margin) {
        left = e.pageX - rect.width - xOffset;
      }
      if (top + rect.height > vh - margin) {
        top = e.pageY - rect.height - yOffset;
      }

      left = Math.max(margin, Math.min(vw - rect.width - margin, left));
      top = Math.max(margin, Math.min(vh - rect.height - margin, top));

      popupElement.style.left = `${left}px`;
      popupElement.style.top = `${top}px`;
    }

    // Popup Animationen
    function showPopupWithAnimation() {
      popup.style.display = "block";
      popup.style.visibility = "visible";
      
      requestAnimationFrame(() => {
        popup.style.opacity = "1";
        popup.style.transform = "scale(1) translateY(0)";
      });
    }

    function hidePopupWithAnimation() {
      popup.style.opacity = "0";
      popup.style.transform = "scale(0.9) translateY(20px)";
      
      setTimeout(() => {
        popup.style.display = "none";
        popup.style.visibility = "hidden";
      }, 400);
    }

    // Benutzer-ID extrahieren
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

      if (el instanceof HTMLImageElement && el.classList.toString().includes('avatar')) {
        const src = el.src;
        const match = src.match(/avatars\/(\d{17,20})\//) || src.match(/users\/(\d{17,20})\//);
        if (match) return match[1];
      }
      
      return null;
    }

    // Kontextmenü-Methode
    async function getUserIdFromContextMenu(el: HTMLElement): Promise<string | null> {
      return new Promise((resolve) => {
        if (!el) return resolve(null);

        const style = document.createElement("style");
        style.textContent = `[role="menu"] { visibility: hidden !important; }`;
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

    // Strafe kategorisieren
    function parseStrafeKategorie(strafe: string): string {
      const cleanStrafe = strafe.replace(/^\*\*|\*\*$/g, '').trim();
      
      if (/warn/i.test(cleanStrafe)) return "B";
      if (/kick/i.test(cleanStrafe)) return "KICK";
      if (/1h|1 h|1 Stunde/i.test(cleanStrafe)) return "A";
      
      const match = cleanStrafe.match(/(\d+)d/i);
      if (match) {
        const days = parseInt(match[1]);
        if (days <= 3) return "C";
        if (days <= 7) return "D";
        return "E";
      }
      
      if (/ban/i.test(cleanStrafe)) return "E";
      return "UNKNOWN";
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

    // Strafakte abrufen
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

        // Nachrichten verarbeiten
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
          
          const unbanPattern = /unbann|entbannung|entban|unban|entbannungsantrag|entbannungsgesuch|entbannungantrag|entbannungs anfrage|unban request|entbitten/i;
          if (unbanPattern.test(content) && !/KEINE CHANCE AUF ENTBANNUNG/i.test(content)) {
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
          if (kat === "UNKNOWN") continue;

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

    // Ansicht wechseln
    function changeView(view: 'summary' | 'warnings' | 'unbans' | 'penalties' | 'watchlist' | 'detail') {
      activeView = view;
      renderStrafakteContent();
    }

    // Detailansicht
    function showEntryDetail(entry: PenaltyEntry | WarningEntry | UnbanEntry | WatchlistEntry, sourceView: 'warnings' | 'unbans' | 'penalties' | 'watchlist') {
      detailEntry = entry;
      detailSourceView = sourceView;
      changeView('detail');
    }

    // Detailansicht rendern
    function renderDetailView() {
      if (!detailEntry) return '';

      let detailHtml = `
        <div class="strafakte-detail-title">
          📋 Detailinformationen
        </div>
        <div class="strafakte-detail-view">
      `;

      if ('offense' in detailEntry && 'category' in detailEntry) {
        const penalty = detailEntry as PenaltyEntry;
        detailHtml += `
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Kategorie</div>
            <div class="strafakte-detail-value">${penalty.category === 'KICK' ? 'Kick' : penalty.category === 'UNKNOWN' ? '?' : penalty.category}</div>
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
        <button class="strafakte-back-button" data-view="${detailSourceView || 'summary'}">
          ← Zurück
        </button>
      `;

      return detailHtml;
    }

    // Strafakte Inhalt rendern
    function renderStrafakteContent() {
      if (!currentStrafakteData) {
        popup.innerHTML = '<div class="loading-indicator"><div class="loading-spinner"></div><div class="loading-text">Keine Daten verfügbar</div></div>';
        return;
      }

      const oldLeft = popup.style.left;
      const oldTop = popup.style.top;
      
      let contentHtml = `
        <div class="strafakte-header">
          ${settings.store.showAvatars && currentStrafakteData.avatarUrl ? ` 
            <img src="${currentStrafakteData.avatarUrl}" class="strafakte-avatar" />
          ` : '<div class="strafakte-avatar" style="background:linear-gradient(135deg, var(--primary), var(--purple));display:flex;align-items:center;justify-content:center;font-size:24px;color:white;">👤</div>'}
          <div class="strafakte-user-info">
            <div class="strafakte-username">
              ${currentStrafakteData.username || "Unbekannt"}
            </div>
            <div class="strafakte-userid">
              ${currentUserId || "ID unbekannt"}
            </div>
          </div>
          <div class="strafakte-button-container">
            <button id="strafakte-pin" class="strafakte-button ${isPinned ? 'pinned' : 'unpinned'}" title="${isPinned ? 'Angepinnt' : 'Anheften'}">
              ${isPinned ? '🔒' : '📌'}
            </button>
            <button id="strafakte-copy-id" class="strafakte-button" title="ID kopieren">📋</button>
            <button id="strafakte-refresh" class="strafakte-button" title="Aktualisieren">🔄</button>
            <button id="strafakte-close" class="strafakte-button close" title="Schließen">✖</button>
          </div>
        </div>
        <div class="strafakte-content">
      `;
      
      if (activeView === 'detail') {
        contentHtml += `
          <div class="strafakte-list-title">
            <h3>Detailansicht</h3>
          </div>
          ${renderDetailView()}
        `;
      } else {
        switch (activeView) {
          case 'summary':
            contentHtml += `
              <div class="strafakte-stats">
                <div class="strafakte-stat" data-view="warnings" style="--delay: 0.1s">
                  <div class="strafakte-stat-value">${currentStrafakteData.warnCount}</div>
                  <div class="strafakte-stat-label">Verwarnungen</div>
                </div>
                <div class="strafakte-stat" data-view="unbans" style="--delay: 0.2s">
                  <div class="strafakte-stat-value">${currentStrafakteData.unbanCount}</div>
                  <div class="strafakte-stat-label">Entbannungen</div>
                </div>
                <div class="strafakte-stat" data-view="penalties" style="--delay: 0.3s">
                  <div class="strafakte-stat-value">${currentStrafakteData.penalties.length}</div>
                  <div class="strafakte-stat-label">Strafen</div>
                </div>
                <div class="strafakte-stat" data-view="watchlist" style="--delay: 0.4s">
                  <div class="strafakte-stat-value">${currentStrafakteData.watchlistCount}</div>
                  <div class="strafakte-stat-label">Watchlist</div>
                </div>
              </div>
            `;
            
            if (currentStrafakteData.newestActiveDays > 0) {
              contentHtml += `
                <div class="strafakte-warning">
                  <div class="strafakte-warning-icon">⚠️</div>
                  <div>Die nächste Bestrafung kann <strong>${currentStrafakteData.newestActiveDays} Tage</strong> hinzufügen!</div>
                </div>
              `;
            }
            
            if (currentStrafakteData.error) {
              contentHtml += `
                <div style="text-align:center;padding:20px;color:var(--danger);font-weight:600;">
                  ${currentStrafakteData.error}
                </div>
              `;
            }
            break;
            
          case 'warnings':
            contentHtml += `
              <div class="strafakte-list-title">
                <h3>Verwarnungen (${currentStrafakteData.warnCount})</h3>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.warnings.length > 0) {
              currentStrafakteData.warnings.forEach((w, index) => {
                const dateStr = w.date ? w.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-warning-entry" data-index="${index}" style="--delay: ${index * 0.1}s">
                    <div><strong>Tat:</strong> ${w.offense}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">🎉 Keine Verwarnungen gefunden</div>`;
            }
            
            contentHtml += `</div>`;
            break;
            
          case 'unbans':
            contentHtml += `
              <div class="strafakte-list-title">
                <h3>Entbannungen (${currentStrafakteData.unbanCount})</h3>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.unbans.length > 0) {
              currentStrafakteData.unbans.forEach((u, index) => {
                const dateStr = u.date ? u.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-unban-entry" data-index="${index}" style="--delay: ${index * 0.1}s">
                    <div><strong>Grund:</strong> ${u.reason}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">✨ Keine Entbannungen gefunden</div>`;
            }
            
            contentHtml += `</div>`;
            break;
            
          case 'penalties':
            contentHtml += `
              <div class="strafakte-list-title">
                <h3>Strafen (${currentStrafakteData.penalties.length})</h3>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.penalties.length > 0) {
              currentStrafakteData.penalties.forEach((p, index) => {
                const dateStr = p.date ? p.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                const categoryDisplay = p.category === 'KICK' ? 'Kick' : p.category === 'UNKNOWN' ? '?' : p.category;
                contentHtml += `
                  <div class="strafakte-entry strafakte-penalty-category-${p.category} ${p.expired ? 'strafakte-entry-expired' : ''}" data-index="${index}" style="--delay: ${index * 0.1}s">
                    <div><strong>Tat:</strong> ${p.offense || "Keine Tat angegeben"}</div>
                    <div><strong>Strafe:</strong> ${p.text}</div>
                    <div class="strafakte-entry-category">${categoryDisplay}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">🎉 Keine Strafen gefunden</div>`;
            }
            
            contentHtml += `</div>`;
            break;
            
          case 'watchlist':
            contentHtml += `
              <div class="strafakte-list-title">
                <h3>Watchlist (${currentStrafakteData.watchlistCount})</h3>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;
            
            if (currentStrafakteData.watchlist.length > 0) {
              currentStrafakteData.watchlist.forEach((w, index) => {
                const dateStr = w.date ? w.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-watchlist-entry" data-index="${index}" style="--delay: ${index * 0.1}s">
                    <div><strong>Vorwurf:</strong> ${w.reason}</div>
                    <div class="strafakte-entry-date">${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">✨ Keine Watchlist-Einträge gefunden</div>`;
            }
            
            contentHtml += `</div>`;
            break;
        }
      }

      contentHtml += `</div>`;
      popup.innerHTML = contentHtml;
      
      popup.style.left = oldLeft;
      popup.style.top = oldTop;

      // Event Listener
      document.querySelectorAll('.strafakte-stat, .strafakte-back-button').forEach(el => {
        const view = el.getAttribute('data-view');
        if (view) {
          el.addEventListener('click', () => changeView(view as any));
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
          });
        });
      }

      // Button Event Listener
      document.getElementById("strafakte-close")?.addEventListener("click", () => {
        hidePopupWithAnimation();
        isPinned = false;
        isMouseOverPopup = false;
        isMouseOverAvatar = false;
        activeView = 'summary';
      });

      document.getElementById("strafakte-copy-id")?.addEventListener("click", () => {
        if (currentUserId) {
          navigator.clipboard.writeText(currentUserId);
          const btn = document.getElementById("strafakte-copy-id");
          if (btn) {
            const originalText = btn.textContent;
            btn.textContent = "✓";
            btn.style.color = "var(--success)";
            setTimeout(() => {
              if (btn) {
                btn.textContent = originalText;
                btn.style.color = "";
              }
            }, 2000);
          }
        }
      });

      document.getElementById("strafakte-refresh")?.addEventListener("click", async () => {
        if (!currentUserId) return;
        
        const refreshBtn = document.getElementById("strafakte-refresh");
        if (refreshBtn) {
          refreshBtn.style.animation = "spin 1s linear infinite";
          
          const oldLeft = popup.style.left;
          const oldTop = popup.style.top;
          
          currentStrafakteData = await fetchStrafakte(currentUserId);
          renderStrafakteContent();
          
          popup.style.left = oldLeft;
          popup.style.top = oldTop;
          
          setTimeout(() => {
            if (refreshBtn) refreshBtn.style.animation = "";
          }, 1000);
        }
      });

      document.getElementById("strafakte-pin")?.addEventListener("click", () => {
        isPinned = !isPinned;
        const pinBtn = document.getElementById("strafakte-pin");
        if (pinBtn) {
          pinBtn.className = `strafakte-button ${isPinned ? 'pinned' : 'unpinned'}`;
          pinBtn.innerHTML = isPinned ? '🔒' : '📌';
          pinBtn.title = isPinned ? 'Angepinnt' : 'Anheften';
        }
      });
    }

    // Popup-Interaktion
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
          }, 500);
        }
      }
    });

    // Avatar Hover Handler
    const handleAvatarHover = (el: HTMLElement) => {
      if (el.closest("#r6de-supporter-popup")) return;
      if (el.hasAttribute("data-r6de-processed")) return;
      el.setAttribute("data-r6de-processed", "true");
      
      let openTimer: ReturnType<typeof setTimeout> | null = null;

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
                <div class="strafakte-avatar" style="background:linear-gradient(135deg, var(--danger), var(--orange));display:flex;align-items:center;justify-content:center;font-size:24px;color:white;">❌</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Fehler</div>
                  <div class="strafakte-userid">ID nicht extrahierbar</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">✖</button>
                </div>
              </div>
              <div class="strafakte-content">
                <div style="text-align:center;padding:40px;color:var(--danger);font-weight:600;">
                  Benutzer-ID konnte nicht extrahiert werden
                </div>
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
                <div class="strafakte-avatar" style="background:linear-gradient(135deg, var(--gray), var(--text-muted));display:flex;align-items:center;justify-content:center;font-size:24px;color:white;">🤖</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Bot</div>
                  <div class="strafakte-userid">${finalUserId}</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">✖</button>
                </div>
              </div>
              <div class="strafakte-content">
                <div style="text-align:center;padding:40px;color:var(--text-secondary);font-weight:600;">
                  🤖 Bots haben keine Strafakte
                </div>
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
        }, settings.store.avatarHoverDelay);
      };

      const handleMouseLeave = () => {
        isMouseOverAvatar = false;
        clearTimeout(openTimer!);
        
        if (!isMouseOverPopup) {
          avatarLeaveTimer = setTimeout(() => {
            if (!isMouseOverPopup && !isPinned) {
              hidePopupWithAnimation();
              activeView = 'summary';
            }
          }, 500);
        }
      };

      const handleMouseDown = () => {
        if (!isPinned) {
          setTimeout(() => {
            hidePopupWithAnimation();
            activeView = 'summary';
          }, 100);
        }
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
      el.addEventListener("mousedown", handleMouseDown);
    };

    // Einladungsvorschau
    const handleInvitePreview = (link: HTMLAnchorElement) => {
      if (link.hasAttribute("data-r6de-invite-processed")) return;
      link.setAttribute("data-r6de-invite-processed", "true");

      const code = link.href.match(inviteRegex)?.[3];
      if (!code) return;

      link.title = "";
      link.removeAttribute("title");

      fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true&with_expiration=true`)
        .then(res => res.json())
        .then(data => {
          let tooltip: HTMLElement | null = null;

          link.addEventListener("mouseenter", (e) => {
            e.stopPropagation();
            e.preventDefault();
            
            tooltip = document.createElement("div");
            tooltip.className = "r6de-invite-preview";
            Object.assign(tooltip.style, {
              position: "fixed",
              zIndex: "10001",
              maxWidth: "320px",
              pointerEvents: "none",
              display: "none"
            });
            document.body.appendChild(tooltip);

            const g = data.guild || {}, c = data.channel || {};
            const icon = g.id && g.icon
              ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64" style="width:56px;height:56px;border-radius:12px;margin-bottom:12px;border:2px solid var(--primary);">`
              : "";
            const channelTypes = ["Text", "DM", "Voice", "Gruppen-DM", "Kategorie", "Neuigkeiten", "Shop", "Bühne", "Forum"];

            tooltip.innerHTML = `
              ${icon}
              <div style="font-weight:700;font-size:16px;margin-bottom:8px;">🏷️ ${g.name || "Unbekannt oder abgelaufen"}</div>
              <div style="margin-bottom:4px;">💬 #${c.name || "?"} (${channelTypes[c.type] || "Unbekannt"})</div>
              <div style="color:var(--text-secondary);">👥 ${data.approximate_member_count || "?"} Mitglieder</div>
            `;

            tooltip.style.display = "block";
            tooltip.style.visibility = "hidden";
            tooltip.style.opacity = "0";
            tooltip.style.transform = "scale(0.9) translateY(10px)";
            
            setTimeout(() => {
              if (tooltip) {
                tooltip.style.visibility = "visible";
                tooltip.style.opacity = "1";
                tooltip.style.transform = "scale(1) translateY(0)";
              }
            }, 10);

            positionPopup(tooltip, e as MouseEvent, 15, 15);
          });

          link.addEventListener("mousemove", (e) => {
            if (tooltip) positionPopup(tooltip, e as MouseEvent, 15, 15);
          });

          link.addEventListener("mouseleave", () => {
            if (tooltip) {
              tooltip.style.opacity = "0";
              tooltip.style.transform = "scale(0.9) translateY(10px)";
              
              setTimeout(() => {
                if (tooltip) {
                  tooltip.remove();
                  tooltip = null;
                }
              }, 300);
            }
          });
        })
        .catch(error => {
          console.error("Fehler beim Abrufen der Einladung:", error);
        });
    };

    // Mutation Observer
    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;

          // Avatar-Hover
          const avatars = node.querySelectorAll(`
            img[class*="avatar"], 
            .wrapper__44b0c, 
            .voiceUser_efcaf8 .userAvatar__55bab,
            .voiceUser_efcaf8 .avatar__07f91,
            .avatarContainer__6b330,
            div[class*="avatar"][style*="background-image"],
            [class*="userPopout"] img[class*="avatar"],
            [class*="userProfile"] img[class*="avatar"]
          `);
          
          avatars.forEach((avatar: Element) => {
            if (avatar instanceof HTMLElement) {
              handleAvatarHover(avatar);
            }
          });

          // Einladungsvorschau
          const links = node.querySelectorAll<HTMLAnchorElement>("a[href*='discord.gg'], a[href*='discord.com/invite']");
          links.forEach(handleInvitePreview);
        }
      }
    });

    // Initiale Verarbeitung
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

    observer.observe(document.body, { childList: true, subtree: true });
    this.observers.push(observer);
  },

  stop() {
    this.observers.forEach(obs => obs.disconnect());
    const popup = document.getElementById("r6de-supporter-popup");
    if (popup) popup.remove();
    document.querySelectorAll('.r6de-invite-preview').forEach(el => el.remove());
    document.querySelectorAll('[data-r6de-processed]').forEach(el => el.removeAttribute("data-r6de-processed"));
    document.querySelectorAll('[data-r6de-invite-processed]').forEach(el => el.removeAttribute("data-r6de-invite-processed"));
  }
});
