import { Program, Idl, Provider } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { IDL } from "./IDL/index.js";
import { EventModule } from "./modules/EventModule.js";
import { TokenModule } from "./modules/TokenModule.js";
import { TradeModule } from "./modules/TradeModule.js";
import { PdaModule } from "./modules/PdaModule.js";
import { JitoModule } from "./modules/JitoModule.js";
import { PumpOptions } from "./pumpFun.types.js";

export class PumpFunSDK {
  public program: Program<Idl>;
  public connection: Connection;
  public token: TokenModule;
  public trade: TradeModule;
  public pda: PdaModule;
  public jito?: JitoModule;
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
  }
}
