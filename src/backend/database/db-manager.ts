import { DB } from "./init.js";

export function closeDBConnection(): void {
  DB.close();
}