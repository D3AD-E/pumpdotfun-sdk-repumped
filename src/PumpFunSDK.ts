import { Program, Idl, Provider } from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { IDL } from "./IDL/index.js";
import { EventModule } from "./modules/EventModule.js";
import { TokenModule } from "./modules/TokenModule.js";
import { TradeModule } from "./modules/TradeModule.js";
import { PdaModule } from "./modules/PdaModule.js";

export class PumpFunSDK {
  public program: Program<Idl>;
  public connection: Connection;
  public token: TokenModule;
  public trade: TradeModule;
  public pda: PdaModule;
  public events: EventModule;

  constructor(provider?: Provider) {
    this.program = new Program(IDL as Idl, provider);
    this.connection = this.program.provider.connection;

    // Initialize modules
    this.token = new TokenModule(this);
    this.trade = new TradeModule(this);
    this.events = new EventModule(this);
    this.pda = new PdaModule(this);
  }
}
