import { converters } from "../pumpEvents/pumpEvents.consts.js";
import {
  PumpFunEventType,
  PumpFunEventHandlers,
} from "../pumpEvents/pumpEvents.types.js";
import { PumpFunSDK } from "../PumpFunSDK.js";

export class EventModule {
  constructor(private sdk: PumpFunSDK) {}

  addEventListener<T extends PumpFunEventType>(
    eventType: T,
    callback: (
      event: PumpFunEventHandlers[T],
      slot: number,
      signature: string
    ) => void
  ) {
    return this.sdk.program.addEventListener(
      eventType,
      (event: any, slot: number, signature: string) => {
        try {
          const convert = converters[eventType];
          if (!convert)
            throw new Error(`No converter for event type: ${eventType}`);
          callback(convert(event), slot, signature);
        } catch (err) {
          console.error(`Failed to handle ${eventType}:`, err);
        }
      }
    );
  }

  removeEventListener(id: number) {
    this.sdk.program.removeEventListener(id);
  }
}
