import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import { 
  showToast, 
  ChannelStore, 
  UserStore, 
  SelectedChannelStore
} from "@webpack/common";

const GUILD_ID = "787620905269854259";
const STRAFAKTE_CHANNEL_ID = "795999721839525929";
const WATCHLIST_CHANNEL_ID = "843185952122077224";

const settings = definePluginSettings({
  targetUserId: {
    type: OptionType.STRING,
    description: "User ID for voice channel notifications",
    default: ""
  },
  avatarHoverDelay: {
    type: OptionType.NUMBER,
    description: "Avatar hover delay (ms)",
    default: 200,
    min: 0,
    max: 5000
  },
  roundedCorners: {
    type: OptionType.BOOLEAN,
    description: "Rounded corners",
    default: true
  },
  backgroundColor: {
    type: OptionType.STRING,
    description: "Background color (Hex)",
    default: "#1a1d21"
  },
  popupWidth: {
    type: OptionType.NUMBER,
    description: "Popup width (px)",
    default: 400,
    min: 200,
    max: 600
  },
  popupMaxHeight: {
    type: OptionType.NUMBER,
    description: "Maximum popup height (px)",
    default: 600,
    min: 200,
    max: 1000
  },
  restrictToServer: {
    type: OptionType.BOOLEAN,
    description: "Restrict to R6DE server",
    default: true
  },
  defaultPinned: {
    type: OptionType.BOOLEAN,
    description: "Pin by default",
    default: false
  },
  textColor: {
    type: OptionType.STRING,
    description: "Text color (Hex)",
    default: "#e8ecef"
  },
  accentColor: {
    type: OptionType.STRING,
    description: "Accent color (Hex)",
    default: "#5865f2"
  },
  popupOpacity: {
    type: OptionType.NUMBER,
    description: "Popup opacity (0.0 - 1.0)",
    default: 0.95,
    min: 0.5,
    max: 1.0,
    step: 0.05
  },
  animationTiming: {
    type: OptionType.NUMBER,
    description: "Animation duration (ms)",
    default: 300,
    min: 100,
    max: 1000
  },
  popupPosition: {
    type: OptionType.SELECT,
    description: "Popup position",
    default: "bottom-right",
    options: [
      { label: "Bottom Right", value: "bottom-right" },
      { label: "Bottom Left", value: "bottom-left" },
      { label: "Top Right", value: "top-right" },
      { label: "Top Left", value: "top-left" }
    ]
  },
  showAvatars: {
    type: OptionType.BOOLEAN,
    description: "Show avatars",
    default: true
  },
  minimalistMode: {
    type: OptionType.BOOLEAN,
    description: "Minimalist popup style",
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
  name: "R6DEsupportTool",
  description: "Enhanced user management tool with Strafakte and voice notifications",
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
          const channel = ChannelStore.getChannel(state.channelId);
          const user = UserStore.getUser(state.userId);
          showToast(`${user?.username || state.userId} joined ${channel?.name || "Unknown"}`);
        }
      }
    }
  },

  async start() {
    // Initialize popup
    const popup = document.createElement("div");
    popup.id = "r6de-supporter-popup";
    popup.classList.add("r6de-supporter-popup");

    Object.assign(popup.style, {
      position: "fixed",
      background: settings.store.backgroundColor,
      backdropFilter: "blur(12px)",
      color: settings.store.textColor,
      padding: "16px",
      borderRadius: settings.store.roundedCorners ? "16px" : "0",
      fontSize: "14px",
      zIndex: "10000",
      pointerEvents: "auto",
      display: "none",
      width: `${settings.store.popupWidth}px`,
      maxHeight: settings.store.popupMaxHeight > 0 ? `${settings.store.popupMaxHeight}px` : "none",
      overflowY: "auto",
      boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      fontWeight: "500",
      lineHeight: "1.6",
      cursor: "default",
      opacity: settings.store.popupOpacity.toString(),
      visibility: "hidden",
      transform: "scale(0.95) translateY(10px)",
      transition: `all ${settings.store.animationTiming}ms cubic-bezier(0.2, 0, 0, 1)`
    });

    document.body.appendChild(popup);

    // Global styles
    const style = document.createElement("style");
    style.textContent = `
      .r6de-supporter-popup {
        transition: all ${settings.store.animationTiming}ms cubic-bezier(0.2, 0, 0, 1);
      }

      .r6de-supporter-popup::-webkit-scrollbar {
        width: 6px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-track {
        background: transparent;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb {
        background: ${settings.store.accentColor}40;
        border-radius: 3px;
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb:hover {
        background: ${settings.store.accentColor}80;
      }

      .r6de-button {
        background: ${settings.store.accentColor};
        color: #ffffff;
        border: none;
        padding: 8px;
        border-radius: 8px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
      }
      .r6de-button:hover {
        background: ${settings.store.accentColor}cc;
        transform: translateY(-1px);
      }
      .r6de-button:active {
        transform: translateY(0);
      }
      .r6de-button.pinned {
        background: #43b581;
      }
      .r6de-button.unpinned {
        background: #f04747;
      }
      .r6de-button.close {
        background: transparent;
        color: #f04747;
      }
      .r6de-button.close:hover {
        background: #f047471a;
      }

      .r6de-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding-bottom: 16px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
      }

      .r6de-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        border: 2px solid ${settings.store.accentColor}33;
        transition: transform 0.3s ease;
      }
      .r6de-avatar:hover {
        transform: scale(1.05);
      }

      .r6de-user-info {
        flex: 1;
        overflow: hidden;
      }
      .r6de-username {
        font-size: 16px;
        font-weight: 600;
        color: #ffffff;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .r6de-userid {
        font-size: 12px;
        color: #adb5bd;
        margin-top: 4px;
        font-family: 'IBM Plex Mono', monospace;
      }

      .r6de-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }
      .r6de-stat {
        background: rgba(255,255,255,0.05);
        border-radius: 12px;
        padding: 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
      }
      .r6de-stat:hover {
        background: rgba(255,255,255,0.1);
        transform: translateY(-2px);
      }
      .r6de-stat-value {
        font-size: 20px;
        font-weight: 700;
        color: ${settings.store.accentColor};
      }
      .r6de-stat-label {
        font-size: 12px;
        color: #adb5bd;
        margin-top: 6px;
        text-transform: uppercase;
      }

      .r6de-warning {
        background: rgba(255,204,0,0.1);
        border-radius: 8px;
        padding: 12px;
        margin: 12px 0;
        border-left: 4px solid #ffcc00;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .r6de-list-container {
        max-height: 300px;
        overflow-y: auto;
        margin-top: 8px;
        padding-right: 4px;
      }
      .r6de-list-title {
        font-size: 15px;
        font-weight: 600;
        color: ${settings.store.accentColor};
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .r6de-entry {
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 12px;
        margin-bottom: 8px;
        border-left: 4px solid;
        transition: all 0.3s ease;
        cursor: pointer;
      }
      .r6de-entry:hover {
        transform: translateX(4px);
        background: rgba(255,255,255,0.08);
      }
      .r6de-entry.expired {
        opacity: 0.65;
        border-left-style: dashed;
      }
      .r6de-entry-category {
        font-size: 11px;
        padding: 4px 8px;
        border-radius: 12px;
        background: rgba(255,255,255,0.1);
        display: inline-block;
        margin-top: 6px;
      }
      .r6de-entry-date {
        font-size: 12px;
        color: #adb5bd;
        margin-top: 6px;
      }

      .r6de-penalty-A { border-color: #43b581; }
      .r6de-penalty-B { border-color: #faa61a; }
      .r6de-penalty-C { border-color: #f57731; }
      .r6de-penalty-D { border-color: #f04747; }
      .r6de-penalty-E { border-color: #593695; }
      .r6de-penalty-KICK { border-color: #ff9500; }
      .r6de-penalty-UNKNOWN { border-color: #6c757d; }
      .r6de-warning-entry { border-color: #faa61a; }
      .r6de-unban-entry { border-color: #43b581; }
      .r6de-watchlist-entry { border-color: ${settings.store.accentColor}; }

      .r6de-back-button {
        background: none;
        border: none;
        color: ${settings.store.accentColor};
        cursor: pointer;
        font-size: 14px;
        padding: 4px 8px;
        border-radius: 6px;
        transition: all 0.2s ease;
      }
      .r6de-back-button:hover {
        background: ${settings.store.accentColor}1a;
      }

      .r6de-detail-view {
        background: rgba(255,255,255,0.05);
        border-radius: 8px;
        padding: 12px;
        margin-top: 12px;
        animation: slideIn 0.3s ease;
      }
      .r6de-detail-title {
        font-size: 15px;
        font-weight: 600;
        color: ${settings.store.accentColor};
        margin-bottom: 12px;
      }
      .r6de-detail-field {
        margin-bottom: 12px;
      }
      .r6de-detail-label {
        font-size: 12px;
        color: #adb5bd;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .r6de-detail-value {
        font-size: 14px;
        word-break: break-word;
      }

      .r6de-empty-state {
        text-align: center;
        padding: 16px;
        color: #adb5bd;
        font-style: italic;
      }

      .r6de-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px;
      }
      .r6de-loading-spinner {
        width: 36px;
        height: 36px;
        border: 3px solid ${settings.store.accentColor}33;
        border-top-color: ${settings.store.accentColor};
        border-radius: 50%;
        animation: spin 1s ease-in-out infinite;
      }
      .r6de-loading-text {
        margin-top: 12px;
        color: #adb5bd;
        font-size: 14px;
      }

      @keyframes slideIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .r6de-invite-preview {
        background: ${settings.store.backgroundColor};
        backdrop-filter: blur(12px);
        color: ${settings.store.textColor};
        border-radius: ${settings.store.roundedCorners ? '12px' : '0'};
        padding: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 13px;
        max-width: 280px;
        opacity: ${settings.store.popupOpacity};
        transition: all ${settings.store.animationTiming}ms cubic-bezier(0.2, 0, 0, 1);
      }

      .minimalist-mode .r6de-header { padding-bottom: 12px; }
      .minimalist-mode .r6de-avatar { width: 36px; height: 36px; }
      .minimalist-mode .r6de-username { font-size: 14px; }
      .minimalist-mode .r6de-userid { font-size: 11px; }
      .minimalist-mode .r6de-stat { padding: 10px; }
      .minimalist-mode .r6de-stat-value { font-size: 18px; }
      .minimalist-mode .r6de-stat-label { font-size: 11px; }
      .minimalist-mode .r6de-list-container { max-height: 250px; }
      .minimalist-mode .r6de-entry { padding: 10px; font-size: 13px; }
    `;
    document.head.appendChild(style);

    let isPinned = settings.store.defaultPinned;
    let currentUserId: string | null = null;
    let currentStrafakteData: StrafakteData | null = null;
    let isMouseOverPopup = false;
    let isMouseOverAvatar = false;
    let activeView: 'summary' | 'warnings' | 'unbans' | 'penalties' | 'watchlist' | 'detail' = 'summary';
    let detailEntry: PenaltyEntry | WarningEntry | UnbanEntry | WatchlistEntry | null = null;
    let detailSourceView: 'warnings' | 'unbans' | 'penalties' | 'watchlist' | null = null;
    let latestMouseEvent: MouseEvent | null = null;
    let hoverTimer: ReturnType<typeof setTimeout> | null = null;

    // Dragging logic
    let isDragging = false;
    let dragOffsetX = 0;
    let dragOffsetY = 0;

    popup.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      isDragging = true;
      dragOffsetX = e.clientX - popup.getBoundingClientRect().left;
      dragOffsetY = e.clientY - popup.getBoundingClientRect().top;
      popup.style.cursor = "grabbing";
      e.preventDefault();
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      let newLeft = e.clientX - dragOffsetX;
      let newTop = e.clientY - dragOffsetY;
      const rect = popup.getBoundingClientRect();
      newLeft = Math.max(10, Math.min(window.innerWidth - rect.width - 10, newLeft));
      newTop = Math.max(10, Math.min(window.innerHeight - rect.height - 10, newTop));
      popup.style.left = `${newLeft}px`;
      popup.style.top = `${newTop}px`;
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      popup.style.cursor = "default";
    });

    // Utility functions
    function positionPopup(element: HTMLElement, e: MouseEvent) {
      const rect = element.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const margin = 10;
      let left = e.pageX + 15;
      let top = e.pageY + 15;

      switch (settings.store.popupPosition) {
        case "bottom-left":
          left = e.pageX - rect.width - 15;
          break;
        case "top-right":
          top = e.pageY - rect.height - 15;
          break;
        case "top-left":
          left = e.pageX - rect.width - 15;
          top = e.pageY - rect.height - 15;
          break;
      }

      left = Math.max(margin, Math.min(vw - rect.width - margin, left));
      top = Math.max(margin, Math.min(vh - rect.height - margin, top));
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      element.style.maxHeight = `${Math.min(settings.store.popupMaxHeight, vh - top - margin)}px`;
    }

    function showPopup() {
      popup.style.display = "block";
      popup.style.visibility = "visible";
      popup.style.opacity = "1";
      popup.style.transform = "scale(1) translateY(0)";
    }

    function hidePopup() {
      popup.style.opacity = "0";
      popup.style.transform = "scale(0.95) translateY(10px)";
      setTimeout(() => {
        popup.style.display = "none";
        popup.style.visibility = "hidden";
        activeView = 'summary';
        detailSourceView = null;
      }, settings.store.animationTiming);
    }

    function getUserIdFromElement(el: HTMLElement): string | null {
      // React Fiber extraction
      for (const key in el) {
        if (key.startsWith("__reactFiber$")) {
          let fiber = (el as any)[key];
          while (fiber) {
            const props = fiber.pendingProps || fiber.memoizedProps;
            const userId = props?.user?.id || props?.userId || 
                          (props?.id?.match(/^\d{17,20}$/) ? props.id : null);
            if (userId) return userId;
            fiber = fiber.return;
          }
        }
      }

      // Profile popup
      const profilePopup = el.closest('[class*="userProfileOuter"]');
      if (profilePopup) {
        const userIdElement = profilePopup.querySelector('[class*="userTag"]');
        if (userIdElement) {
          const userIdMatch = userIdElement.textContent?.match(/\d{17,20}/);
          if (userIdMatch) return userIdMatch[0];
        }
      }

      // Avatar URL
      if (el instanceof HTMLImageElement && el.classList.contains('avatar')) {
        const match = el.src.match(/avatars\/(\d{17,20})\//);
        if (match) return match[1];
      }

      // Background image
      if (el instanceof HTMLDivElement && el.style.backgroundImage) {
        const match = el.style.backgroundImage.match(/avatars\/(\d{17,20})\//);
        if (match) return match[1];
      }

      // Parent element
      const parent = el.closest('[data-user-id], [data-author-id]');
      return parent?.getAttribute('data-user-id') || parent?.getAttribute('data-author-id') || null;
    }

    async function getUserIdFromContextMenu(el: HTMLElement): Promise<string | null> {
      return new Promise((resolve) => {
        const style = document.createElement("style");
        style.textContent = `[role="menu"] { visibility: hidden !important; }`;
        document.head.appendChild(style);

        const rect = el.getBoundingClientRect();
        const event = new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: rect.left + 1,
          clientY: rect.top + 1,
          button: 2
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
        el.dispatchEvent(event);

        setTimeout(() => {
          observer.disconnect();
          style.remove();
          resolve(null);
        }, 600);
      });
    }

    function parseStrafeKategorie(strafe: string): string {
      const cleanStrafe = strafe.replace(/^\*\*|\*\*$/g, '').trim().toLowerCase();
      if (/warn/i.test(cleanStrafe)) return "B";
      if (/kick/i.test(cleanStrafe)) return "KICK";
      if (/1h|1 h|1 stunde/i.test(cleanStrafe)) return "A";
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

    let tokenCache: string | undefined;
    async function getToken(): Promise<string | undefined> {
      if (tokenCache) return tokenCache;
      try {
        (window as any).webpackChunkdiscord_app.push([
          [Math.random()],
          {},
          (req: any) => {
            for (const m in req.c) {
              const mod = req.c[m].exports;
              if (mod?.getToken) {
                tokenCache = mod.getToken();
                return tokenCache;
              }
            }
          }
        ]);
      } catch (e) {
        console.error("Token fetch error:", e);
      }
      return tokenCache;
    }

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
            error: "Bots have no Strafakte",
            username: user.username,
            avatarUrl: user.getAvatarURL()
          };
        }

        const token = tokenCache || (await getToken()) || "";
        if (!token) {
          return {
            warnCount: 0,
            unbanCount: 0,
            watchlistCount: 0,
            penalties: [],
            warnings: [],
            unbans: [],
            watchlist: [],
            newestActiveDays: 0,
            error: "No token available"
          };
        }

        // Fetch Strafakte
        const strafakteUrl = `https://discord.com/api/v9/guilds/${GUILD_ID}/messages/search?content=ID%3A%20${userId}&channel_id=${STRAFAKTE_CHANNEL_ID}&include_nsfw=true`;
        let res = await fetch(strafakteUrl, { headers: { Authorization: token } });
        if (res.status === 401) {
          tokenCache = undefined;
          res = await fetch(strafakteUrl, { headers: { Authorization: await getToken() || "" } });
        }
        const strafakteData = res.ok ? await res.json() : { messages: [] };
        const strafakteMessages = strafakteData.messages?.flat() || [];

        // Fetch Watchlist
        const watchlistUrl = `https://discord.com/api/v9/guilds/${GUILD_ID}/messages/search?content=ID%3A%20${userId}&channel_id=${WATCHLIST_CHANNEL_ID}&include_nsfw=true`;
        const watchlistRes = await fetch(watchlistUrl, { headers: { Authorization: token } });
        const watchlistData = watchlistRes.ok ? await watchlistRes.json() : { messages: [] };
        const watchlistMessages = watchlistData.messages?.flat() || [];

        const watchlistEntries: WatchlistEntry[] = watchlistMessages
          .filter((msg: any) => msg.content.includes(`ID: ${userId}`))
          .map((msg: any) => ({
            reason: msg.content.split("\n")
              .find((line: string) => /vorwurf|grund/i.test(line))
              ?.replace(/Vorwurf:|Grund:/i, "").trim() || "No reason specified",
            date: new Date(msg.timestamp)
          }));

        if (!strafakteMessages.length && !watchlistEntries.length) {
          return {
            warnCount: 0,
            unbanCount: 0,
            watchlistCount: watchlistEntries.length,
            penalties: [],
            warnings: [],
            unbans: [],
            watchlist: watchlistEntries,
            newestActiveDays: 0,
            error: "No entries found",
            username: user?.username || `User ${userId}`,
            avatarUrl: user?.getAvatarURL()
          };
        }

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
            unbans.push({
              reason: content.split("\n")
                .find((line: string) => line.toLowerCase().startsWith("grund:"))
                ?.replace(/Grund:/i, "").trim() || "No reason specified",
              date: new Date(msg.timestamp)
            });
            continue;
          }

          const offense = content.split("\n")
            .find((line: string) => line.toLowerCase().startsWith("tat:"))
            ?.replace(/Tat:/i, "").trim() || "No offense specified";
          const strafeText = content.split("\n")
            .find((line: string) => line.toLowerCase().startsWith("strafe:"))
            ?.replace(/Strafe:/i, "").trim() || "";
          
          if (!strafeText) continue;

          const category = parseStrafeKategorie(strafeText);
          if (category === "B") {
            warnCount++;
            warnings.push({ offense, date: new Date(msg.timestamp) });
            continue;
          }
          if (category === "UNKNOWN") continue;

          const timestamp = new Date(msg.timestamp);
          const ageDays = (Date.now() - timestamp.getTime()) / 86400000;
          const expired = category !== "E" && category !== "KICK" && (
            (category === "A" && ageDays > 1) ||
            (category === "C" && ageDays > 30) ||
            (category === "D" && ageDays > 60)
          );

          const daysMatch = strafeText.match(/(\d+)d/i);
          const days = daysMatch ? parseInt(daysMatch[1]) : 0;

          penalties.push({
            text: strafeText,
            category,
            expired,
            days,
            offense,
            date: new Date(msg.timestamp)
          });

          if (!expired && days > newestActiveDays) {
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
          username: user?.username || `User ${userId}`
        };
      } catch (error) {
        console.error("Strafakte fetch error:", error);
        return {
          warnCount: 0,
          unbanCount: 0,
          watchlistCount: 0,
          penalties: [],
          warnings: [],
          unbans: [],
          watchlist: [],
          newestActiveDays: 0,
          error: "Server error"
        };
      }
    }

    function changeView(view: 'summary' | 'warnings' | 'unbans' | 'penalties' | 'watchlist' | 'detail') {
      activeView = view;
      renderStrafakte();
    }

    function showDetail(entry: PenaltyEntry | WarningEntry | UnbanEntry | WatchlistEntry, sourceView: 'warnings' | 'unbans' | 'penalties' | 'watchlist') {
      detailEntry = entry;
      detailSourceView = sourceView;
      changeView('detail');
    }

    function renderDetailView() {
      if (!detailEntry) return '';
      let html = `
        <div class="r6de-detail-title">Details</div>
        <div class="r6de-detail-view">
      `;

      if ('category' in detailEntry) {
        const penalty = detailEntry as PenaltyEntry;
        html += `
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Category</div>
            <div class="r6de-detail-value">${penalty.category === 'KICK' ? 'Kick' : penalty.category === 'UNKNOWN' ? 'Unknown' : penalty.category}</div>
          </div>
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Penalty</div>
            <div class="r6de-detail-value">${penalty.text}</div>
          </div>
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Offense</div>
            <div class="r6de-detail-value">${penalty.offense || 'Not specified'}</div>
          </div>
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Date</div>
            <div class="r6de-detail-value">${penalty.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
          </div>
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Status</div>
            <div class="r6de-detail-value">${penalty.expired ? 'Expired' : 'Active'}</div>
          </div>
        `;
      } else if ('offense' in detailEntry) {
        const warning = detailEntry as WarningEntry;
        html += `
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Offense</div>
            <div class="r6de-detail-value">${warning.offense}</div>
          </div>
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Date</div>
            <div class="r6de-detail-value">${warning.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
          </div>
        `;
      } else {
        const entry = detailEntry as UnbanEntry | WatchlistEntry;
        const isUnban = detailSourceView === 'unbans';
        html += `
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">${isUnban ? 'Unban Reason' : 'Watchlist Reason'}</div>
            <div class="r6de-detail-value">${entry.reason}</div>
          </div>
          <div class="r6de-detail-field">
            <div class="r6de-detail-label">Date</div>
            <div class="r6de-detail-value">${entry.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
          </div>
        `;
      }

      html += `
        </div>
        <button class="r6de-back-button" data-view="${detailSourceView || 'summary'}">Back</button>
      `;
      return html;
    }

    function renderStrafakte() {
      if (!currentStrafakteData) {
        popup.innerHTML = '<div class="r6de-empty-state">No data available</div>';
        return;
      }

      const minimalistClass = settings.store.minimalistMode ? "minimalist-mode" : "";
      let html = `
        <div class="r6de-header ${minimalistClass}">
          ${settings.store.showAvatars && currentStrafakteData.avatarUrl ? 
            `<img src="${currentStrafakteData.avatarUrl}" class="r6de-avatar" />` :
            `<div class="r6de-avatar" style="background:#2c2f33;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>`}
          <div class="r6de-user-info">
            <div class="r6de-username" title="${currentStrafakteData.username}">${currentStrafakteData.username || "Unknown"}</div>
            <div class="r6de-userid" title="${currentUserId}">${currentUserId || "Unknown ID"}</div>
          </div>
          <div style="display:flex;gap:8px">
            <button id="r6de-pin" class="r6de-button ${isPinned ? 'pinned' : 'unpinned'}" title="${isPinned ? 'Pinned' : 'Pin'}">${isPinned ? '🔒' : '🔓'}</button>
            <button id="r6de-copy" class="r6de-button" title="Copy ID">📋</button>
            <button id="r6de-refresh" class="r6de-button" title="Refresh">↻</button>
            <button id="r6de-close" class="r6de-button close" title="Close">✖</button>
          </div>
        </div>
      `;

      if (activeView === 'detail') {
        html += `
          <div class="r6de-list-title">Details</div>
          ${renderDetailView()}
        `;
      } else {
        html += `<div class="${minimalistClass}">`;
        switch (activeView) {
          case 'summary':
            html += `
              <div class="r6de-stats">
                <div class="r6de-stat" data-view="warnings">
                  <div class="r6de-stat-value">${currentStrafakteData.warnCount}</div>
                  <div class="r6de-stat-label">Warnings</div>
                </div>
                <div class="r6de-stat" data-view="unbans">
                  <div class="r6de-stat-value">${currentStrafakteData.unbanCount}</div>
                  <div class="r6de-stat-label">Unbans</div>
                </div>
                <div class="r6de-stat" data-view="penalties">
                  <div class="r6de-stat-value">${currentStrafakteData.penalties.length}</div>
                  <div class="r6de-stat-label">Penalties</div>
                </div>
                <div class="r6de-stat" data-view="watchlist">
                  <div class="r6de-stat-value">${currentStrafakteData.watchlistCount}</div>
                  <div class="r6de-stat-label">Watchlist</div>
                </div>
              </div>
            `;
            if (currentStrafakteData.newestActiveDays > 0) {
              html += `
                <div class="r6de-warning">⚠ Next penalty may add ${currentStrafakteData.newestActiveDays} days!</div>
              `;
            }
            if (currentStrafakteData.error) {
              html += `<div class="r6de-empty-state" style="color:#f04747">${currentStrafakteData.error}</div>`;
            }
            break;
          case 'warnings':
            html += `
              <div class="r6de-list-title">
                <span>Warnings (${currentStrafakteData.warnCount})</span>
                <button class="r6de-back-button" data-view="summary">Back</button>
              </div>
              <div class="r6de-list-container">
                ${currentStrafakteData.warnings.length ? currentStrafakteData.warnings.map((w, i) => `
                  <div class="r6de-entry r6de-warning-entry" data-index="${i}">
                    <div><strong>Offense:</strong> ${w.offense.substring(0, 70)}</div>
                    <div class="r6de-entry-date">${w.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
                  </div>
                `).join('') : '<div class="r6de-empty-state">No warnings</div>'}
              </div>
            `;
            break;
          case 'unbans':
            html += `
              <div class="r6de-list-title">
                <span>Unbans (${currentStrafakteData.unbanCount})</span>
                <button class="r6de-back-button" data-view="summary">Back</button>
              </div>
              <div class="r6de-list-container">
                ${currentStrafakteData.unbans.length ? currentStrafakteData.unbans.map((u, i) => `
                  <div class="r6de-entry r6de-unban-entry" data-index="${i}">
                    <div><strong>Reason:</strong> ${u.reason.substring(0, 70)}</div>
                    <div class="r6de-entry-date">${u.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
                  </div>
                `).join('') : '<div class="r6de-empty-state">No unbans</div>'}
              </div>
            `;
            break;
          case 'penalties':
            html += `
              <div class="r6de-list-title">
                <span>Penalties (${currentStrafakteData.penalties.length})</span>
                <button class="r6de-back-button" data-view="summary">Back</button>
              </div>
              <div class="r6de-list-container">
                ${currentStrafakteData.penalties.length ? currentStrafakteData.penalties.map((p, i) => `
                  <div class="r6de-entry r6de-penalty-${p.category} ${p.expired ? 'expired' : ''}" data-index="${i}">
                    <div><strong>Offense:</strong> ${p.offense?.substring(0, 70) || 'Not specified'}</div>
                    <div><strong>Penalty:</strong> ${p.text.substring(0, 50)}</div>
                    <div class="r6de-entry-category">${p.category === 'KICK' ? 'Kick' : p.category === 'UNKNOWN' ? 'Unknown' : p.category}${p.expired ? ' (Expired)' : ''}</div>
                    <div class="r6de-entry-date">${p.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
                  </div>
                `).join('') : '<div class="r6de-empty-state">No penalties</div>'}
              </div>
            `;
            break;
          case 'watchlist':
            html += `
              <div class="r6de-list-title">
                <span>Watchlist (${currentStrafakteData.watchlistCount})</span>
                <button class="r6de-back-button" data-view="summary">Back</button>
              </div>
              <div class="r6de-list-container">
                ${currentStrafakteData.watchlist.length ? currentStrafakteData.watchlist.map((w, i) => `
                  <div class="r6de-entry r6de-watchlist-entry" data-index="${i}">
                    <div><strong>Reason:</strong> ${w.reason.substring(0, 70)}</div>
                    <div class="r6de-entry-date">${w.date?.toLocaleDateString('en-US') || 'Unknown'}</div>
                  </div>
                `).join('') : '<div class="r6de-empty-state">No watchlist entries</div>'}
              </div>
            `;
            break;
        }
        html += `</div>`;
      }

      popup.innerHTML = html;

      // Event listeners
      document.querySelectorAll('.r6de-stat, .r6de-back-button').forEach(el => {
        const view = el.getAttribute('data-view');
        if (view) el.addEventListener('click', () => changeView(view as any));
      });

      if (activeView !== 'detail' && activeView !== 'summary') {
        document.querySelectorAll('.r6de-entry').forEach((el, index) => {
          el.addEventListener('click', () => {
            let entry = null;
            switch (activeView) {
              case 'warnings': entry = currentStrafakteData?.warnings[index]; break;
              case 'unbans': entry = currentStrafakteData?.unbans[index]; break;
              case 'penalties': entry = currentStrafakteData?.penalties[index]; break;
              case 'watchlist': entry = currentStrafakteData?.watchlist[index]; break;
            }
            if (entry) showDetail(entry, activeView);
          });
        });
      }

      document.getElementById("r6de-close")?.addEventListener("click", hidePopup);
      document.getElementById("r6de-copy")?.addEventListener("click", () => {
        if (currentUserId) {
          navigator.clipboard.writeText(currentUserId);
          const btn = document.getElementById("r6de-copy");
          if (btn) {
            btn.innerHTML = "✓";
            setTimeout(() => btn.innerHTML = "📋", 1500);
          }
        }
      });
      document.getElementById("r6de-refresh")?.addEventListener("click", async () => {
        if (!currentUserId) return;
        const btn = document.getElementById("r6de-refresh");
        if (btn) {
          btn.style.transition = "transform 0.4s ease";
          btn.style.transform = "rotate(360deg)";
          setTimeout(() => btn.style.transform = "rotate(0deg)", 400);
        }
        currentStrafakteData = await fetchStrafakte(currentUserId);
        renderStrafakte();
      });
      document.getElementById("r6de-pin")?.addEventListener("click", () => {
        isPinned = !isPinned;
        const btn = document.getElementById("r6de-pin");
        if (btn) {
          btn.className = `r6de-button ${isPinned ? 'pinned' : 'unpinned'}`;
          btn.innerHTML = isPinned ? '🔒' : '🔓';
          btn.title = isPinned ? 'Pinned' : 'Pin';
        }
      });

      window.addEventListener('resize', () => {
        if (popup.style.display === 'block' && latestMouseEvent) {
          positionPopup(popup, latestMouseEvent);
        }
      });
    }

    popup.addEventListener("mouseenter", () => {
      isMouseOverPopup = true;
      if (hoverTimer) clearTimeout(hoverTimer);
    });

    popup.addEventListener("mouseleave", () => {
      isMouseOverPopup = false;
      if (!isPinned && !isDragging) {
        hoverTimer = setTimeout(hidePopup, 200);
      }
    });

    const handleAvatarHover = (el: HTMLElement) => {
      if (el.hasAttribute("data-r6de-processed")) return;
      el.setAttribute("data-r6de-processed", "true");

      let openTimer: ReturnType<typeof setTimeout> | null = null;

      const handleMouseEnter = async (e: MouseEvent) => {
        if (settings.store.restrictToServer) {
          const channelId = SelectedChannelStore.getChannelId();
          const guildId = channelId ? ChannelStore.getChannel(channelId)?.guild_id : null;
          if (guildId !== GUILD_ID) return;
        }

        isMouseOverAvatar = true;
        if (hoverTimer) clearTimeout(hoverTimer);
        latestMouseEvent = e;

        openTimer = setTimeout(async () => {
          if (isPinned) return;

          let userId = getUserIdFromElement(el);
          if (!userId) userId = await getUserIdFromContextMenu(el);

          popup.innerHTML = `
            <div class="r6de-loading">
              <div class="r6de-loading-spinner"></div>
              <div class="r6de-loading-text">Loading...</div>
            </div>
          `;
          showPopup();
          positionPopup(popup, e);

          if (!userId) {
            popup.innerHTML = `
              <div class="r6de-header">
                <div class="r6de-avatar" style="background:#2c2f33;display:flex;align-items:center;justify-content:center;font-size:20px">👤</div>
                <div class="r6de-user-info">
                  <div class="r6de-username">Error</div>
                </div>
                <div style="display:flex;gap:8px">
                  <button id="r6de-close" class="r6de-button close" title="Close">✖</button>
                </div>
              </div>
              <div class="r6de-empty-state" style="color:#f04747">Could not retrieve user ID</div>
            `;
            document.getElementById("r6de-close")?.addEventListener("click", hidePopup);
            return;
          }

          currentUserId = userId;
          currentStrafakteData = await fetchStrafakte(userId);
          renderStrafakte();
          positionPopup(popup, e);
        }, settings.store.avatarHoverDelay);
      };

      const handleMouseLeave = () => {
        isMouseOverAvatar = false;
        clearTimeout(openTimer!);
        if (!isMouseOverPopup && !isPinned) {
          hoverTimer = setTimeout(hidePopup, 200);
        }
      };

      el.addEventListener("mouseenter", handleMouseEnter);
      el.addEventListener("mouseleave", handleMouseLeave);
      el.addEventListener("mousedown", () => {
        if (!isPinned) hidePopup();
      });
    };

    const inviteRegex = /https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/([\w-]+)/;
    const handleInvitePreview = (link: HTMLAnchorElement) => {
      if (link.hasAttribute("data-r6de-invite-processed")) return;
      link.setAttribute("data-r6de-invite-processed", "true");
      link.title = "";

      const code = link.href.match(inviteRegex)?.[3];
      if (!code) return;

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
              maxWidth: "280px",
              pointerEvents: "none"
            });
            document.body.appendChild(tooltip);

            const g = data.guild || {}, c = data.channel || {};
            const icon = g.id && g.icon ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=48" style="width:40px;height:40px;border-radius:8px;margin-bottom:8px">` : "";
            const channelTypes = ["Text", "DM", "Voice", "Group DM", "Category", "News", "Shop", "Stage", "Forum"];
            tooltip.innerHTML = `
              ${icon}
              <div><strong>${g.name || "Unknown or expired"}</strong></div>
              <div>#${c.name || "Unknown"} (${channelTypes[c.type] || "Unknown"})</div>
              <div>Members: ${data.approximate_member_count || "Unknown"}</div>
            `;
            tooltip.style.display = "block";
            tooltip.style.opacity = "0";
            tooltip.style.transform = "scale(0.95)";
            setTimeout(() => {
              if (tooltip) {
                tooltip.style.opacity = "1";
                tooltip.style.transform = "scale(1)";
              }
            }, 10);
            positionPopup(tooltip, e as MouseEvent);
          });

          link.addEventListener("mousemove", (e) => {
            if (tooltip) positionPopup(tooltip, e as MouseEvent);
          });

          link.addEventListener("mouseleave", () => {
            if (tooltip) {
              tooltip.style.opacity = "0";
              tooltip.style.transform = "scale(0.95)";
              setTimeout(() => tooltip?.remove(), settings.store.animationTiming);
            }
          });
        });
    };

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (!(node instanceof HTMLElement)) continue;
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
            if (avatar instanceof HTMLElement) handleAvatarHover(avatar);
          });

          const links = node.querySelectorAll<HTMLAnchorElement>("a[href*='discord.gg'], a[href*='discord.com/invite']");
          links.forEach(handleInvitePreview);
        }
      }
    });

    document.querySelectorAll(`
      img[class*="avatar"],
      .wrapper__44b0c,
      .voiceUser_efcaf8 .userAvatar__55bab,
      .voiceUser_efcaf8 .avatar__07f91,
      .avatarContainer__6b330,
      div[class*="avatar"][style*="background-image"],
      [class*="userPopout"] img[class*="avatar"],
      [class*="userProfile"] img[class*="avatar"]
    `).forEach((avatar: Element) => {
      if (avatar instanceof HTMLElement) handleAvatarHover(avatar);
    });

    document.querySelectorAll<HTMLAnchorElement>("a[href*='discord.gg'], a[href*='discord.com/invite']").forEach(handleInvitePreview);

    observer.observe(document.body, { childList: true, subtree: true });
    this.observers.push(observer);
  },

  stop() {
    this.observers.forEach(obs => obs.disconnect());
    document.getElementById("r6de-supporter-popup")?.remove();
    document.querySelectorAll('.r6de-invite-preview').forEach(el => el.remove());
    document.querySelectorAll('[data-r6de-processed]').forEach(el => el.removeAttribute("data-r6de-processed"));
    document.querySelectorAll('[data-r6de-invite-processed]').forEach(el => el.removeAttribute("data-r6de-invite-processed"));
  }
});
