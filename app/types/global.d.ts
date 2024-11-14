import "@remix-run/server-runtime";
import { Context } from "~/context";

declare module "@remix-run/server-runtime" {
  export interface AppLoadContext extends Context { }
}
