// Web and the Mac app don't vibrate (docs/01 8.46); the phone build uses haptics.native.ts.
export type Buzz = "tap" | "select" | "success";
export function buzz(_kind: Buzz = "tap") {}
