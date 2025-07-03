import { Program, Idl, Provider } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { IDL } from "./IDL/index.js";
import { EventModule } from "./modules/EventModule.js";
import { TokenModule } from "./modules/TokenModule.js";
import { TradeModule } from "./modules/TradeModule.js";
import { PdaModule } from "./modules/PdaModule.js";
import { JitoModule } from "./modules/JitoModule.js";
import { PumpOptions } from "./pumpFun.types.js";
import { AstraModule } from "./modules/AstraModule.js";
import { SlotModule } from "./modules/SlotModule.js";
import { NextBlockModule } from "./modules/NextBlockModule.js";
import { NodeOneModule } from "./modules/NodeOneModule.js";

export class PumpFunSDK {
  public program: Program<Idl>;
  public connection: Connection;
  public token: TokenModule;
  public trade: TradeModule;
  public pda: PdaModule;
  public jito?: JitoModule;
  public astra?: AstraModule;
  public slot?: SlotModule;
  public nextBlock?: NextBlockModule;
  public nodeOne?: NodeOneModule;
  public events: EventModule;

  constructor(provider: Provider, options?: PumpOptions) {
    this.program = new Program(IDL as Idl, provider);
    this.connection = this.program.provider.connection;

    // Initialize modules
    this.token = new TokenModule(this);
    this.trade = new TradeModule(this);
    this.events = new EventModule(this);
    this.pda = new PdaModule(this);
    if (options?.jitoUrl) {
      this.jito = new JitoModule(this, options.jitoUrl, options.authKeypair);
    }
    if (options?.astraKey) {
      if (!options.providerRegion) {
        throw new Error("Provider region is required for Astra module.");
      }
      this.astra = new AstraModule(
        this,
        options.providerRegion,
        options.astraKey
      );
    }
    if (options?.slotKey) {
      if (!options.providerRegion) {
        throw new Error("Provider region is required for 0Slot module.");
      }
      this.slot = new SlotModule(this, options.providerRegion, options.slotKey);
    }
    if (options?.nextBlockKey) {
      if (!options.providerRegion) {
        throw new Error("Provider region is required for NextBlock module.");
      }
      this.nextBlock = new NextBlockModule(
        this,
        options.providerRegion,
        options.nextBlockKey
      );
    }
    if (options?.nodeOneKey) {
      if (!options.providerRegion) {
        throw new Error("Provider region is required for NodeOne module.");
      }
      this.nodeOne = new NodeOneModule(
        this,
        options.providerRegion,
        options.nodeOneKey
      );
    }
  }
}
