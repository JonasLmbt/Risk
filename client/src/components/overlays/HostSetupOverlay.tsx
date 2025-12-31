import React, { useEffect } from "react";
import type { GameSettings, MapId, Objective, TerritorySelection, TroopPlacement, Visibility } from "@risk/shared";
import { currentMapLayout } from "@risk/shared";
import { clampInt } from "../../utils/game";

type Props = {
  open: boolean;
  setup: GameSettings;
  setSetup: React.Dispatch<React.SetStateAction<GameSettings>>;
  onApply: () => void;
  onClose: () => void;
};

export function HostSetupOverlay({ open, setup, setSetup, onApply, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 40,
        pointerEvents: "auto"
      }}
    >
      <HostSetupPanel setup={setup} setSetup={setSetup} onApply={onApply} onClose={onClose} />
    </div>
  );
}

function HostSetupPanel({
  setup,
  setSetup,
  onApply,
  onClose
}: {
  setup: GameSettings;
  setSetup: React.Dispatch<React.SetStateAction<GameSettings>>;
  onApply: () => void;
  onClose: () => void;
}) {
  const territoryCount = currentMapLayout.territories.length;

  const maxBlizzard = Math.max(0, Math.min(territoryCount, 20));
  const blizzardValue = clampInt(setup.blizzardBlockedTerritories, 0, maxBlizzard);

  useEffect(() => {
    if (setup.blizzardBlockedTerritories !== blizzardValue) {
      setSetup((s) => ({ ...s, blizzardBlockedTerritories: blizzardValue }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blizzardValue]);

  const showTroopDraftHint = setup.territorySelection === "draft" || setup.troopPlacement === "draft_place";

  return (
    <div
      style={{
        width: "min(520px, calc(100vw - 40px))",
        background: "rgba(255,255,255,0.94)",
        border: "1px solid rgba(0,0,0,0.12)",
        borderRadius: 16,
        boxShadow: "0 18px 60px rgba(0,0,0,0.28)",
        backdropFilter: "blur(10px)",
        padding: 16
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: 16 }}>Game Settings</div>
          <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Configure the lobby before starting.</div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" onClick={onClose} style={setupBtnStyle}>
            Close
          </button>
          <button type="button" onClick={onApply} style={setupBtnStyle}>
            Apply
          </button>
        </div>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 12 }}>
        <div style={setupSectionStyle}>
          <div style={setupSectionTitleStyle}>Basics</div>

          <div style={setupRowStyle}>
            <label style={setupLabelStyle}>
              Max players
              <select
                value={setup.maxPlayers}
                onChange={(e) => setSetup((s) => ({ ...s, maxPlayers: Number(e.target.value) as GameSettings["maxPlayers"] }))}
                style={setupSelectStyle}
              >
                {[2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <label style={setupLabelStyle}>
              Lobby
              <select
                value={setup.visibility}
                onChange={(e) => setSetup((s) => ({ ...s, visibility: e.target.value as Visibility }))}
                style={setupSelectStyle}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </label>
          </div>

          <div style={setupRowStyle}>
            <label style={setupLabelStyle}>
              Map
              <select value={setup.map} onChange={(e) => setSetup((s) => ({ ...s, map: e.target.value as MapId }))} style={setupSelectStyle}>
                <option value="world42">World42 (default)</option>
              </select>
            </label>

            <label style={setupLabelStyle}>
              Turn duration
              <select
                value={setup.turnDurationSec}
                onChange={(e) => setSetup((s) => ({ ...s, turnDurationSec: Number(e.target.value) as GameSettings["turnDurationSec"] }))}
                style={setupSelectStyle}
              >
                <option value={30}>30s</option>
                <option value={45}>45s</option>
                <option value={60}>60s</option>
                <option value={90}>90s</option>
                <option value={120}>120s</option>
                <option value={180}>180s</option>
              </select>
            </label>
          </div>
        </div>

        <div style={setupSectionStyle}>
          <div style={setupSectionTitleStyle}>Rules</div>

          <label style={setupSwitchRowStyle}>
            <input type="checkbox" checked={setup.fogOfWarEnabled} onChange={(e) => setSetup((s) => ({ ...s, fogOfWarEnabled: e.target.checked }))} />
            <div>
              <div style={{ fontWeight: 800 }}>Fog of War</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>You can only see territories adjacent to your own.</div>
            </div>
          </label>

          <label style={setupSwitchRowStyle}>
            <input type="checkbox" checked={setup.blizzardEnabled} onChange={(e) => setSetup((s) => ({ ...s, blizzardEnabled: e.target.checked }))} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800 }}>Blizzard</div>
              <div style={{ fontSize: 12, opacity: 0.75 }}>Random territories are blocked each round.</div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
                <input
                  type="range"
                  min={0}
                  max={maxBlizzard}
                  value={setup.blizzardEnabled ? setup.blizzardBlockedTerritories : 0}
                  disabled={!setup.blizzardEnabled}
                  onChange={(e) =>
                    setSetup((s) => ({
                      ...s,
                      blizzardBlockedTerritories: clampInt(Number(e.target.value), 0, maxBlizzard)
                    }))
                  }
                  style={{ flex: 1 }}
                />
                <div style={{ minWidth: 54, textAlign: "right", fontWeight: 900 }}>
                  {setup.blizzardEnabled ? setup.blizzardBlockedTerritories : 0}
                </div>
              </div>
            </div>
          </label>

          <div style={setupRowStyle}>
            <label style={setupLabelStyle}>
              Objective
              <select value={setup.objective} onChange={(e) => setSetup((s) => ({ ...s, objective: e.target.value as Objective }))} style={setupSelectStyle}>
                <option value="world_domination">World Domination</option>
                <option value="secret_missions">Secret Missions</option>
              </select>
            </label>
          </div>
        </div>

        <div style={setupSectionStyle}>
          <div style={setupSectionTitleStyle}>Setup Phase</div>

          <div style={setupRowStyle}>
            <label style={setupLabelStyle}>
              Territory selection
              <select
                value={setup.territorySelection}
                onChange={(e) => setSetup((s) => ({ ...s, territorySelection: e.target.value as TerritorySelection }))}
                style={setupSelectStyle}
              >
                <option value="draft">Draft (take turns claiming territories)</option>
                <option value="random">Random (territories assigned randomly)</option>
              </select>
            </label>
          </div>

          <div style={setupRowStyle}>
            <label style={setupLabelStyle}>
              Troop placement
              <select
                value={setup.troopPlacement}
                onChange={(e) => setSetup((s) => ({ ...s, troopPlacement: e.target.value as TroopPlacement }))}
                style={setupSelectStyle}
              >
                <option value="draft_place">Draft placement (take turns placing 1 troop)</option>
                <option value="auto">Auto placement</option>
              </select>
            </label>
          </div>

          <div style={setupRowStyle}>
            <label style={setupLabelStyle}>
              Initial troops
              <select
                value={setup.initialTroopsMode}
                onChange={(e) => setSetup((s) => ({ ...s, initialTroopsMode: e.target.value as "standard" | "custom" }))}
                style={setupSelectStyle}
              >
                <option value="standard">Standard</option>
                <option value="custom">Custom</option>
              </select>
            </label>

            <label style={setupLabelStyle}>
              Custom troops
              <input
                type="number"
                value={setup.initialTroopsCustom}
                disabled={setup.initialTroopsMode !== "custom"}
                onChange={(e) => setSetup((s) => ({ ...s, initialTroopsCustom: clampInt(Number(e.target.value), 5, 200) }))}
                style={setupInputStyle}
              />
            </label>
          </div>

          {showTroopDraftHint && (
            <div style={{ marginTop: 6, fontSize: 12, opacity: 0.78 }}>
              Draft flow: players take turns claiming territories, then take turns placing 1 troop until all troops are placed.
              <br />
              Suggested thinking time for placement: ~10 seconds.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const setupBtnStyle: React.CSSProperties = {
  padding: "9px 12px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  cursor: "pointer"
};

const setupSectionStyle: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.10)",
  borderRadius: 14,
  padding: 12,
  background: "rgba(255,255,255,0.6)"
};

const setupSectionTitleStyle: React.CSSProperties = {
  fontWeight: 900,
  marginBottom: 10
};

const setupRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  flexWrap: "wrap",
  alignItems: "flex-end"
};

const setupLabelStyle: React.CSSProperties = {
  display: "grid",
  gap: 6,
  fontSize: 12,
  opacity: 0.95,
  minWidth: 200,
  flex: "1 1 200px"
};

const setupSelectStyle: React.CSSProperties = {
  padding: "9px 10px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  outline: "none"
};

const setupInputStyle: React.CSSProperties = {
  padding: "9px 10px",
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.15)",
  background: "white",
  outline: "none"
};

const setupSwitchRowStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  alignItems: "flex-start",
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(0,0,0,0.10)",
  background: "rgba(255,255,255,0.7)"
};
