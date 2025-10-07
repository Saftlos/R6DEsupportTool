import definePlugin, { OptionType } from "@utils/types";
import { definePluginSettings } from "@api/Settings";
import {
  showToast,
  ChannelStore,
  UserStore,
  SelectedChannelStore,
  GuildMemberStore,
  FluxDispatcher
} from "@webpack/common";

const settings = definePluginSettings({
  showActionButtons: {
    type: OptionType.BOOLEAN,
    description: "Aktions-Buttons (Update, Settings) im Popup anzeigen",
    default: true
  },
  targetUserId: {
    type: OptionType.STRING,
    description: "Benutzer-ID für Sprachkanal-Benachrichtigungen",
    default: ""
  },
  avatarHoverDelay: {
    type: OptionType.NUMBER,
    description: "Verzögerung beim Hovern (ms)",
    default: 250,
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
    description: "Nur auf dem R6DE Server anzeigen",
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
    description: "Randgröße (px)",
    default: 1,
    min: 0,
    max: 10
  },
  borderColor: {
    type: OptionType.STRING,
    description: "Randfarbe (Hex)",
    default: "#2563eb"
  },
  borderStyle: {
    type: OptionType.SELECT,
    description: "Randstil",
    default: "solid",
    options: [
      { label: "Solid", value: "solid" },
      { label: "Dashed", value: "dashed" },
      { label: "Dotted", value: "dotted" },
      { label: "Double", value: "double" }
    ]
  },
  popupOpacity: {
    type: OptionType.NUMBER,
    description: "Deckkraft (0.0 - 1.0)",
    default: 0.97,
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
      { label: "Unten Rechts", value: "bottom-right" },
      { label: "Unten Links", value: "bottom-left" },
      { label: "Oben Rechts", value: "top-right" },
      { label: "Oben Links", value: "top-left" }
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
    description: "Leuchtintensität",
    default: "medium",
    options: [
      { label: "Aus", value: "none" },
      { label: "Niedrig", value: "low" },
      { label: "Mittel", value: "medium" },
      { label: "Hoch", value: "high" }
    ]
  },
  notesStorage: {
    type: OptionType.STRING,
    description: "Interner Speicher für Notizen. Bitte nicht manuell bearbeiten.",
    default: "{}",
    hidden: true
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

interface UnmuteEntry {
  date: Date;
}

interface WatchlistEntry {
  reason: string;
  date: Date;
}

interface StrafakteData {
  warnCount: number;
  unbanCount: number;
  unmuteCount: number;
  watchlistCount: number;
  penalties: PenaltyEntry[];
  warnings: WarningEntry[];
  unbans: UnbanEntry[];
  unmutes: UnmuteEntry[];
  watchlist: WatchlistEntry[];
  newestActiveDays: number;
  error?: string;
  avatarUrl?: string;
  username?: string;
}

interface NotesData { [userId: string]: string; }

interface ChangelogData {
    version: string;
    changes: string;
    knownBugs: string;
}

export default definePlugin({
  name: "R6DEsupporterTool",
  description: "Zeigt die Strafakte, Einladungsvorschau & Sprachbenachrichtigungen für den R6DE Server an.",
  authors: [{ id: "549586034242093069", name: "Saftlos" }],
  settings,
  dependencies: ["ContextMenuAPI"],
  
  version: "5.3.0",
  source: "https://github.com/Saftlos/R6DEsupportTool",
  updateAvailable: false as boolean,
  changelogData: { version: "Lade...", changes: "Lade...", knownBugs: "Lade..." } as ChangelogData,

  observers: [] as MutationObserver[],
  localNotes: {} as NotesData,
  settingsListener: null as (() => void) | null,

  flux: {
    VOICE_STATE_UPDATES({ voiceStates }: { voiceStates: any[] }) {
      const targetId = settings.store.targetUserId;
      if (!targetId) return;

      for (const state of voiceStates) {
        if (state.userId === targetId && state.channelId && !state.oldChannelId) {
          const channelObj = ChannelStore.getChannel(state.channelId);
          const channelName = channelObj?.name || "Unbekannt";
          const user = UserStore.getUser(state.userId)?.username || state.userId;
          showToast(`${user} hat den Kanal ${channelName} betreten`);
        }
      }
    }
  },

  async start() {
    const self = this;

    try {
      const storedNotes = JSON.parse(settings.store.notesStorage);
      if (storedNotes && typeof storedNotes === 'object') {
        self.localNotes = storedNotes;
      }
    } catch (e) {
      console.error(`${this.name}: Fehler beim Laden der Notizen.`, e);
      self.localNotes = {};
    }
    const saveNotes = () => {
      settings.store.notesStorage = JSON.stringify(self.localNotes);
    };

    const GUILD_ID = "787620905269854259";

    const popup = document.createElement("div");
    popup.id = "r6de-supporter-popup";
    popup.classList.add("r6de-supporter-popup");

    const invitePopup = document.createElement("div");
    invitePopup.id = "r6de-invite-popup";
    invitePopup.classList.add("r6de-supporter-popup");
    
    // --- RENDER FUNCTIONS ---
    // We define them here to have access to the 'start' scope variables like 'self' and 'popup'.

function renderUpdateConfirmView() {
    return `
        <div class="update-view">
            <div class="strafakte-list-title" style="justify-content: center;">🚀 Update Bereit</div>
            <button id="update-copy-code-btn" class="update-copy-button">Neuen Code kopieren</button>
            <div class="strafakte-detail-view">
                <b>Anleitung:</b><br>
                <ol>
                    <li>Klicke oben, um den neuen Code in die Zwischenablage zu kopieren.</li>
                    <li>Öffne die Plugin-Datei <code>R6DEsupportTool.tsx</code> in deinem Vencord-Verzeichnis unter <code>Vencord\\src\\userplugins\\R6DEsupportTool.tsx</code>.</li>
                    <li>Ersetze den gesamten alten Code durch den kopierten Code.</li>
                    <li>Speichere die Datei und führe dein Installer-Skript (z.B. <code>install.bat</code>) aus, um das Plugin zu aktualisieren.</li>
                </ol>
            </div>
            <button class="strafakte-back-button" data-view="summary">← Zurück</button>
        </div>
    `;
}
    function renderSettingsInfoView() {
        const pluginName = "R6DEsupporterTool";
        const settingsText = `
            Live-Änderungen sind bald verfügbar.
            <br><br>
            Um die Einstellungen anzupassen, gehe zu deinen <b>Benutzer-Einstellungen</b> im Vencord-Bereich. 
            Suche dort nach dem Plugin <b>'${pluginName}'</b> und klicke auf das Zahnrad-Symbol ⚙️.
            <br><br>
            <b>Bitte beachte:</b> Einige Änderungen erfordern einen kompletten Neustart von Discord, andere werden sofort übernommen.
        `;
        return `
            <div class="strafakte-list-title">
                <span>Einstellungen</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
            </div>
            <div class="strafakte-detail-view" style="margin-top: 12px; text-align: left; line-height: 1.6;">
                ${settingsText}
            </div>
        `;
    }
    
    function renderChangelogBugsView() {
        return `
            <div class="strafakte-list-title">
                <span>Changelog & Bekannte Fehler</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
            </div>
            <div class="changelog-container">
                <div class="changelog-section">
                    <h3 class="changelog-section-title">Version: ${self.changelogData.version}</h3>
                    <div class="changelog-content">${self.changelogData.changes}</div>
                </div>
                <div class="changelog-section">
                    <h3 class="changelog-section-title">Bekannte Fehler</h3>
                    <div class="changelog-content">${self.changelogData.knownBugs}</div>
                </div>
            </div>
        `;
    }

    function renderDetailView() {
      if (!detailEntry) return '';

      let detailHtml = `
        <div class="strafakte-list-title">
            <span>Detailansicht</span>
            <button class="strafakte-back-button" data-view="${detailSourceView || 'summary'}">← Zurück</button>
        </div>
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
        const labelText = isUnban ? "Grund für Entbannung" : "Vorwurf";

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
      } else if ('date' in detailEntry && !('reason' in detailEntry)) {
        const unmute = detailEntry as UnmuteEntry;
        detailHtml += `
          <div class="strafakte-detail-field">
            <div class="strafakte-detail-label">Datum</div>
            <div class="strafakte-detail-value">${unmute.date?.toLocaleDateString('de-DE') || 'Unbekannt'}</div>
          </div>
        `;
      }

      detailHtml += `</div>`;

      return detailHtml;
    }

    function renderStrafakteContent() {
      if (!currentStrafakteData) {
        popup.innerHTML = "Keine Daten verfügbar";
        return;
      }
      
      const minimalistClass = settings.store.minimalistPopup ? "minimalist-popup" : "";
      const noteIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; color: var(--text-primary); -webkit-text-fill-color: var(--text-primary);"><path d="M13.4 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8.6a2 2 0 0 0-.6-1.4L14.8 2.6a2 2 0 0 0-1.4-.6z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>`;

      let contentHtml = `<div class="${minimalistClass}">`;

      contentHtml += `
        <div class="strafakte-header">
          ${settings.store.showAvatars && currentStrafakteData.avatarUrl ? `
            <div class="user-info-trigger" style="cursor: pointer;">
                <img src="${currentStrafakteData.avatarUrl}" class="strafakte-avatar" />
            </div>
          ` : `<div class="strafakte-avatar user-info-trigger" style="background:linear-gradient(135deg,rgba(37,99,235,0.2) 0%,rgba(59,130,246,0.15) 100%);display:flex;align-items:center;justify-content:center;font-size:22px;color:#3b82f6;border-radius:12px;cursor:pointer;">👤</div>`}
          <div class="strafakte-user-info">
            <div class="strafakte-username" title="${currentStrafakteData.username}">
              ${currentStrafakteData.username || "Unbekannt"}
            </div>
            <div class="strafakte-userid" title="${currentUserId}">
              ${currentUserId || "ID unbekannt"}
            </div>
          </div>
          <div class="strafakte-button-container">
            <button id="strafakte-pin" class="strafakte-button ${isPinned ? 'pinned' : 'unpinned'}" title="${isPinned ? 'Angepinnt' : 'Anpinnen'}">
              ${isPinned ? '🔒' : '🔓'}
            </button>
            <button id="strafakte-copy-id" class="strafakte-button" title="ID kopieren">📋</button>
            <button id="strafakte-refresh" class="strafakte-button" title="Aktualisieren">🔄</button>
            <button id="strafakte-close" class="strafakte-button close" title="Schließen">×</button>
          </div>
        </div>
      `;
      contentHtml += `<div class="strafakte-tab-content">`;
        
        switch (activeView) {
          case 'summary':
            const hasNote = !!(self.localNotes[currentUserId] && self.localNotes[currentUserId].trim());
            
            contentHtml += `
              <div class="strafakte-stats">
                <div class="strafakte-stat" data-view="penalties">
                  <div class="strafakte-stat-value">${currentStrafakteData.penalties.length}</div>
                  <div class="strafakte-stat-label">Strafen</div>
                </div>
                <div class="strafakte-stat" data-view="warnings">
                  <div class="strafakte-stat-value">${currentStrafakteData.warnCount}</div>
                  <div class="strafakte-stat-label">Warnungen</div>
                </div>
                <div class="strafakte-stat" data-view="unbans">
                  <div class="strafakte-stat-value">${currentStrafakteData.unbanCount}</div>
                  <div class="strafakte-stat-label">Entbannungen</div>
                </div>
                <div class="strafakte-stat notes-stat ${hasNote ? 'has-note' : 'no-note'}" data-view="notes">
                    <div class="strafakte-stat-value">${noteIcon}</div>
                    <div class="strafakte-stat-label">Notizen</div>
                </div>
              </div>
            `;

            if (currentStrafakteData.newestActiveDays > 0) {
              contentHtml += `
                <div class="strafakte-warning">
                ⚠️ Die nächste Strafe könnte um ${currentStrafakteData.newestActiveDays} Tage verlängert werden!
                </div>
              `;
            }
            break;

          case 'warnings':
            contentHtml += `
              <div class="strafakte-list-title">
                <span>Warnungen (${currentStrafakteData.warnCount})</span>
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
              contentHtml += `<div class="strafakte-empty-state">Keine Warnungen</div>`;
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

          case 'unmutes':
            contentHtml += `
              <div class="strafakte-list-title">
                <span>Entstummungen (${currentStrafakteData.unmuteCount})</span>
                <button class="strafakte-back-button" data-view="summary">← Zurück</button>
              </div>
              <div class="strafakte-list-container">
            `;

            if (currentStrafakteData.unmutes.length > 0) {
              currentStrafakteData.unmutes.forEach((u, index) => {
                const dateStr = u.date ? u.date.toLocaleDateString('de-DE') : 'Unbekanntes Datum';
                contentHtml += `
                  <div class="strafakte-entry strafakte-unmute-entry" data-index="${index}">
                    <div><strong>Datum:</strong> ${dateStr}</div>
                  </div>
                `;
              });
            } else {
              contentHtml += `<div class="strafakte-empty-state">Keine Entstummungen</div>`;
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
            
          case 'detail':
            contentHtml += renderDetailView();
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

          case 'notes':
            const noteText = self.localNotes[currentUserId] || '';
            contentHtml += `
                <div class="strafakte-list-title">
                    <span>Private Notizen</span>
                    <button class="strafakte-back-button" data-view="summary">← Zurück</button>
                </div>
                <div class="r6de-notes-container" style="display: flex; flex-direction: column; gap: 10px; margin-top: 8px;">
                    <textarea id="r6de-notes-textarea" placeholder="Deine privaten Notizen zu diesem Benutzer..." style="width: 100%; box-sizing: border-box; min-height: 200px; background: rgba(10, 10, 15, 0.8); border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px; color: #f1f5f9; font-size: 13px; padding: 12px; resize: vertical;">${noteText}</textarea>
                    <div style="font-size: 11px; font-style: italic; text-align: center; opacity: 0.6;">Notizen werden automatisch gespeichert.</div>
                </div>
                `;
            break;

          case 'info':
            const user = UserStore.getUser(currentUserId);
            const member = GuildMemberStore.getMember(GUILD_ID, currentUserId);
            let suspicionWarningHtml = '';

            if (user && member?.joinedAt) {
              const accountCreation = new Date(user.createdAt);
              const serverJoin = new Date(member.joinedAt);
              const diffHours = (serverJoin.getTime() - accountCreation.getTime()) / (1000 * 60 * 60);
              if (diffHours >= 0 && diffHours < 72) {
                suspicionWarningHtml = `<div class="strafakte-warning" style="border-color: rgba(239, 68, 68, 0.5); color: #f87171;">🚨 Account kurz vor Serverbeitritt erstellt!</div>`;
              }
            }

            contentHtml += `
                <div class="strafakte-list-title">
                    <span>Benutzerinformationen</span>
                    <button class="strafakte-back-button" data-view="summary">← Zurück</button>
                </div>
                ${suspicionWarningHtml}
                <div class="strafakte-detail-view">
                    <div class="strafakte-detail-field">
                        <div class="strafakte-detail-label">Account erstellt</div>
                        <div class="strafakte-detail-value">${formatTimestamp(user?.createdAt ?? null)}</div>
                    </div>
                    <div class="strafakte-detail-field">
                        <div class="strafakte-detail-label">Server beigetreten</div>
                        <div class="strafakte-detail-value">${formatTimestamp(member?.joinedAt ?? null)}</div>
                    </div>
                    <div class="strafakte-detail-field">
                        <div class="strafakte-detail-label">Nickname</div>
                        <div class="strafakte-detail-value">${member?.nick ?? '<em>Keiner</em>'}</div>
                    </div>
                </div>
            `;
            break;
        
          case 'settings-info':
            contentHtml += renderSettingsInfoView();
            break;

          case 'update-confirm':
            contentHtml += renderUpdateConfirmView();
            break;
        
          case 'changelog-bugs':
            contentHtml += renderChangelogBugsView();
            break;
        }

      contentHtml += `</div>`; // .strafakte-tab-content
      
      if (activeView === 'summary') {
          let footerHtml = '';
          if (settings.store.showActionButtons) {
              let updateButtonHtml = '';
              if (self.updateAvailable) {
                  updateButtonHtml = `<button id="strafakte-update" class="strafakte-button update-available" title="Neues Update verfügbar!">Update Verfügbar</button>`;
              } else {
                  updateButtonHtml = `<button class="strafakte-button update-unavailable" title="Du bist auf dem neusten Stand." disabled>Aktuell</button>`;
              }
              footerHtml = `
                  <div class="strafakte-footer">
                      <div class="footer-update-status">${updateButtonHtml}</div>
                      <div class="footer-buttons-right">
                          <button id="strafakte-changelog" class="strafakte-button" title="Changelog & Bugs">📜</button>
                          <button id="strafakte-settings" class="strafakte-button" title="Einstellungen">⚙️</button>
                      </div>
                  </div>`;
          }
          contentHtml += footerHtml;
          if (currentStrafakteData.error) {
              contentHtml += `<div class="api-error-bar">${currentStrafakteData.error}</div>`;
          }
      }

      contentHtml += `</div>`; // .minimalist-popup wrapper
      popup.innerHTML = contentHtml;

      const addEventListeners = () => {
        document.querySelectorAll('.strafakte-stat, .strafakte-back-button').forEach(el => {
          const view = el.getAttribute('data-view');
          if (view) {
            el.addEventListener('click', () => changeView(view as any), { passive: true });
          }
        });

        if (activeView !== 'detail' && activeView !== 'summary' && activeView !== 'info' && activeView !== 'settings-info' && activeView !== 'update-confirm' && activeView !== 'changelog-bugs') {
          document.querySelectorAll('.strafakte-entry').forEach((el) => {
            el.addEventListener('click', () => {
              const index = parseInt(el.getAttribute('data-index'));
              let entry = null;
              switch (activeView) {
                case 'warnings':
                  entry = currentStrafakteData?.warnings[index];
                  break;
                case 'unbans':
                  entry = currentStrafakteData?.unbans[index];
                  break;
                case 'unmutes':
                  entry = currentStrafakteData?.unmutes[index];
                  break;
                case 'penalties':
                  entry = currentStrafakteData?.penalties[index];
                  break;
                case 'watchlist':
                  entry = currentStrafakteData?.watchlist[index];
                  break;
              }
              if (entry) showEntryDetail(entry, activeView as any);
            }, { passive: true });
          });
        }
        
        if (activeView === 'update-confirm') {
            const copyBtn = document.getElementById('update-copy-code-btn');
            copyBtn?.addEventListener('click', async () => {
                try {
                    const response = await fetch("https://raw.githubusercontent.com/Saftlos/R6DEsupportTool/main/R6DEsupportTool.tsx", { cache: "no-store" });
                    const code = await response.text();
                    await navigator.clipboard.writeText(code);
                    copyBtn.textContent = "✓ Kopiert!";
                    copyBtn.style.background = "var(--success-gradient)";
                    setTimeout(() => {
                        copyBtn.textContent = "Neuen Code kopieren";
                        copyBtn.style.background = "";
                    }, 2500);
                } catch(err) {
                    copyBtn.textContent = "Fehler!";
                    copyBtn.style.background = "var(--error-gradient)";
                    console.error("Fehler beim Kopieren des Codes:", err);
                }
            });
        }

        const closeBtn = document.getElementById("strafakte-close");
        const copyBtn = document.getElementById("strafakte-copy-id");
        const refreshBtn = document.getElementById("strafakte-refresh");
        const pinBtn = document.getElementById("strafakte-pin");
        const settingsBtn = document.getElementById("strafakte-settings");
        const changelogBtn = document.getElementById("strafakte-changelog");
        const updateBtn = document.getElementById("strafakte-update");

        closeBtn?.addEventListener("click", () => {
          hidePopup(popup);
          isPinned = settings.store.defaultPinned;
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
              console.error('Kopieren fehlgeschlagen:', err);
            }
          }
        });

        refreshBtn?.addEventListener("click", async () => {
          if (!currentUserId) return;

          refreshBtn.style.transform = "rotate(360deg)";
          refreshBtn.style.transition = "transform 0.5s ease-in-out";

          setTimeout(() => {
            if (refreshBtn) {
              refreshBtn.style.transform = "";
              refreshBtn.style.transition = "";
            }
          }, 500);

          const oldLeft = popup.style.left;
          const oldTop = popup.style.top;

          await fetchChangelog();
          await checkForUpdates();
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
            pinBtn.title = isPinned ? 'Angepinnt' : 'Anpinnen';
          }
        });
        
        settingsBtn?.addEventListener("click", () => changeView('settings-info'));
        changelogBtn?.addEventListener("click", () => changeView('changelog-bugs'));
        updateBtn?.addEventListener("click", () => changeView('update-confirm'));

        if (activeView === 'notes' && currentUserId) {
          const textarea = document.querySelector('#r6de-notes-textarea') as HTMLTextAreaElement;
          const userIdForNote = currentUserId;
          if (textarea) {
            let debounceTimeout: number;
            textarea.addEventListener('input', () => {
              clearTimeout(debounceTimeout);
              debounceTimeout = window.setTimeout(() => {
                self.localNotes[userIdForNote] = textarea.value;
                saveNotes();
                
                const notesStatButton = document.querySelector('.notes-stat');
                if (notesStatButton) {
                    const hasValue = textarea.value.trim().length > 0;
                    notesStatButton.classList.toggle('has-note', hasValue);
                    notesStatButton.classList.toggle('no-note', !hasValue);
                }
              }, 350);
            });
          }
        }

        document.querySelector(".user-info-trigger")?.addEventListener("click", () => {
          if (activeView !== 'info') {
            changeView('info');
          }
        });
      };

      requestAnimationFrame(addEventListeners);
    }
    
    // --- CORE LOGIC & INITIALIZATION ---
    
    const fetchChangelog = async () => {
        try {
            const response = await fetch("https://raw.githubusercontent.com/Saftlos/R6DEsupportTool/main/CHANGELOG.md", { cache: "no-store" });
            const text = await response.text();

            const versionMatch = text.match(/^Version:\s*(.*)/m);
            const changesMatch = text.match(/^Änderungen:\s*([\s\S]*?)(?=\n^Bekannte Bugs:|$)/m);
            const bugsMatch = text.match(/^Bekannte Bugs:\s*([\s\S]*)/m);

            self.changelogData.version = versionMatch ? versionMatch[1].trim() : "Unbekannt";
            self.changelogData.changes = changesMatch ? changesMatch[1].trim().replace(/\*/g, '•') : "Konnte Änderungen nicht laden.";
            self.changelogData.knownBugs = bugsMatch ? bugsMatch[1].trim().replace(/\*/g, '•') : "Konnten bekannte Fehler nicht laden.";
            
        } catch (error) {
            console.error(`${self.name}: Fehler beim Abrufen der Changelog-Daten.`, error);
            self.changelogData.version = "Fehler";
            self.changelogData.changes = "Fehler beim Laden.";
            self.changelogData.knownBugs = "Fehler beim Laden.";
        }
    };


    const checkForUpdates = async () => {
        try {
            const repoUrl = "https://raw.githubusercontent.com/Saftlos/R6DEsupportTool/main/R6DEsupportTool.tsx";
            const response = await fetch(repoUrl, { cache: "no-store" });
            const remoteCode = await response.text();
            const remoteVersionMatch = remoteCode.match(/version: "([^"]+)"/);
            if (remoteVersionMatch && remoteVersionMatch[1] > self.version) {
                self.updateAvailable = true;
            } else {
                self.updateAvailable = false;
            }
        } catch (error) { 
            console.error(`${self.name}: Fehler bei der Update-Prüfung.`, error);
            self.updateAvailable = false;
        }
        if (popup.style.display === 'block') renderStrafakteContent();
    };
    
    checkForUpdates();
    fetchChangelog();
    
    const hexToRgba = (hex: string, alpha: number) => {
        let r = 0, g = 0, b = 0;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            if (hex.length === 4) {
                r = parseInt(hex[1] + hex[1], 16);
                g = parseInt(hex[2] + hex[2], 16);
                b = parseInt(hex[3] + hex[3], 16);
            } else if (hex.length === 7) {
                r = parseInt(hex.substring(1, 3), 16);
                g = parseInt(hex.substring(3, 5), 16);
                b = parseInt(hex.substring(5, 7), 16);
            }
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        return `rgba(10, 10, 15, ${alpha})`;
    };

    const smoothCubicBezier = 'cubic-bezier(0.4, 0, 0.2, 1)';
    const basePopupStyles = {
        position: "fixed",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        padding: "20px",
        fontSize: "13px",
        pointerEvents: "auto",
        display: "none",
        overflowY: "auto",
        boxShadow: `0 25px 70px rgba(0,0,0,0.9), 0 0 50px rgba(37, 99, 235, 0.4), inset 0 1px 0 rgba(255,255,255,0.08)`,
        fontFamily: "'Whitney', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontWeight: "400",
        lineHeight: "1.5",
        opacity: "0", 
        visibility: "hidden",
        transform: "scale(0.95) translateY(15px)",
    };

    Object.assign(popup.style, basePopupStyles, { zIndex: "20000" });
    Object.assign(invitePopup.style, basePopupStyles, { zIndex: "20001" });
    
    document.body.appendChild(popup);
    document.body.appendChild(invitePopup);
    
    let activePopup: HTMLElement | null = null;
    let offsetX = 0, offsetY = 0;
    let popupWidth = 0, popupHeight = 0;
    let latestMouseEventForDrag: MouseEvent | null = null;
    let animationFrameId: number | null = null;
    
    popup.addEventListener("click", e => e.stopPropagation());
    invitePopup.addEventListener("click", e => e.stopPropagation());

    const handleMouseUp = (e: MouseEvent) => {
        if (!activePopup) {
            e.stopPropagation();
        }
    };
    popup.addEventListener("mouseup", handleMouseUp);
    invitePopup.addEventListener("mouseup", handleMouseUp);
    
    function updatePopupPositionOnDrag() {
        animationFrameId = null; 
        if (!activePopup || !latestMouseEventForDrag) return;

        let newLeft = latestMouseEventForDrag.clientX - offsetX;
        let newTop = latestMouseEventForDrag.clientY - offsetY;
        const margin = 10;

        newLeft = Math.max(margin, Math.min(newLeft, window.innerWidth - popupWidth - margin));
        newTop = Math.max(margin, Math.min(newTop, window.innerHeight - popupHeight - margin));

        activePopup.style.left = `${newLeft}px`;
        activePopup.style.top = `${newTop}px`;
    }

    function dragMove(e: MouseEvent) {
        if (!activePopup) return;
        latestMouseEventForDrag = e; 

        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(updatePopupPositionOnDrag);
        }
    }

    function dragStart(this: HTMLElement, e: MouseEvent) {
        e.stopPropagation();
        
        const target = e.target as HTMLElement;
        if (target.closest('button, a, input, textarea, .strafakte-entry, .strafakte-stat, [data-view]') || e.offsetX > this.clientWidth) return;

        e.preventDefault();
        
        activePopup = this;
        popupWidth = this.offsetWidth;
        popupHeight = this.offsetHeight;
        
        const rect = this.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;

        window.addEventListener('mousemove', dragMove);
        window.addEventListener('mouseup', dragEnd, { once: true });

        document.body.classList.add("is-dragging");
        this.style.cursor = 'grabbing';
        this.style.transition = 'none'; 
    }

    function dragEnd(e: MouseEvent) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }

        if (activePopup) {
            activePopup.style.cursor = 'grab';
            if (settings.store.tooltipAnimation) {
                activePopup.style.transition = `all ${settings.store.animationDuration}ms ${smoothCubicBezier}`;
            }
        }
        window.removeEventListener('mousemove', dragMove);
        document.body.classList.remove("is-dragging");
        activePopup = null;
        e.stopPropagation();
    }
    
    popup.addEventListener('mousedown', dragStart);
    invitePopup.addEventListener('mousedown', dragStart);


    const scrollFixStyle = document.createElement("style");
    scrollFixStyle.textContent = `
      body.is-dragging {
        cursor: grabbing !important;
        user-select: none !important;
      }
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
        box-shadow: 0 0 12px rgba(59, 130, 246, 0.5);
      }
      .r6de-supporter-popup::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
        box-shadow: 0 0 16px rgba(59, 130, 246, 0.7);
      }
      .strafakte-list-container::-webkit-scrollbar,
      .changelog-container::-webkit-scrollbar {
        width: 4px;
      }
      .strafakte-list-container::-webkit-scrollbar-track,
      .changelog-container::-webkit-scrollbar-track {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 6px;
      }
      .strafakte-list-container::-webkit-scrollbar-thumb,
      .changelog-container::-webkit-scrollbar-thumb {
        background: linear-gradient(180deg, #3b82f6 0%, #2563eb 100%);
        border-radius: 6px;
        box-shadow: 0 0 6px rgba(59, 130, 246, 0.3);
      }
    `;
    document.head.appendChild(scrollFixStyle);
    
    let isMouseOverInvitePopup = false;
    let isMouseOverInviteLink = false;
    let invitePopupHideTimeout: ReturnType<typeof setTimeout> | null = null;
    
    const style = document.createElement("style");
    document.head.appendChild(style);

    const updateInjectedCss = () => {
        style.textContent = `
          :root {
            --glow-intensity: ${settings.store.glowIntensity === 'none' ? '0' :
            settings.store.glowIntensity === 'low' ? '0.3' :
              settings.store.glowIntensity === 'medium' ? '0.8' : '1.3'};
          }
          
          .r6de-supporter-popup {
            --primary-blue: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            --primary-blue-hover: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
            --text-primary: #f1f5f9;
            --text-secondary: #a1aab8;
            --success-color: #34d399;
            --error-color: #f87171;
            --success-gradient: linear-gradient(135deg, #34d399 0%, #10b981 100%);
            --warning-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            --error-gradient: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
            --surface-color: linear-gradient(145deg, rgba(20, 20, 25, 0.8) 0%, rgba(10, 10, 15, 0.9) 100%);
            --surface-hover: linear-gradient(145deg, rgba(35, 35, 45, 0.9) 0%, rgba(25, 25, 35, 0.95) 100%);
            scroll-behavior: smooth;
            cursor: grab;
          }
          
          .strafakte-button {
            background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
            color: white;
            border: 1px solid #333;
            padding: 0;
            border-radius: 10px;
            font-size: 14px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            transition: all 0.3s ${smoothCubicBezier};
            box-shadow: 
              0 5px 20px rgba(0, 0, 0, 0.6),
              0 0 15px rgba(59, 130, 246, calc(0.5 * var(--glow-intensity))),
              inset 0 1px 0 rgba(255,255,255,0.1);
            font-weight: 500;
          }
          
          .strafakte-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #252525 0%, #151515 100%);
            transform: scale(1.1) translateY(-2px);
            color: var(--text-primary);
            -webkit-text-fill-color: var(--text-primary);
            border-color: #444;
            box-shadow: 
              0 8px 30px rgba(0, 0, 0, 0.7),
              0 0 35px rgba(59, 130, 246, calc(0.7 * var(--glow-intensity))),
              inset 0 1px 0 rgba(255,255,255,0.2);
          }
          
          .strafakte-button:active:not(:disabled) {
            transform: scale(1.05);
          }

          .strafakte-button.pinned,
          .strafakte-button.unpinned {
              background: transparent;
          }
          .strafakte-button.pinned {
              border: 1px solid var(--success-color);
              box-shadow: 0 0 15px rgba(16, 185, 129, calc(0.3 * var(--glow-intensity)));
          }
          .strafakte-button.pinned:hover {
              background: rgba(52, 211, 153, 0.1);
              border-color: #6ee7b7;
              box-shadow: 0 8px 30px rgba(16, 185, 129, calc(0.6 * var(--glow-intensity))), 0 0 35px rgba(52, 211, 153, calc(0.4 * var(--glow-intensity))), inset 0 1px 0 rgba(255,255,255,0.1);
          }
          .strafakte-button.unpinned {
              border: 1px solid var(--error-color);
              box-shadow: 0 0 15px rgba(239, 68, 68, calc(0.3 * var(--glow-intensity)));
          }
          .strafakte-button.unpinned:hover {
              background: rgba(248, 113, 113, 0.1);
              border-color: #fca5a5;
              box-shadow: 0 8px 30px rgba(239, 68, 68, calc(0.6 * var(--glow-intensity))), 0 0 35px rgba(248, 113, 113, calc(0.4 * var(--glow-intensity))), inset 0 1px 0 rgba(255,255,255,0.1);
          }
          
          .strafakte-button.close {
            background: transparent !important;
            color: #f87171;
            font-size: 20px;
            box-shadow: none;
            transition: all 0.3s ${smoothCubicBezier};
            width: 36px;
            height: 36px;
            font-weight: 700;
            border: none;
          }
          
          .strafakte-button.close:hover {
            color: #ff8f8f;
            -webkit-text-fill-color: #ff8f8f;
            background: linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(239, 68, 68, 0.1) 100%) !important;
            transform: scale(1.15) rotate(90deg);
            box-shadow: 0 0 25px rgba(248, 113, 113, calc(0.6 * var(--glow-intensity))) !important;
          }
          
          .strafakte-button-container {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-left: auto;
          }
          
          .strafakte-avatar {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            margin-right: 16px;
            object-fit: cover;
            border: 2px solid rgba(59, 130, 246, 0.4);
            transition: all 0.3s ${smoothCubicBezier};
            box-shadow: 
              0 6px 20px rgba(0,0,0,0.5),
              0 0 15px rgba(59, 130, 246, calc(0.3 * var(--glow-intensity)));
          }
          
          .strafakte-avatar:hover {
            border-color: #60a5fa;
            transform: scale(1.1);
            box-shadow: 
              0 10px 30px rgba(0,0,0,0.6),
              0 0 25px rgba(59, 130, 246, calc(0.5 * var(--glow-intensity)));
          }
          
          .strafakte-header {
            display: flex;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 18px;
            border-bottom: 1px solid rgba(59, 130, 246, 0.25);
            position: relative;
          }
          
          .strafakte-header::after {
            content: '';
            position: absolute;
            bottom: -1px;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent 0%, rgba(59, 130, 246, 0.7) 50%, transparent 100%);
            box-shadow: 0 0 12px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity)));
          }
          
          .strafakte-user-info {
            flex: 1;
            min-width: 0;
            margin-right: 14px;
          }
          
          .strafakte-username {
            font-weight: 700;
            font-size: 18px;
            background: linear-gradient(135deg, #ffffff 0%, #eaf0fa 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 4px;
            letter-spacing: 0.3px;
            text-shadow: 0 0 25px rgba(255,255,255,calc(0.2 * var(--glow-intensity)));
          }
          
          .strafakte-userid {
            font-size: 11px;
            color: var(--text-secondary);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            font-family: 'Consolas', monospace;
            opacity: 0.8;
            font-weight: 500;
          }
          
          .strafakte-stats {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
            margin-bottom: 18px;
          }
          
          .strafakte-stat {
            background: var(--surface-color);
            border-radius: 12px;
            padding: 14px 8px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ${smoothCubicBezier};
            border: 1px solid rgba(59, 130, 246, 0.2);
            box-shadow: 
              0 5px 20px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.07);
            position: relative;
            overflow: hidden;
          }
          
          .strafakte-stat:hover {
            background: var(--surface-hover);
            transform: translateY(-5px) scale(1.03);
            border-color: rgba(90, 95, 115, 0.5);
            box-shadow: 
              0 12px 35px rgba(0,0,0,0.5),
              0 0 35px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity))),
              inset 0 1px 0 rgba(255,255,255,0.1);
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
            transition: all 0.3s ${smoothCubicBezier};
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
            transition: color 0.3s ${smoothCubicBezier};
          }
          
          .strafakte-stat:hover .strafakte-stat-label {
            color: var(--text-primary);
          }
          
          .notes-stat {
            background: var(--surface-color) !important;
          }
          .notes-stat.has-note {
            border-color: rgba(16, 185, 129, 0.5) !important;
          }
          .notes-stat.no-note {
             border-color: rgba(239, 68, 68, 0.5) !important;
          }
          .notes-stat.has-note:hover {
            border-color: rgba(52, 211, 153, 0.7) !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(52, 211, 153, calc(0.15 * var(--glow-intensity))), inset 0 1px 0 rgba(255,255,255,0.15) !important;
          }
           .notes-stat.no-note:hover {
            border-color: rgba(248, 113, 113, 0.7) !important;
            box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 20px rgba(248, 113, 113, calc(0.15 * var(--glow-intensity))), inset 0 1px 0 rgba(255,255,255,0.15) !important;
          }
          .notes-stat .strafakte-stat-value {
              background: none;
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
            transition: all 0.3s ${smoothCubicBezier};
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
            transition: all 0.3s ${smoothCubicBezier};
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
            transform: translateY(-2px);
            box-shadow: 
              0 4px 16px rgba(37, 99, 235, calc(0.2 * var(--glow-intensity))),
              inset 0 1px 0 rgba(255,255,255,0.15);
          }
          
          .strafakte-entry {
            padding: 12px 14px;
            margin-bottom: 8px;
            background: var(--surface-color);
            border-radius: 12px;
            border-left: 4px solid;
            font-size: 12px;
            line-height: 1.5;
            transition: all 0.3s ${smoothCubicBezier};
            cursor: pointer;
            box-shadow: 
              0 3px 10px rgba(0,0,0,0.4),
              inset 0 1px 0 rgba(255,255,255,0.05);
            position: relative;
            overflow: hidden;
          }
          
          .strafakte-entry:hover {
            background: var(--surface-hover);
            transform: translateX(6px) scale(1.02);
            box-shadow: 
              0 10px 28px rgba(0,0,0,0.5),
              0 0 25px rgba(59, 130, 246, calc(0.25 * var(--glow-intensity))),
              inset 0 1px 0 rgba(255,255,255,0.1);
          }
          
          .strafakte-entry > div {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .strafakte-penalty-category-A { border-color: #10b981; box-shadow: 0 0 12px rgba(16, 185, 129, calc(0.2 * var(--glow-intensity))); }
          .strafakte-penalty-category-B { border-color: #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, calc(0.2 * var(--glow-intensity))); }
          .strafakte-penalty-category-C { border-color: #f97316; box-shadow: 0 0 12px rgba(249, 115, 22, calc(0.2 * var(--glow-intensity))); }
          .strafakte-penalty-category-D { border-color: #ef4444; box-shadow: 0 0 12px rgba(239, 68, 68, calc(0.2 * var(--glow-intensity))); }
          .strafakte-penalty-category-E { border-color: #8b5cf6; box-shadow: 0 0 12px rgba(139, 92, 246, calc(0.2 * var(--glow-intensity))); }
          .strafakte-penalty-category-KICK { border-color: #ff9500; box-shadow: 0 0 12px rgba(255, 149, 0, calc(0.2 * var(--glow-intensity))); }
          .strafakte-penalty-category-UNKNOWN { border-color: #6b7280; box-shadow: 0 0 12px rgba(107, 114, 128, calc(0.1 * var(--glow-intensity))); }
          
          .strafakte-warning-entry { border-color: #f59e0b; box-shadow: 0 0 12px rgba(245, 158, 11, calc(0.2 * var(--glow-intensity))); }
          .strafakte-unban-entry { border-color: #10b981; box-shadow: 0 0 12px rgba(16, 185, 129, calc(0.2 * var(--glow-intensity))); }
          .strafakte-unmute-entry { border-color: #34d399; box-shadow: 0 0 12px rgba(52, 211, 153, calc(0.2 * var(--glow-intensity))); }
          .strafakte-watchlist-entry { border-color: #3b82f6; box-shadow: 0 0 12px rgba(59, 130, 246, calc(0.2 * var(--glow-intensity))); }
          
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
            transition: all 0.3s ${smoothCubicBezier};
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
            animation: fadeIn 0.4s ${smoothCubicBezier};
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
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
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
            width: 40px;
            height: 40px;
            margin-bottom: 20px;
            border: 4px solid rgba(59, 130, 246, 0.25);
            border-radius: 50%;
            border-top-color: #3b82f6;
            animation: spin 1s cubic-bezier(0.6, 0.2, 0.4, 0.8) infinite;
            box-shadow: 0 0 25px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity)));
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
    
          .minimalist-popup .strafakte-header {
            padding-bottom: 14px;
            margin-bottom: 14px;
          }
          .minimalist-popup .strafakte-avatar {
            width: 40px;
            height: 40px;
            border-radius: 10px;
          }
          .minimalist-popup .strafakte-username { font-size: 15px; }
          .minimalist-popup .strafakte-userid { font-size: 10px; }
          .minimalist-popup .strafakte-stat { padding: 12px 6px; min-width: 85px; }
          .minimalist-popup .strafakte-stat-value { font-size: 18px; }
          .minimalist-popup .strafakte-stat-label { font-size: 9px; }
          .minimalist-popup .strafakte-warning { padding: 12px 14px; font-size: 12px; }
          .minimalist-popup .strafakte-list-container { max-height: 200px; }
          .minimalist-popup .strafakte-entry { padding: 10px 12px; font-size: 11px; }

          /* New/Modified Styles */
          .api-error-bar {
            margin-top: 10px; 
            text-align:center;
            padding:14px;
            color:#f87171;
            background:linear-gradient(135deg,rgba(248,113,113,0.15) 0%,rgba(239,68,68,0.1) 100%);
            border-radius:12px;
            border:1px solid rgba(248,113,113,0.3);
            font-weight:500;
          }
          .strafakte-footer {
            margin-top: 16px;
            padding-top: 12px;
            border-top: 1px solid rgba(59, 130, 246, 0.25);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;
          }

          .footer-update-status .strafakte-button {
             width: auto;
             padding: 6px 12px;
             font-size: 12px;
             font-weight: 600;
          }
          .update-available {
              background: transparent;
              border: 1px solid var(--success-color);
              color: var(--success-color);
              box-shadow: 0 4px 15px rgba(16, 185, 129, calc(0.3 * var(--glow-intensity)));
          }
           .update-available:hover {
              background: rgba(52, 211, 153, 0.15) !important;
              color: #86efac !important;
              border-color: #6ee7b7 !important;
              transform: translateY(-2px);
              box-shadow: 0 8px 25px rgba(16, 185, 129, calc(0.5 * var(--glow-intensity)));
          }
           .update-unavailable {
              background: transparent;
              border: 1px solid var(--error-color);
              color: var(--error-color);
              cursor: not-allowed;
              opacity: 0.7;
              box-shadow: 0 4px 15px rgba(239, 68, 68, calc(0.3 * var(--glow-intensity)));
          }
          
          .footer-buttons-right {
            display: flex;
            gap: 8px;
            margin-left: auto;
          }
          
          .update-view { text-align: center; }
          .update-view .strafakte-back-button {
              margin-top: 20px;
          }
          .update-copy-button {
            display: inline-block;
            text-decoration: none;
            padding: 12px 24px;
            margin: 20px 0;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            background: var(--primary-blue);
            transition: all 0.3s ${smoothCubicBezier};
            box-shadow: 0 6px 20px rgba(59, 130, 246, calc(0.4 * var(--glow-intensity)));
            border: none;
            cursor: pointer;
          }
          .update-copy-button:hover {
            background: var(--primary-blue-hover);
            transform: translateY(-3px);
            box-shadow: 0 10px 30px rgba(59, 130, 246, calc(0.6 * var(--glow-intensity)));
          }
          .update-view .strafakte-detail-view { text-align: left; }
          .update-view code { 
            background: rgba(0,0,0,0.3); 
            padding: 2px 6px; 
            border-radius: 6px; 
            font-family: 'Consolas', monospace;
          }

          .changelog-container {
            max-height: 280px;
            overflow-y: auto;
            padding-right: 6px;
          }
          .changelog-section {
              margin-bottom: 16px;
          }
          .changelog-section:last-child {
              margin-bottom: 0;
          }
          .changelog-section-title {
            font-size: 14px;
            font-weight: 700;
            margin-bottom: 8px;
            padding-bottom: 6px;
            border-bottom: 1px solid rgba(59, 130, 246, 0.2);
            color: #93c5fd;
          }
          .changelog-content {
            white-space: pre-wrap;
            background: rgba(0,0,0,0.2);
            padding: 12px;
            border-radius: 8px;
            font-family: 'Consolas', monospace;
            font-size: 12px;
            line-height: 1.6;
          }
        `;
    };

    const updatePopupDynamicStyles = () => {
        const dynamicStyles = {
            background: hexToRgba(settings.store.backgroundColor, settings.store.popupOpacity),
            color: settings.store.textColor,
            borderRadius: settings.store.roundedCorners ? "16px" : "8px",
            width: `${settings.store.popupWidth}px`,
            maxHeight: settings.store.popupMaxHeight > 0 ? `${settings.store.popupMaxHeight}px` : 'none',
            border: `${settings.store.borderSize}px ${settings.store.borderStyle} ${settings.store.borderColor}`,
            transition: settings.store.tooltipAnimation
                ? `all ${settings.store.animationDuration}ms ${smoothCubicBezier}`
                : "none",
        };
        Object.assign(popup.style, dynamicStyles);
        Object.assign(invitePopup.style, dynamicStyles);
    };

    updateInjectedCss();
    updatePopupDynamicStyles();
    
    let popupOpening = false;

    function hidePopup(element: HTMLElement) {
        if (element.style.display !== 'block') return;
    
        if (settings.store.tooltipAnimation) {
            element.style.opacity = "0";
            element.style.transform = "scale(0.95) translateY(15px)";
            setTimeout(() => {
                element.style.display = "none";
                element.style.visibility = "hidden";
            }, settings.store.animationDuration);
        } else {
            element.style.display = "none";
            element.style.visibility = "hidden";
        }
    }

    invitePopup.addEventListener("mouseenter", () => {
        isMouseOverInvitePopup = true;
        if (invitePopupHideTimeout) {
            clearTimeout(invitePopupHideTimeout);
            invitePopupHideTimeout = null;
        }
    });

    invitePopup.addEventListener("mouseleave", () => {
        isMouseOverInvitePopup = false;
        if (!isMouseOverInviteLink) {
            invitePopupHideTimeout = setTimeout(() => hidePopup(invitePopup), 200);
        }
    });

    let currentUserId: string | null = null;
    let isPinned = settings.store.defaultPinned;
    let currentStrafakteData: StrafakteData | null = null;
    const inviteRegex = /https?:\/\/(www\.)?(discord\.gg|discord\.com\/invite)\/([\w-]+)/;

    let popupHideTimeout: ReturnType<typeof setTimeout> | null = null;
    let avatarHoverHideTimeout: ReturnType<typeof setTimeout> | null = null;

    type ViewType = 'summary' | 'warnings' | 'unbans' | 'unmutes' | 'penalties' | 'watchlist' | 'detail' | 'notes' | 'info' | 'update-confirm' | 'settings-info' | 'changelog-bugs';
    let activeView: ViewType = 'summary';
    let detailEntry: PenaltyEntry | WarningEntry | UnbanEntry | UnmuteEntry | WatchlistEntry | null = null;
    let detailSourceView: 'warnings' | 'unbans' | 'unmutes' | 'penalties' | 'watchlist' | null = null;

    let latestAvatarMouseEvent: MouseEvent | null = null;

    const settingsUpdateCallback = () => {
        updateInjectedCss();
        updatePopupDynamicStyles();

        if (popup.style.display === 'block') {
            const oldLeft = popup.style.left;
            const oldTop = popup.style.top;
            renderStrafakteContent();
            popup.style.left = oldLeft;
            popup.style.top = oldTop;
            adjustPopupPosition(popup);
        }
    };
    
    FluxDispatcher.subscribe('SETTINGS_UPDATE', settingsUpdateCallback);
    self.settingsListener = () => FluxDispatcher.unsubscribe('SETTINGS_UPDATE', settingsUpdateCallback);
    
    const formatTimestamp = (date: Date | string | null): string => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('de-DE', { hour12: false });
    };

    function positionPopup(popupElement: HTMLElement, e: MouseEvent, xOffset: number = 20, yOffset: number = 20) {
        const rect = popupElement.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const position = settings.store.popupPosition;
        const margin = 15;

        let clientX = e.clientX;
        let clientY = e.clientY;

        let left: number;
        let top: number;

        switch (position) {
            case "bottom-right":
                left = clientX + xOffset;
                top = clientY + yOffset;
                break;
            case "bottom-left":
                left = clientX - rect.width - xOffset;
                top = clientY + yOffset;
                break;
            case "top-right":
                left = clientX + xOffset;
                top = clientY - rect.height - yOffset;
                break;
            case "top-left":
                left = clientX - rect.width - xOffset;
                top = clientY - rect.height - yOffset;
                break;
        }

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

        popupElement.style.left = `${left}px`;
        popupElement.style.top = `${top}px`;
    }

    function adjustPopupPosition(popupElement: HTMLElement) {
        if (!popupElement || popupElement.style.display === 'none') return;
    
        const rect = popupElement.getBoundingClientRect();
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        const margin = 15;
    
        let left = rect.left;
        let top = rect.top;
        let needsReposition = false;
    
        if (left < margin) {
            left = margin;
            needsReposition = true;
        }
        if (top < margin) {
            top = margin;
            needsReposition = true;
        }
        if (left + rect.width > vw - margin) {
            left = vw - rect.width - margin;
            needsReposition = true;
        }
        if (top + rect.height > vh - margin) {
            top = vh - rect.height - margin;
            needsReposition = true;
        }
    
        if (needsReposition) {
            popupElement.style.left = `${left}px`;
            popupElement.style.top = `${top}px`;
        }
    }

    function showPopupWithAnimation(popupElement: HTMLElement) {
        popupElement.style.display = "block";

        requestAnimationFrame(() => {
            popupElement.style.visibility = "visible";
            popupElement.style.opacity = '1';
            popupElement.style.transform = "scale(1) translateY(0)";
            
            setTimeout(() => adjustPopupPosition(popupElement), 50);
        });
    }
    
    function getUserIdFromElement(el: HTMLElement): string | null {
        for (const key in el) {
            if (key.startsWith("__reactFiber$")) {
                let fiber = (el as any)[key];
                for (let i = 0; i < 15 && fiber; i++) {
                    const props = fiber.pendingProps || fiber.memoizedProps;
                    if (props) {
                        const { user, author, userId, authorId } = props;
                        const id = user?.id || author?.id || userId || authorId || (typeof props.id === 'string' && props.id.match(/^\d{17,20}$/) ? props.id : null);
                        if (id) return id;
                    }
                    fiber = fiber.return;
                }
            }
        }

        const parentWithId = el.closest('[data-user-id]');
        if (parentWithId) return parentWithId.getAttribute('data-user-id');

        const imgElement = el.matches('img[class*="avatar"]') ? el : el.querySelector('img[class*="avatar"]');
        if (imgElement) {
            const src = (imgElement as HTMLImageElement).src;
            const match = src.match(/\/avatars\/(\d{17,20})\//);
            if (match) return match[1];
        }
        
        if (el instanceof HTMLDivElement && el.style.backgroundImage) {
             const match = el.style.backgroundImage.match(/\/avatars\/(\d{17,20})\//);
             if (match) return match[1];
        }

        return null;
    }

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
          document.body.click();
          resolve(null);
        }, 800);
      });
    }

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
        console.error("Token Error:", e);
      }
      return tokenCache;
    }

    async function fetchStrafakte(userId: string): Promise<StrafakteData> {
      try {
        let user: any = UserStore.getUser(userId);
        const improvedError = "Authentifizierung fehlgeschlagen. Lade Discord neu (STRG+R).";

        let tokenStr = tokenCache || (await getToken()) || "";
        if (!tokenStr) return {
          warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0,
          penalties: [], warnings: [], unbans: [], unmutes: [], watchlist: [],
          newestActiveDays: 0, error: improvedError
        };

        if (!user) {
          try {
            const userRes = await fetch(`https://discord.com/api/v9/users/${userId}`, {
              headers: { Authorization: tokenStr }
            });
            if (userRes.ok) {
              const userData = await userRes.json();
              user = {
                ...userData,
                getAvatarURL: () => userData.avatar
                  ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
                  : `https://cdn.discordapp.com/embed/avatars/${(parseInt(userData.discriminator) || 0) % 5}.png`,
              };
            } else if (userRes.status === 401) {
              tokenCache = undefined;
              tokenStr = (await getToken()) || "";
            }
          } catch (e) {
            console.error("R6DE Plugin: Failed to fetch user profile:", e);
          }
        }

        if (user?.bot) {
          return {
            warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0,
            penalties: [], warnings: [], unbans: [], unmutes: [], watchlist: [],
            newestActiveDays: 0, 
            username: user.username, avatarUrl: user.getAvatarURL()
          };
        }

        const strafakteChannelId = "795999721839525929";
        const watchlistChannelId = "843185952122077224";

        const strafakteUrl = `https://discord.com/api/v9/guilds/${GUILD_ID}/messages/search?content=ID%3A%20${userId}&channel_id=${strafakteChannelId}&include_nsfw=true`;
        let res = await fetch(strafakteUrl, { headers: { Authorization: tokenStr } });

        if (res.status === 401) {
          tokenCache = undefined;
          tokenStr = (await getToken()) || "";
          if (!tokenStr) return {
            warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0,
            penalties: [], warnings: [], unbans: [], unmutes: [], watchlist: [],
            newestActiveDays: 0, error: improvedError,
            username: user?.username, avatarUrl: user?.getAvatarURL()
          };
          res = await fetch(strafakteUrl, { headers: { Authorization: tokenStr } });
        }

        if (!res.ok) {
          return {
            warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0,
            penalties: [], warnings: [], unbans: [], unmutes: [], watchlist: [],
            newestActiveDays: 0, error: `API Fehler ${res.status}. Versuche es später erneut.`,
            username: user?.username, avatarUrl: user?.getAvatarURL()
          };
        }

        const strafakteData = await res.json();
        const strafakteMessages = strafakteData.messages.flat();

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
            warnCount: 0, unbanCount: 0, unmuteCount: 0,
            watchlistCount: watchlistEntries.length,
            penalties: [], warnings: [], unbans: [], unmutes: [],
            watchlist: watchlistEntries, newestActiveDays: 0,
            error: "Keine Einträge gefunden",
            username: user?.username || `Benutzer ${userId}`,
            avatarUrl: user?.getAvatarURL()
          };
        }

        let warnCount = 0;
        let unbanCount = 0;
        let unmuteCount = 0;
        const penalties: PenaltyEntry[] = [];
        const warnings: WarningEntry[] = [];
        const unbans: UnbanEntry[] = [];
        const unmutes: UnmuteEntry[] = [];
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

          const unmuteKeywords = ['entmute', 'unmute', 'entmuten', 'unmuten', 'entmuted', 'unmuted', 'entmutet', 'unmutet'];
          const isUnmute = unmuteKeywords.some(keyword =>
            content.toLowerCase().includes(keyword.toLowerCase())
          );

          if (isUnmute) {
            unmuteCount++;
            unmutes.push({
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
          warnCount, unbanCount, unmuteCount,
          watchlistCount: watchlistEntries.length,
          penalties, warnings, unbans, unmutes,
          watchlist: watchlistEntries, newestActiveDays,
          avatarUrl: user?.getAvatarURL(),
          username: user?.username || `Benutzer ${userId}`
        };
      } catch (error) {
        console.error("Strafakte Fehler:", error);
        return {
          warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0,
          penalties: [], warnings: [], unbans: [], unmutes: [], watchlist: [],
          newestActiveDays: 0, error: "Unbekannter Fehler. Siehe Konsole (F12)."
        };
      }
    }
    
    function changeView(view: ViewType) {
      activeView = view;
      renderStrafakteContent();
      adjustPopupPosition(popup);
    }

    function showEntryDetail(entry: PenaltyEntry | WarningEntry | UnbanEntry | UnmuteEntry | WatchlistEntry, sourceView: 'warnings' | 'unbans' | 'unmutes' | 'penalties' | 'watchlist') {
      detailEntry = entry;
      detailSourceView = sourceView;
      changeView('detail');
    }
    
    popup.addEventListener("mouseenter", () => {
        if (popupHideTimeout) clearTimeout(popupHideTimeout);
        if (avatarHoverHideTimeout) clearTimeout(avatarHoverHideTimeout);
    });

    popup.addEventListener("mouseleave", () => {
        popupHideTimeout = setTimeout(() => {
            if (!isPinned) {
                hidePopup(popup);
                activeView = 'summary';
                detailSourceView = null;
            }
        }, 250);
    });

    const handleAvatarHover = (el: HTMLElement) => {
      if (el.closest("#r6de-supporter-popup")) return;
      if (el.hasAttribute("data-r6de-processed")) return;

      el.setAttribute("data-r6de-processed", "true");

      let openTimer: ReturnType<typeof setTimeout> | null = null;
      let tempMouseMoveListener: ((event: MouseEvent) => void) | null = null;

      const handleMouseEnter = (e: MouseEvent) => {
        if (popupHideTimeout) clearTimeout(popupHideTimeout);
        if (avatarHoverHideTimeout) clearTimeout(avatarHoverHideTimeout);

        if (settings.store.restrictToServer) {
          const channelId = SelectedChannelStore.getChannelId();
          const guildId = channelId ? ChannelStore.getChannel(channelId)?.guild_id : null;
          if (guildId !== GUILD_ID) return;
        }

        if (openTimer) clearTimeout(openTimer);
        latestAvatarMouseEvent = e;

        tempMouseMoveListener = (event: MouseEvent) => latestAvatarMouseEvent = event;
        window.addEventListener("mousemove", tempMouseMoveListener, { passive: true });

        openTimer = setTimeout(async () => {
          if (isPinned && popup.style.display === 'block') return;
          
          popupOpening = true;
          setTimeout(() => popupOpening = false, 100);

          const targetUserId = getUserIdFromElement(el) || await getUserIdFromContextMenu(el);
          
          if (!targetUserId) {
            console.warn("R6DE Plugin: Could not extract User ID from element.", el);
            if (popup.querySelector('.strafakte-username')?.textContent === 'Fehler') return;
            
            currentStrafakteData = {
                warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0, penalties:[], warnings:[],unbans:[],unmutes:[],watchlist:[],newestActiveDays:0,
                username: "Fehler",
                avatarUrl: "",
                error: "Konnte Benutzer-ID nicht auslesen"
            };
            renderStrafakteContent();
            if (latestAvatarMouseEvent) positionPopup(popup, latestAvatarMouseEvent);
            showPopupWithAnimation(popup);
            return;
          }

          if (popup.style.display === 'block' && currentUserId === targetUserId) {
              return;
          }

          const user = UserStore.getUser(targetUserId);
          if (user?.bot) {
            if (popup.querySelector('.strafakte-username')?.textContent === 'Bot' && currentUserId === targetUserId) return;
            currentUserId = targetUserId;
            
            currentStrafakteData = {
                warnCount: 0, unbanCount: 0, unmuteCount: 0, watchlistCount: 0,
                penalties: [], warnings: [], unbans: [], unmutes: [], watchlist: [],
                newestActiveDays: 0, 
                username: user.username, 
                avatarUrl: user.getAvatarURL()
            };
            renderStrafakteContent();
            if (latestAvatarMouseEvent) positionPopup(popup, latestAvatarMouseEvent);
            showPopupWithAnimation(popup);
            return;
          }
          
          popup.innerHTML = `
            <div class="loading-indicator">
              <div class="loading-spinner"></div>
              <div class="loading-text">Lade Strafakte...</div>
            </div>
          `;

          if (latestAvatarMouseEvent) positionPopup(popup, latestAvatarMouseEvent);
          showPopupWithAnimation(popup);

          currentUserId = targetUserId;
          await fetchChangelog();
          await checkForUpdates();
          currentStrafakteData = await fetchStrafakte(targetUserId);

          if (popup.style.display !== 'block') {
              return;
          }
          
          renderStrafakteContent();

          requestAnimationFrame(() => {
              if (latestAvatarMouseEvent) {
                  positionPopup(popup, latestAvatarMouseEvent);
              }
          });


          if (tempMouseMoveListener) {
            window.removeEventListener("mousemove", tempMouseMoveListener);
            tempMouseMoveListener = null;
          }
        }, settings.store.avatarHoverDelay);
      };

      const handleMouseLeave = () => {
        if (popupOpening) return;
        
        if(openTimer) clearTimeout(openTimer);
        if (tempMouseMoveListener) {
          window.removeEventListener("mousemove", tempMouseMoveListener);
          tempMouseMoveListener = null;
        }

        avatarHoverHideTimeout = setTimeout(() => {
            if (!isPinned && !popup.matches(":hover")) {
                hidePopup(popup);
                activeView = 'summary';
                detailSourceView = null;
            }
        }, 250);
      };

      const handleMouseDown = () => {
        if (openTimer) clearTimeout(openTimer);
      };

      el.addEventListener("mouseenter", handleMouseEnter, { passive: true });
      el.addEventListener("mouseleave", handleMouseLeave, { passive: true });
      el.addEventListener("mousedown", handleMouseDown, { passive: true });
    };

    const handleInvitePreview = (link: HTMLAnchorElement) => {
      if (link.hasAttribute("data-r6de-invite-processed")) return;
      link.setAttribute("data-r6de-invite-processed", "true");

      const code = link.href.match(inviteRegex)?.[3];
      if (!code) return;

      link.title = "";
      link.removeAttribute("title");

      let inviteDataCache: any = null;
      let hoverTimeout: ReturnType<typeof setTimeout> | null = null;
      let latestMouseEvent: MouseEvent | null = null;

      const showInvitePopup = (e: MouseEvent) => {
        if (!inviteDataCache) {
          invitePopup.innerHTML = `
                <div class="loading-indicator">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Lade Einladung...</div>
                </div>`;
        } else {
          const g = inviteDataCache.guild || {};
          const c = inviteDataCache.channel || {};
          const inviter = inviteDataCache.inviter || {};
          const presences = inviteDataCache.approximate_presence_count || 0;
          const members = inviteDataCache.approximate_member_count || 0;

          const serverIcon = g.id && g.icon
            ? `<img src="https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png?size=128" class="strafakte-avatar" />`
            : `<div class="strafakte-avatar" style="background:linear-gradient(135deg,rgba(37,99,235,0.25) 0%,rgba(59,130,246,0.2) 100%);display:flex;align-items:center;justify-content:center;font-size:26px;color:#3b82f6">🌟</div>`;

          let expiresHtml = 'Niemals';
          if (inviteDataCache.expires_at) {
            expiresHtml = new Date(inviteDataCache.expires_at).toLocaleString('de-DE');
          }

          invitePopup.innerHTML = `
                <div class="strafakte-header">
                    ${serverIcon}
                    <div class="strafakte-user-info">
                        <div class="strafakte-username" title="${g.name || ''}">${g.name || "Privater Server"}</div>
                        <div class="strafakte-userid" title="${c.name || ''}">#${c.name || "Unbekannter Kanal"}</div>
                    </div>
                    <div class="strafakte-button-container">
                        <button id="r6de-invite-close" class="strafakte-button close" title="Schließen">×</button>
                    </div>
                </div>
                <div class="strafakte-tab-content">
                    <div class="strafakte-detail-view" style="margin-top: 0; padding-top: 0;">
                        ${g.description ? `
                        <div class="strafakte-detail-field">
                            <div class="strafakte-detail-label">Beschreibung</div>
                            <div class="strafakte-detail-value" style="white-space: pre-wrap; max-height: 80px; overflow-y: auto;">${g.description}</div>
                        </div>` : ''}
                        <div class="strafakte-detail-field">
                            <div class="strafakte-detail-label">Mitglieder</div>
                            <div class="strafakte-detail-value">
                                <span style="color: #34d399;">●</span> ${presences.toLocaleString()} Online
                                <span style="margin: 0 8px;">/</span>
                                <span style="color: #94a3b8;">●</span> ${members.toLocaleString()} Gesamt
                            </div>
                        </div>
                        ${inviter.id ? `
                        <div class="strafakte-detail-field">
                            <div class="strafakte-detail-label">Eingeladen von</div>
                            <div class="strafakte-detail-value">${inviter.username}#${inviter.discriminator}</div>
                        </div>` : ''}
                         <div class="strafakte-detail-field">
                            <div class="strafakte-detail-label">Läuft ab</div>
                            <div class="strafakte-detail-value">${expiresHtml}</div>
                        </div>
                    </div>
                </div>
            `;
        }

        document.getElementById("r6de-invite-close")?.addEventListener("click", () => hidePopup(invitePopup));
        
        positionPopup(invitePopup, e, 20, 20);
        showPopupWithAnimation(invitePopup);
      };

      const mouseMoveListener = (e: MouseEvent) => {
        latestMouseEvent = e;
      };

      link.addEventListener("mouseenter", (e) => {
        isMouseOverInviteLink = true;
        if (invitePopupHideTimeout) {
            clearTimeout(invitePopupHideTimeout);
            invitePopupHideTimeout = null;
        }

        latestMouseEvent = e;
        window.addEventListener("mousemove", mouseMoveListener, { passive: true });

        if (!inviteDataCache) {
          fetch(`https://discord.com/api/v9/invites/${code}?with_counts=true&with_expiration=true`)
            .then(res => res.json())
            .then(data => {
              inviteDataCache = data.message ? { error: data.message } : data;
              if (invitePopup.style.display === "block" && latestMouseEvent) {
                showInvitePopup(latestMouseEvent);
              }
            })
            .catch((err) => {
              console.error("Invite Fehler:", err);
              inviteDataCache = { error: "Laden fehlgeschlagen" };
            });
        }

        hoverTimeout = setTimeout(() => {
          if (latestMouseEvent) {
            showInvitePopup(latestMouseEvent);
          }
        }, settings.store.avatarHoverDelay);
      });

      link.addEventListener("mouseleave", () => {
        isMouseOverInviteLink = false;
        if (hoverTimeout) clearTimeout(hoverTimeout);
        window.removeEventListener("mousemove", mouseMoveListener);
        if (!isMouseOverInvitePopup) {
            invitePopupHideTimeout = setTimeout(() => hidePopup(invitePopup), 200);
        }
      });
    };

    const observer = new MutationObserver(mutations => {
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

        const processNode = (node: Node) => {
            if (!(node instanceof HTMLElement)) return;

            if (node.matches(avatarSelectors)) {
                handleAvatarHover(node);
            }
            node.querySelectorAll(avatarSelectors).forEach((avatar: Element) => {
                if (avatar instanceof HTMLElement) handleAvatarHover(avatar);
            });
            
            const linkSelector = "a[href*='discord.gg'], a[href*='discord.com/invite']";
            if (node.matches(linkSelector)) {
                handleInvitePreview(node as HTMLAnchorElement);
            }
            node.querySelectorAll<HTMLAnchorElement>(linkSelector).forEach(handleInvitePreview);
        };

        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(processNode);
            } else if (mutation.type === 'attributes') {
                processNode(mutation.target);
            }
        }
    });

    requestAnimationFrame(() => {
        document.querySelectorAll(`
            img[class*="avatar"], 
            .wrapper__44b0c, 
            .voiceUser_efcaf8 .userAvatar__55bab,
            .voiceUser_efcaf8 .avatar__07f91,
            .avatarContainer__6b330,
            div[class*="avatar"][style*="background-image"],
            [class*="userPopout"] img[class*="avatar"],
            [class*="userProfile"] img[class*="avatar"]
        `).forEach(avatar => {
            if (avatar instanceof HTMLElement) handleAvatarHover(avatar);
        });

        document.querySelectorAll<HTMLAnchorElement>(
            "a[href*='discord.gg'], a[href*='discord.com/invite']"
        ).forEach(handleInvitePreview);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['href', 'class', 'style']
    });

    self.observers.push(observer);

    let resizeTimeout: ReturnType<typeof setTimeout> | null = null;
    const handleResize = () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (popup.style.display === 'block') {
          adjustPopupPosition(popup);
        }
         if (invitePopup.style.display === 'block') {
          adjustPopupPosition(invitePopup);
        }
      }, 100);
    };

    window.addEventListener('resize', handleResize, { passive: true });
  },

  stop() {
    this.settingsListener?.();
    settings.store.notesStorage = JSON.stringify(this.localNotes);
    this.observers.forEach(obs => obs.disconnect());
    this.observers = [];

    const popup = document.getElementById("r6de-supporter-popup");
    if (popup) popup.remove();

    const invitePopup = document.getElementById("r6de-invite-popup");
    if (invitePopup) invitePopup.remove();

    document.querySelectorAll('[data-r6de-processed], [data-r6de-invite-processed]').forEach(el => {
      el.removeAttribute("data-r6de-processed");
      el.removeAttribute("data-r6de-invite-processed");
    });
    
    document.querySelectorAll('style[data-strafakte-plugin-style]').forEach(el => el.remove());
  }
});
