import type { Cell, HexString } from "@ckb-lumos/base";
import {
  TransactionSkeleton,
  type TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import type { QueryClient } from "@tanstack/react-query";
import {
  CKB,
  epochSinceAdd,
  epochSinceCompare,
  type ChainConfig,
  type I8Header,
  type I8Script,
} from "@ickb/lumos-utils";
import { parseEpoch, type EpochSinceValue } from "@ckb-lumos/base/lib/since";
import { ickbExchangeRatio, type OrderRatio } from "@ickb/v1-core";

export interface RootConfig extends ChainConfig {
  queryClient: QueryClient;
}

export interface WalletConfig extends RootConfig {
  address: HexString;
  accountLocks: I8Script[];
  expander: (c: Cell) => I8Script | undefined;
  getTxSizeOverhead: (tx: TransactionSkeletonType) => Promise<number>;
  sendSigned: (tx: TransactionSkeletonType) => Promise<`0x${string}`>;
}

export function symbol2Direction(s: string): boolean {
  return s === "C";
}

export function direction2Symbol(d: boolean): string {
  return d ? "C" : "I";
}

export function sanitize(text: string): string {
  // Filter leading zeros
  let i = 0;
  for (; i < text.length; i++) {
    const c = text[i];
    if (("1" <= c && c <= "9") || c === ".") {
      break;
    }
  }

  //Filter decimal part
  let dot = "";
  const decimalChars: string[] = [];
  for (; i < text.length; i++) {
    const c = text[i];
    if ("0" <= c && c <= "9") {
      decimalChars.push(c);
    } else if (c == ".") {
      dot = ".";
      break;
    }
  }

  //Filter fractional part
  const fractionalChars: string[] = [];
  for (; i < text.length && fractionalChars.length < 8; i++) {
    const c = text[i];
    if ("0" <= c && c <= "9") {
      fractionalChars.push(c);
    }
  }

  return (
    (decimalChars.length > 0
      ? BigInt(decimalChars.join("")).toLocaleString("en-US")
      : dot.length > 0
        ? "0"
        : "") +
    dot +
    fractionalChars.join("")
  );
}

export function toText(n: bigint): string {
  return (
    (n / CKB).toLocaleString("en-US") +
    String(Number(n % CKB) / Number(CKB)).slice(1)
  );
}

export function toBigInt(text: string): bigint {
  const [decimal, ...fractionals] = text.split(",").join("").split(".");
  return BigInt(decimal + (fractionals.join("") + "00000000").slice(0, 8));
}

// Estimate bot ability to fulfill orders:
// - CKB to iCKB orders at 100k CKB every minute
// - iCKB to CKB orders at 200 CKB every minute
export function orderMaturityEstimate(
  isCkb2Udt: boolean,
  amount: bigint,
  tipHeader: I8Header,
): Readonly<EpochSinceValue> {
  return Object.freeze(
    epochSinceAdd(parseEpoch(tipHeader.epoch), {
      number: 0,
      index: 1 + Number(amount / (isCkb2Udt ? 100000n * CKB : 200n * CKB)),
      length: 4 * 60,
    }),
  );
}

export function maxEpoch(ee: EpochSinceValue[]): EpochSinceValue {
  return ee.reduce((a, b) => (epochSinceCompare(a, b) === -1 ? b : a));
}

export const epochSinceValuePadding = Object.freeze({
  number: 0,
  index: 0,
  length: 1,
} as EpochSinceValue);

export type TxInfo = Readonly<{
  tx: TransactionSkeletonType;
  error: string;
  fee: bigint;
  estimatedMaturity: EpochSinceValue;
}>;

export const txInfoPadding: TxInfo = Object.freeze({
  tx: TransactionSkeleton(),
  error: "",
  fee: 0n,
  estimatedMaturity: epochSinceValuePadding,
});

// reservedCKB are reserved for state rent in conversions
export const reservedCKB = 600n * CKB;

// Calculate ratio in a way to pay 0.001% fee to bot
export function calculateOrderRatio(
  isCkb2Udt: boolean,
  tipHeader: I8Header,
): OrderRatio {
  const { ckbMultiplier, udtMultiplier } = ickbExchangeRatio(tipHeader);
  return {
    ckbMultiplier,
    udtMultiplier:
      // Pay 0.001% fee to bot
      udtMultiplier + (isCkb2Udt ? 1n : -1n) * (udtMultiplier / 100000n),
  };
}

export function calculateOrderResult(
  isCkb2Udt: boolean,
  amount: bigint,
  ratio: OrderRatio,
): bigint {
  const { ckbMultiplier, udtMultiplier } = ratio;
  return isCkb2Udt
    ? (amount * ckbMultiplier) / udtMultiplier
    : (amount * udtMultiplier) / ckbMultiplier;
}
