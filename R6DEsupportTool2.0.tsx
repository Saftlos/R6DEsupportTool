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
    default: "#0e0f12"
  },
  popupWidth: {
    type: OptionType.NUMBER,
    description: "Popup-Breite (px)",
    default: 450,
    min: 100,
    max: 800
  },
  popupMaxHeight: {
    type: OptionType.NUMBER,
    description: "Maximale Höhe (px)",
    default: 500,
    min: 0,
    max: 1000
  },
  restrictToServer: {
    type: OptionType.BOOLEAN,
    description: "Nur auf R6DE Server anzeigen",
    default: true // Default auf true gesetzt
  },
  defaultPinned: {
    type: OptionType.BOOLEAN,
    description: "Standardmäßig angepinnt",
    default: false
  },
  textColor: {
    type: OptionType.STRING,
    description: "Textfarbe (Hex)",
    default: "#e0e7ff"
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
    default: "#4e5d94"
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
    default: 1.0,
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
    default: 200,
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
    
    // Popup Container
    const popup = document.createElement("div");
    popup.id = "r6de-supporter-popup";
    popup.classList.add("r6de-supporter-popup");
    
    // Modernes Design mit Glas-Effekt
    Object.assign(popup.style, {
      position: "fixed",
      background: settings.store.backgroundColor,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      color: settings.store.textColor,
      padding: "14px 16px",
      borderRadius: settings.store.roundedCorners ? "12px" : "0",
      fontSize: "13px",
      zIndex: "9999",
      pointerEvents: "auto",
      display: "none",
      width: `${settings.store.popupWidth}px`,
      maxHeight: settings.store.popupMaxHeight > 0 ? `${settings.store.popupMaxHeight}px` : 'none',
      overflowY: "auto",
      boxShadow: "0 8px 24px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)",
      fontFamily: "'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif",
      fontWeight: "500",
      lineHeight: "1.5",
      cursor: "grab",
      border: `${settings.store.borderSize}px ${settings.store.borderStyle} ${settings.store.borderColor}`,
      opacity: settings.store.popupOpacity.toString(),
      visibility: "hidden",
      transform: "scale(0.98)",
      transition: settings.store.tooltipAnimation 
        ? `opacity ${settings.store.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1),
           transform ${settings.store.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1),
           visibility ${settings.store.animationDuration}ms ease,
           backdrop-filter 0.3s ease,
           background 0.3s ease`
        : "none"
    });
    
    document.body.appendChild(popup);

    // Scrollbar Styling - verbesserte Usability
    const scrollFixStyle = document.createElement("style");
    scrollFixStyle.textContent = `
      .r6de-supporter-popup::-webkit-scrollbar {
        width: 8px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 4px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb {
        background: rgba(114, 137, 218, 0.6);
        border-radius: 4px;
        cursor: pointer;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb:hover {
        background: rgba(91, 110, 174, 0.8);
      }
      .strafakte-list-container::-webkit-scrollbar {
        width: 6px;
      }
      .strafakte-list-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.1);
        border-radius: 3px;
      }
      .strafakte-list-container::-webkit-scrollbar-thumb {
        background: rgba(114, 137, 218, 0.5);
        border-radius: 3px;
        cursor: pointer;
      }
      .strafakte-list-container::-webkit-scrollbar-thumb:hover {
        background: rgba(91, 110, 174, 0.7);
      }
    `;
    document.head.appendChild(scrollFixStyle);

    // Dragging Logik
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
      dragOffsetX = e.clientX - popup.getBoundingClientRect().left;
      dragOffsetY = e.clientY - popup.getBoundingClientRect().top;
      dragStartPosition = { x: e.clientX, y: e.clientY };
      e.preventDefault();
    });

    const mouseMoveHandler = (e: MouseEvent) => {
      if (!isDragging) return;
      
      // Minimum-Bewegungsschwelle (5px)
      const moveThreshold = 5;
      const dx = Math.abs(e.clientX - dragStartPosition.x);
      const dy = Math.abs(e.clientY - dragStartPosition.y);
      
      if (dx < moveThreshold && dy < moveThreshold) return;
      
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;
      const rect = popup.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 5;

      // Begrenze die Position auf den Bildschirm
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
    document.addEventListener("mouseleave", mouseUpHandler);

    // CSS für modernes Design mit Animationen
    const style = document.createElement("style");
    style.textContent = `
      .r6de-supporter-popup {
        transition: 
          opacity ${settings.store.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1), 
          transform ${settings.store.animationDuration}ms cubic-bezier(0.16, 1, 0.3, 1), 
          visibility ${settings.store.animationDuration}ms ease,
          backdrop-filter 0.3s ease,
          background 0.3s ease;
      }
      
      .strafakte-button {
        background: rgba(88, 101, 242, 0.9);
        color: white;
        border: none;
        padding: 0;
        border-radius: 6px;
        font-size: 15px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        transition: all 0.2s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .strafakte-button:hover {
        transform: scale(1.08);
        background: rgba(71, 82, 196, 0.9);
        box-shadow: 0 3px 6px rgba(0,0,0,0.25);
      }
      
      .strafakte-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      .strafakte-button.pinned {
        background: rgba(67, 181, 129, 0.9);
      }
      
      .strafakte-button.pinned:hover {
        background: rgba(61, 163, 112, 0.9);
      }
      
      .strafakte-button.unpinned {
        background: rgba(240, 71, 71, 0.9);
      }
      
      .strafakte-button.unpinned:hover {
        background: rgba(216, 64, 64, 0.9);
      }

      .strafakte-button.close {
        background: none !important;
        color: #f04747;
        font-size: 17px;
        line-height: 1;
        box-shadow: none;
      }
      
      .strafakte-button.close:hover {
        transform: scale(1.15);
        color: #ff5c5c;
      }
      
      .strafakte-button-container {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-left: auto;
      }
      
      .strafakte-avatar {
        width: 46px;
        height: 46px;
        border-radius: 50%;
        margin-right: 12px;
        object-fit: cover;
        border: 1px solid rgba(78, 93, 148, 0.3);
        transition: transform 0.3s ease;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      }
      
      .strafakte-avatar:hover {
        transform: scale(1.08);
      }
      
      .strafakte-header {
        display: flex;
        align-items: center;
        margin-bottom: 14px;
        padding-bottom: 14px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        position: relative;
      }
      
      .strafakte-user-info {
        flex: 1;
        min-width: 0;
        margin-right: 10px;
      }
      
      .strafakte-username {
        font-weight: 600;
        font-size: 16px;
        color: #fff;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        letter-spacing: 0.2px;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      
      .strafakte-userid {
        font-size: 12px;
        color: #a0a5b8;
        margin-top: 5px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: 'Consolas', 'Courier New', monospace;
        opacity: 0.8;
      }
      
      .strafakte-stats {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 14px;
        justify-content: space-between;
      }
      
      .strafakte-stat {
        background: rgba(255, 255, 255, 0.06);
        border-radius: 8px;
        padding: 10px;
        text-align: center;
        cursor: pointer;
        transition: all 0.25s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        border: 1px solid rgba(255,255,255,0.05);
        flex: 1;
        min-width: 80px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .strafakte-stat:hover {
        background: rgba(255, 255, 255, 0.1);
        transform: translateY(-3px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      
      .strafakte-stat-value {
        font-weight: 700;
        font-size: 18px;
        color: #7289da;
        line-height: 1.2;
        text-shadow: 0 1px 2px rgba(0,0,0,0.2);
      }
      
      .strafakte-stat-label {
        font-size: 11px;
        color: #a0a5b8;
        margin-top: 5px;
        letter-spacing: 0.5px;
        text-transform: uppercase;
        opacity: 0.8;
      }
      
      .strafakte-warning {
        background: linear-gradient(90deg, rgba(255, 204, 0, 0.15), rgba(255, 184, 0, 0.1));
        border-radius: 8px;
        padding: 10px 12px;
        margin-bottom: 14px;
        font-size: 13px;
        display: flex;
        align-items: center;
        border-left: 3px solid #ffcc00;
      }
      
      .strafakte-list-container {
        maxHeight: 250px;
        overflow-y: auto;
        padding-right: 5px;
        scroll-behavior: smooth;
        margin-top: 5px;
      }
      
      .strafakte-list-title {
        margin-bottom: 10px;
        font-size: 15px;
        color: #7289da;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 8px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
      }
      
      .strafakte-back-button {
        background: none;
        border: none;
        color: #7289da;
        cursor: pointer;
        font-size: 15px;
        display: flex;
        align-items: center;
        padding: 4px 8px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      
      .strafakte-back-button:hover {
        background: rgba(114, 137, 218, 0.1);
        color: #8ea1e1;
      }
      
      .strafakte-entry {
        padding: 10px 12px;
        margin-bottom: 10px;
        background: rgba(255, 255, 255, 0.04);
        border-radius: 8px;
        border-left: 4px solid;
        font-size: 13px;
        line-height: 1.5;
        transition: transform 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: pointer;
      }
      
      .strafakte-entry:hover {
        transform: translateX(3px);
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
      }
      
      .strafakte-entry > div {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .strafakte-penalty-category-A { border-color: #43b581; }
      .strafakte-penalty-category-B { border-color: #faa61a; }
      .strafakte-penalty-category-C { border-color: #f57731; }
      .strafakte-penalty-category-D { border-color: #f04747; }
      .strafakte-penalty-category-E { border-color: #593695; }
      
      .strafakte-warning-entry { border-color: #faa61a; }
      .strafakte-unban-entry { border-color: #43b581; }
      .strafakte-watchlist-entry { border-color: #5865F2; }
      
      .strafakte-entry-expired {
        opacity: 0.7;
        border-left-style: dashed;
      }
      
      .strafakte-entry-category {
        display: inline-block;
        font-size: 11px;
        padding: 3px 8px;
        border-radius: 12px;
        margin-top: 6px;
        background: rgba(255,255,255,0.08);
        font-weight: 600;
      }
      
      .strafakte-entry-date {
        font-size: 11px;
        opacity: 0.7;
        margin-top: 6px;
        font-style: italic;
      }
      
      .strafakte-section {
        margin-bottom: 10px;
        font-size: 15px;
        color: #7289da;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        padding-bottom: 8px;
        cursor: pointer;
        transition: all 0.25s ease;
        font-weight: 600;
      }
      
      .strafakte-section:hover {
        color: #8ea1e1;
      }
      
      .strafakte-empty-state {
        text-align: center;
        padding: 15px;
        opacity: 0.6;
        font-style: italic;
        font-size: 13px;
      }
      
      .strafakte-tab-content {
        animation: fadeIn 0.35s ease;
      }
      
      .strafakte-detail-view {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px;
        margin-top: 10px;
        animation: fadeIn 0.3s ease;
      }
      
      .strafakte-detail-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 8px;
        color: #7289da;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .strafakte-detail-title::before {
        content: "📋";
      }
      
      .strafakte-detail-field {
        margin-bottom: 8px;
        padding: 6px 0;
        border-bottom: 1px solid rgba(255,255,255,0.05);
      }
      
      .strafakte-detail-label {
        font-weight: 600;
        font-size: 12px;
        color: #a0a5b8;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 3px;
      }
      
      .strafakte-detail-value {
        font-size: 13px;
        word-break: break-word;
      }
      
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .loading-indicator {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 30px;
        text-align: center;
      }
      
      .loading-spinner {
        width: 48px;
        height: 48px;
        margin-bottom: 16px;
        border: 4px solid rgba(114, 137, 218, 0.2);
        border-radius: 50%;
        border-top-color: #7289da;
        animation: spin 1.2s cubic-bezier(0.68, -0.55, 0.27, 1.55) infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .loading-text {
        font-size: 14px;
        color: #a0a5b8;
        margin-top: 10px;
      }

      /* Minimalistisches Popup */
      .minimalist-popup .strafakte-header {
        padding-bottom: 10px;
        margin-bottom: 10px;
      }
      
      .minimalist-popup .strafakte-avatar {
        width: 36px;
        height: 36px;
      }
      
      .minimalist-popup .strafakte-username {
        font-size: 14px;
      }
      
      .minimalist-popup .strafakte-userid {
        font-size: 11px;
      }
      
      .minimalist-popup .strafakte-stat {
        padding: 8px;
        min-width: 70px;
      }
      
      .minimalist-popup .strafakte-stat-value {
        font-size: 16px;
      }
      
      .minimalist-popup .strafakte-stat-label {
        font-size: 10px;
      }
      
      .minimalist-popup .strafakte-warning {
        padding: 8px 10px;
        font-size: 12px;
      }
      
      .minimalist-popup .strafakte-list-container {
        max-height: 200px;
      }
      
      .minimalist-popup .strafakte-entry {
        padding: 8px 10px;
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

    // Positionierungsfunktion
    function positionPopup(popupElement: HTMLElement, e: MouseEvent, xOffset: number = 15, yOffset: number = 15) {
      const rect = popupElement.getBoundingClientRect();
      const vw = window.innerWidth, vh = window.innerHeight;
      const position = settings.store.popupPosition;
      const margin = 10;

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

      // Randbegrenzung
      left = Math.max(margin, Math.min(vw - rect.width - margin, left));
      top = Math.max(margin, Math.min(vh - rect.height - margin, top));

      popupElement.style.left = `${left}px`;
      popupElement.style.top = `${top}px`;
    }

    // Popup Animationen
    function showPopupWithAnimation() {
      popup.style.display = "block";
      popup.style.visibility = "hidden";
      popup.style.opacity = "0";
      popup.style.transform = "scale(0.98) translateY(10px)";
      
      setTimeout(() => {
        popup.style.visibility = "visible";
        popup.style.opacity = "1";
        popup.style.transform = "scale(1) translateY(0)";
      }, 10);
    }

    function hidePopupWithAnimation() {
      if (settings.store.tooltipAnimation) {
        popup.style.opacity = "0";
        popup.style.transform = "scale(0.98) translateY(10px)";
        
        setTimeout(() => {
          popup.style.display = "none";
          popup.style.visibility = "hidden";
        }, settings.store.animationDuration);
      } else {
        popup.style.display = "none";
      }
    }

    // Benutzer-ID aus Element extrahieren
    function getUserIdFromElement(el: HTMLElement): string | null {
      // React Fiber Methode
      for (const key in el) {
        if (key.startsWith("__reactFiber$")) {
          const fiber = (el as any)[key];
          let fiberNode = fiber;
          
          // Durch React-Fiber-Baum navigieren
          while (fiberNode) {
            const props = fiberNode?.pendingProps || fiberNode?.memoizedProps;
            const userId = props?.user?.id || props?.userId || 
                          (props?.id?.match(/^\d{17,20}$/) ? props.id : null);
            if (userId) return userId;
            
            fiberNode = fiberNode.return;
          }
        }
      }

      // Speziell für Profile Popup
      const profilePopup = el.closest('[class*="userProfileOuter"]');
      if (profilePopup) {
        const userIdElement = profilePopup.querySelector('[class*="userTag"]');
        if (userIdElement) {
          const userIdMatch = userIdElement.textContent?.match(/\d{17,20}/);
          if (userIdMatch) return userIdMatch[0];
        }
      }

      // HTMLImageElement - Extrahiere ID aus Avatar-URL
      if (el instanceof HTMLImageElement && el.classList.toString().includes('avatar')) {
        const src = el.src;
        // Extrahiere Benutzer-ID aus dem Avatar-Pfad
        const match = src.match(/avatars\/(\d{17,20})\//) || 
                     src.match(/users\/(\d{17,20})\//);
        if (match) return match[1];
      }
      
      // Div mit Hintergrundbild
      else if (el instanceof HTMLDivElement) {
        const bgImage = el.style.backgroundImage;
        if (bgImage) {
          const match = bgImage.match(/avatars\/(\d{17,20})\//);
          if (match) return match[1];
        }
      }
      
      // SVG-Wrapper
      else if (el.classList.contains('wrapper__44b0c') || el.classList.contains('voiceUser_efcaf8')) {
        const img = el.querySelector('img[class*="avatar"]');
        if (img && img.src) {
          const match = img.src.match(/avatars\/(\d{17,20})\//);
          if (match) return match[1];
        }
      }

      // Eltern-Elemente durchsuchen
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

    // Strafe kategorisieren
    function parseStrafeKategorie(strafe: string): string {
      if (/warn/i.test(strafe)) return "B";
      if (/1h|1 h|1 Stunde/i.test(strafe)) return "A";
      
      const match = strafe.match(/(\d+)d/i);
      if (match) {
        const days = parseInt(match[1]);
        if (days <= 3) return "C";
        if (days <= 7) return "D";
        return "E";
      }
      
      return /ban/i.test(strafe) ? "E" : "?";
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

    // Strafakte abrufen mit Watchlist
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
            
            // Verbesserte Extraktion des Vorwurfs
            const vorwurfLine = content.split("\n").find(line => line.toLowerCase().includes("vorwurf:")) ||
                              content.split("\n").find(line => line.toLowerCase().includes("grund:"));
            
            // Extrahiere den Text nach "Vorwurf:" oder "Grund:"
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
          
          // Entbannungen erkennen
          const unbanPattern = /unbann|entbannung|entban|unban|entbannungsantrag|entbannungsgesuch|entbannungantrag|entbannungs anfrage|unban request|entbitten/i;
          if (unbanPattern.test(content) && !/KEINE CHANCE AUF ENTBANNUNG/i.test(content)) {
            unbanCount++;
            
            // Grund statt Tat für Entbannungen
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
          const verfallen = kat !== "E" && (
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

    // Detailansicht für einen Eintrag anzeigen
    function showEntryDetail(entry: PenaltyEntry | WarningEntry | UnbanEntry | WatchlistEntry, sourceView: 'warnings' | 'unbans' | 'penalties' | 'watchlist') {
      detailEntry = entry;
      detailSourceView = sourceView;
      changeView('detail');
    }

    // Detailansicht rendern
    function renderDetailView() {
      if (!detailEntry) return '';

      let detailHtml = `
        <div class="strafakte-detail-title">Detailinformationen</div>
        <div class="strafakte-detail-view">
      `;

      if ('offense' in detailEntry && 'category' in detailEntry) {
        // PenaltyEntry
        const penalty = detailEntry as PenaltyEntry;
        detailHtml += `
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Kategorie</div>
            <div class="strafakte-detail-value">${penalty.category}</div>
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
        // WarningEntry
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
        // UnbanEntry oder WatchlistEntry
        const isUnban = detailSourceView === 'unbans';
        
        // Korrekte Beschriftung für Entbannungen
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

    // Strafakte Inhalt rendern mit Tabs
    function renderStrafakteContent() {
      if (!currentStrafakteData) {
        popup.innerHTML = "Keine Daten verfügbar";
        return;
      }

      // Minimalistisches Popup Styling anwenden
      const minimalistClass = settings.store.minimalistPopup ? "minimalist-popup" : "";
      
      let contentHtml = `
        <div class="strafakte-header ${minimalistClass}">
          ${settings.store.showAvatars && currentStrafakteData.avatarUrl ? ` 
            <img src="${currentStrafakteData.avatarUrl}" class="strafakte-avatar" />
          ` : '<div class="strafakte-avatar" style="background:#2c2f33;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>'}
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
            <button id="strafakte-refresh" class="strafakte-button" title="Aktualisieren">↻</button>
            <button id="strafakte-close" class="strafakte-button close" title="Schließen">✖</button>
          </div>
        </div>
      `;
      
      // Detailansicht
      if (activeView === 'detail') {
        contentHtml += `
          <div class="strafakte-list-title">
            <span>Detailansicht</span>
          </div>
          ${renderDetailView()}
        `;
      } 
      // Tab-Inhalte
      else {
        contentHtml += `<div class="strafakte-tab-content ${minimalistClass}">`;
        
        switch (activeView) {
          case 'summary':
            // Zusammenfassung
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
                <div style="text-align:center;padding:10px;color:#f04747">
                  ${currentStrafakteData.error}
                </div>
              `;
            }
            break;
            
          case 'warnings':
            // Verwarnungen
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
            // Entbannungen
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
            // Strafen
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
                contentHtml += `
                  <div class="strafakte-entry strafakte-penalty-category-${p.category} ${p.expired ? 'strafakte-entry-expired' : ''}" data-index="${index}">
                    <div><strong>Tat:</strong> ${p.offense?.substring(0, 70) || "Keine Tat angegeben"}</div>
                    <div><strong>Strafe:</strong> ${p.text.substring(0, 50)}</div>
                    <div class="strafakte-entry-category">${p.category}${p.expired ? ' (Abgelaufen)' : ''}</div>
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
            // Watchlist
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
        
        contentHtml += `</div>`; // Ende .strafakte-tab-content
      }

      popup.innerHTML = contentHtml;

      // Event Listener für Tabs und Navigation
      document.querySelectorAll('.strafakte-stat, .strafakte-back-button').forEach(el => {
        const view = el.getAttribute('data-view');
        if (view) {
          el.addEventListener('click', () => changeView(view as any));
        }
      });

      // Event Listener für Einträge in Listenansichten
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

      // Event Listener für Buttons
      document.getElementById("strafakte-close")?.addEventListener("click", () => {
        hidePopupWithAnimation();
        isPinned = false;
        isMouseOverPopup = false;
        isMouseOverAvatar = false;
        activeView = 'summary';
        detailSourceView = null;
      });

      document.getElementById("strafakte-copy-id")?.addEventListener("click", () => {
        if (currentUserId) {
          navigator.clipboard.writeText(currentUserId);
          const btn = document.getElementById("strafakte-copy-id");
          if (btn) {
            btn.textContent = "✓";
            setTimeout(() => btn.textContent = "📋", 2000);
          }
        }
      });

      document.getElementById("strafakte-refresh")?.addEventListener("click", async () => {
        if (!currentUserId) return;
        
        const refreshBtn = document.getElementById("strafakte-refresh");
        if (refreshBtn) {
          refreshBtn.style.transition = "transform 0.5s ease";
          refreshBtn.style.transform = "rotate(360deg)";
          setTimeout(() => {
            if (refreshBtn) refreshBtn.style.transform = "rotate(0deg)";
          }, 500);
        }
        
        const oldLeft = popup.style.left;
        const oldTop = popup.style.top;
        
        currentStrafakteData = await fetchStrafakte(currentUserId);
        renderStrafakteContent();
        
        popup.style.left = oldLeft;
        popup.style.top = oldTop;
      });

      document.getElementById("strafakte-pin")?.addEventListener("click", () => {
        isPinned = !isPinned;
        const pinBtn = document.getElementById("strafakte-pin");
        if (pinBtn) {
          pinBtn.className = `strafakte-button ${isPinned ? 'pinned' : 'unpinned'}`;
          pinBtn.innerHTML = isPinned ? '🔒' : '🔓';
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
            detailSourceView = null;
          }, 500);
        }
      }
    });

    // Hover Logik für Avatare
    const handleAvatarHover = (el: HTMLElement) => {
      if (el.closest("#r6de-supporter-popup")) {
        return;
      }
      
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

        // Lösche Timer
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
        window.addEventListener("mousemove", tempMouseMoveListener);

        openTimer = setTimeout(async () => {
          if (isPinned) return;
          
          // Verbesserte Ladeanzeige
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
                <div class="strafakte-avatar" style="background:#2c2f33;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Fehler</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">✖</button>
                </div>
              </div>
              <div style="padding:20px;text-align:center;color:#f04747">
                Benutzer-ID konnte nicht extrahiert werden
              </div>
            `;
            
            // Event-Listener für Schließen-Button hinzufügen
            document.getElementById("strafakte-close")?.addEventListener("click", () => {
              hidePopupWithAnimation();
            });
            return;
          }
          
          // FIX: Bot-Fälle mit Schließen-Button
          const user = UserStore.getUser(finalUserId);
          if (user?.bot) {
            popup.innerHTML = `
              <div class="strafakte-header">
                <div class="strafakte-avatar" style="background:#2c2f33;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>
                <div class="strafakte-user-info">
                  <div class="strafakte-username">Bot</div>
                  <div class="strafakte-userid">${finalUserId}</div>
                </div>
                <div class="strafakte-button-container">
                  <button id="strafakte-close" class="strafakte-button close" title="Schließen">✖</button>
                </div>
              </div>
              <div style="padding:20px;text-align:center">
                Bots haben keine Strafakte
              </div>
            `;
            
            // Event-Listener für Schließen-Button hinzufügen
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
        
        // Verzögertes Schließen
        if (!isMouseOverPopup) {
          avatarLeaveTimer = setTimeout(() => {
            if (!isMouseOverPopup && !isPinned) {
              hidePopupWithAnimation();
              activeView = 'summary';
              detailSourceView = null;
            }
          }, 300);
        }
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
    };

    // Einladungsvorschau
    const handleInvitePreview = (link: HTMLAnchorElement) => {
      if (link.hasAttribute("data-r6de-invite-processed")) return;
      link.setAttribute("data-r6de-invite-processed", "true");

      const code = link.href.match(inviteRegex)?.[3];
      if (!code) return;

      fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true&with_expiration=true`)
        .then(res => res.json())
        .then(data => {
          let tooltip: HTMLElement | null = null;
          let tooltipMouseMoveHandler: ((event: MouseEvent) => void) | null = null;

          link.addEventListener("mouseenter", (e) => {
            tooltip = document.createElement("div");
            tooltip.className = "invite-preview-tooltip";
            Object.assign(tooltip.style, {
              position: "fixed",
              background: "rgba(0, 0, 0, 0.85)",
              backdropFilter: "blur(5px)",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              zIndex: "10000",
              maxWidth: "300px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
              pointerEvents: "none",
              fontSize: "13px",
              fontFamily: "Whitney, Helvetica Neue, Helvetica, Arial, sans-serif"
            });
            document.body.appendChild(tooltip);

            const g = data.guild || {}, c = data.channel || {};
            const icon = g.id && g.icon
              ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=64" style="width:48px;height:48px;border-radius:6px;margin-bottom:8px;">`
              : "";
            const channelTypes = ["Text", "DM", "Voice", "Gruppen-DM", "Kategorie", "Neuigkeiten", "Shop", "Bühne", "Forum"];

            tooltip.innerHTML = `
              ${icon}
              <div><strong>🏷️ ${g.name || "Unbekannt oder abgelaufen"}</strong></div>
              <div>💬 #${c.name || "?"} (${channelTypes[c.type] || "Unbekannt"})</div>
              <div>👥 Mitglieder: ${data.approximate_member_count || "Unbekannt"}</div>
            `;

            positionPopup(tooltip, e as MouseEvent, 12, 12);
          });

          link.addEventListener("mousemove", (e) => {
            if (tooltip) positionPopup(tooltip, e as MouseEvent, 12, 12);
          });

          link.addEventListener("mouseleave", () => {
            if (tooltip) {
              tooltip.remove();
              tooltip = null;
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

          // Avatar-Hover (alle Typen)
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

    // Initiale Verarbeitung vorhandener Elemente
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
    document.querySelectorAll('.invite-preview-tooltip').forEach(el => el.remove());
    document.querySelectorAll('[data-r6de-processed]').forEach(el => el.removeAttribute("data-r6de-processed"));
    document.querySelectorAll('[data-r6de-invite-processed]').forEach(el => el.removeAttribute("data-r6de-invite-processed"));
  }
});
