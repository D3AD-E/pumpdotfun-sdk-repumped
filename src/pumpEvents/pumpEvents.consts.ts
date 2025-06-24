import {
  toCreateEvent,
  toTradeEvent,
  toCompleteEvent,
  toSetParamsEvent,
  toCollectCreatorFeeEvent,
  toCompletePumpAmmMigrationEvent,
  toExtendAccountEvent,
  toSetCreatorEvent,
  toSetMetaplexCreatorEvent,
  toUpdateGlobalAuthorityEvent,
} from "./pumpEvents.js";
import { EventConverterMap } from "./pumpEvents.types.js";

export const converters: EventConverterMap = {
  createEvent: toCreateEvent,
  tradeEvent: toTradeEvent,
  completeEvent: toCompleteEvent,
  setParamsEvent: toSetParamsEvent,
  collectCreatorFeeEvent: toCollectCreatorFeeEvent,
  completePumpAmmMigrationEvent: toCompletePumpAmmMigrationEvent,
  extendAccountEvent: toExtendAccountEvent,
  setCreatorEvent: toSetCreatorEvent,
  setMetaplexCreatorEvent: toSetMetaplexCreatorEvent,
  updateGlobalAuthorityEvent: toUpdateGlobalAuthorityEvent,
};
