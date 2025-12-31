import React from "react";
import type { GameSettings, GameState, TerritoryId } from "@risk/shared";

import { TurnPanel } from "./TurnPanel";
import { AttackPanel } from "./AttackPanel";
import { ConquestPanel } from "./ConquestPanel";
import { FortifyPanel } from "./FortifyPanel";
import { PlayersPanel } from "./PlayersPanel";
import { HostSetupOverlay } from "../overlays/HostSetupOverlay";

type Props = {
  game: GameState | null | undefined;
  playerId: string | null;

  gameId: string;
  setGameId: (v: string) => void;
  name: string;
  setName: (v: string) => void;

  lastError: string | null | undefined;
  canStart: boolean;
  send: (msg: any) => void;

  isMyTurn: boolean;

  attackFrom: TerritoryId | null;
  attackTo: TerritoryId | null;
  attackerDice: 1 | 2 | 3;
  setAttackerDice: (v: 1 | 2 | 3) => void;
  autoRoll: boolean;
  setAutoRoll: (v: boolean) => void;
  onRollAttack: () => void;
  onClearAttack: () => void;

  conquestMoveAmount: number;
  setConquestMoveAmount: (v: number) => void;
  onConfirmConquest: () => void;

  fortifyFrom: TerritoryId | null;
  fortifyTo: TerritoryId | null;
  fortifyAmount: number;
  setFortifyAmount: (v: number) => void;
  onConfirmFortify: () => void;
  onClearFortify: () => void;

  canConfigure: boolean;
  setupOpen: boolean;
  setSetupOpen: (v: boolean) => void;
  setup: GameSettings;
  setSetup: React.Dispatch<React.SetStateAction<GameSettings>>;
  onApplySetup: () => void;

  panelStyle: React.CSSProperties;
  panelTitleStyle: React.CSSProperties;
  labelStyle: React.CSSProperties;
  inputStyle: React.CSSProperties;
  buttonStyle: React.CSSProperties;
  selectStyle: React.CSSProperties;
};

export function Hud(props: Props) {
  const { game, playerId } = props;

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 12,
        right: 12,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        justifyContent: "space-between",
        pointerEvents: "none"
      }}
    >
      {/* Left stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, pointerEvents: "auto" }}>
        {(!game || game.status === "lobby") && (
          <div style={props.panelStyle}>
            <div style={props.panelTitleStyle}>Lobby</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
              <label style={props.labelStyle}>
                Game ID
                <input value={props.gameId} onChange={(e) => props.setGameId(e.target.value)} style={props.inputStyle} />
              </label>
              <label style={props.labelStyle}>
                Name
                <input value={props.name} onChange={(e) => props.setName(e.target.value)} style={props.inputStyle} />
              </label>
              <button style={props.buttonStyle} onClick={() => props.send({ type: "game/join", gameId: props.gameId, name: props.name })} disabled={!playerId}>
                Join / Host
              </button>
              <button style={props.buttonStyle} onClick={() => props.send({ type: "game/leave", gameId: props.gameId })} disabled={!game}>
                Leave
              </button>
              <button style={props.buttonStyle} onClick={() => props.send({ type: "lobby/start", gameId: props.gameId })} disabled={!props.canStart}>
                Start
              </button>
            </div>

            {props.lastError && <div style={{ marginTop: 8, opacity: 0.9 }}>Error: {props.lastError}</div>}
          </div>
        )}

        <TurnPanel
          game={game}
          isMyTurn={props.isMyTurn}
          onEndPhase={() => props.send({ type: "turn/endPhase", gameId: props.gameId })}
          panelStyle={props.panelStyle}
          panelTitleStyle={props.panelTitleStyle}
          buttonStyle={props.buttonStyle}
        />
      </div>

      {/* Right stack */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, pointerEvents: "auto" }}>
        <AttackPanel
          game={game}
          isMyTurn={props.isMyTurn}
          attackFrom={props.attackFrom}
          attackTo={props.attackTo}
          attackerDice={props.attackerDice}
          setAttackerDice={props.setAttackerDice}
          autoRoll={props.autoRoll}
          setAutoRoll={props.setAutoRoll}
          onRoll={props.onRollAttack}
          onClear={props.onClearAttack}
          panelStyle={props.panelStyle}
          panelTitleStyle={props.panelTitleStyle}
          labelStyle={props.labelStyle}
          buttonStyle={props.buttonStyle}
          selectStyle={props.selectStyle}
        />

        <ConquestPanel
          game={game}
          isMyTurn={props.isMyTurn}
          conquestMoveAmount={props.conquestMoveAmount}
          setConquestMoveAmount={props.setConquestMoveAmount}
          onConfirm={props.onConfirmConquest}
          panelStyle={props.panelStyle}
          panelTitleStyle={props.panelTitleStyle}
          buttonStyle={props.buttonStyle}
        />

        <FortifyPanel
          game={game}
          isMyTurn={props.isMyTurn}
          fortifyFrom={props.fortifyFrom}
          fortifyTo={props.fortifyTo}
          fortifyAmount={props.fortifyAmount}
          setFortifyAmount={props.setFortifyAmount}
          onConfirm={props.onConfirmFortify}
          onClear={props.onClearFortify}
          panelStyle={props.panelStyle}
          panelTitleStyle={props.panelTitleStyle}
          buttonStyle={props.buttonStyle}
        />

        <PlayersPanel game={game} playerId={playerId} panelStyle={props.panelStyle} panelTitleStyle={props.panelTitleStyle} />

        {game?.status === "running" && !props.isMyTurn && (
          <div style={props.panelStyle}>
            <div style={props.panelTitleStyle}>Waiting</div>
            <div style={{ opacity: 0.9 }}>Another player is taking their turn…</div>
          </div>
        )}

        {props.canConfigure && (
          <HostSetupOverlay
            open={props.setupOpen}
            setup={props.setup}
            setSetup={props.setSetup}
            onClose={() => props.setSetupOpen(false)}
            onApply={props.onApplySetup}
          />
        )}

        {props.canConfigure && !props.setupOpen && (
          <button
            type="button"
            onClick={() => props.setSetupOpen(true)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 41,
              padding: "9px 12px",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.15)",
              background: "rgba(255,255,255,0.92)",
              boxShadow: "0 10px 28px rgba(0,0,0,0.18)",
              cursor: "pointer",
              pointerEvents: "auto",
              fontWeight: 800
            }}
          >
            Game Setup
          </button>
        )}
      </div>
    </div>
  );
}
