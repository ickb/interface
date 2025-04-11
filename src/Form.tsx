import {
  direction2Symbol,
  previewConversion,
  reservedCKB,
  symbol2Direction,
  toText,
} from "./utils.ts";
import { CKB, max, min } from "@ickb/lumos-utils";
import type { OrderRatio } from "@ickb/v1-core";
import type { JSX } from "react";

export default function Form({
  rawText,
  setRawText,
  amount,
  calculateRatio,
  isFrozen,
  ckbNative,
  ickbNative,
  ckbAvailable,
  ickbAvailable,
  ckbBalance,
  ickbBalance,
}: {
  rawText: string;
  setRawText: (s: string) => void;
  amount: bigint;
  calculateRatio: (isCkb2Udt: boolean, amount: bigint) => OrderRatio;
  isFrozen: boolean;
  ckbNative: bigint;
  ickbNative: bigint;
  ckbBalance: bigint;
  ickbBalance: bigint;
  ckbAvailable: bigint;
  ickbAvailable: bigint;
}): JSX.Element {
  const symbol = rawText[0];
  const text = rawText.slice(1);
  const isCkb2Udt = symbol2Direction(symbol);
  const toggle = (): void => {
    setRawText(direction2Symbol(!isCkb2Udt) + text);
  };

  const nnn = min(max(ckbAvailable - reservedCKB, 0n), ckbNative);
  let a = {
    name: "CKB",
    native: nnn,
    locked: ckbBalance - nnn,
    status:
      ckbBalance === ckbNative
        ? "✅"
        : ckbBalance === ckbAvailable
          ? "⌛️"
          : "⏳",
  };
  let b = {
    name: "ICKB",
    native: ickbNative,
    locked: ickbBalance - ickbNative,
    status:
      ickbBalance === ickbNative
        ? "✅"
        : ickbBalance === ickbAvailable
          ? "⌛️"
          : "⏳",
  };
  if (!isCkb2Udt) {
    [a, b] = [b, a];
  }

  return (
    <>
      <span className="grid grid-cols-3 items-center justify-items-center gap-y-4 leading-relaxed font-bold tracking-wider uppercase">
        <span className="text-amber-400">{display(a.native, "✅")}</span>
        <span className="text-2xl text-amber-400">{a.name}</span>
        <span className="cursor-wait text-amber-400">
          {display(a.locked, a.status)}
        </span>
        <input
          placeholder="0"
          disabled={isFrozen}
          autoFocus={true}
          value={text}
          onChange={(e) => {
            setRawText(symbol + e.target.value);
          }}
          autoComplete="off"
          inputMode="decimal"
          type="text"
          className="col-span-3 w-full rounded border-0 bg-transparent text-center text-3xl text-amber-400 outline-none disabled:cursor-default"
          aria-label="Amount to be converted"
        />
        <span className="">{"1 " + a.name}</span>
        <button
          className="rotate-90 cursor-pointer border-0 bg-transparent text-5xl text-slate-300 disabled:cursor-default"
          disabled={isFrozen}
          onClick={toggle}
        >
          ⇌
        </button>
        <span className="text-center">
          {textConversionPreview(isCkb2Udt, CKB, calculateRatio)} {b.name}
        </span>
        <span className="col-span-3 text-center text-3xl text-amber-400">
          ⏳{textConversionPreview(isCkb2Udt, amount, calculateRatio)}
        </span>
        <span className="text-amber-400">{display(b.native, "✅")}</span>
        <span className="text-2xl text-amber-400">{b.name}</span>
        <span className="cursor-wait text-amber-400">
          {display(b.locked, b.status)}
        </span>
      </span>
    </>
  );
}

function display(shannons: bigint, prefix: string): JSX.Element {
  const isMaturing = prefix === "⏳";
  return (
    <span className={"flex flex-row " + (isMaturing ? "cursor-wait" : "")}>
      <span className={isMaturing ? "animate-pulse" : ""}>{prefix}</span>
      <span className="sm:hidden">
        {String(shannons / CKB)}
        {shannons % CKB === 0n ? "" : "+"}
      </span>
      <span className="hidden sm:block">{toText(shannons)}</span>
    </span>
  );
}

function textConversionPreview(
  isCkb2Udt: boolean,
  amount: bigint,
  calculateRatio: (isCkb2Udt: boolean, amount: bigint) => OrderRatio,
): string {
  return toText(
    previewConversion(isCkb2Udt, amount, calculateRatio(isCkb2Udt, amount)),
  );
}
