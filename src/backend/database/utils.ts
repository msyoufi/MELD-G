import { DB } from "./index.js";

export function dynamicInsert<T>(table: string, data: Record<string, any>): T {
  const keys = Object.keys(data);
  const columns = keys.join(', ');
  const params = keys.map(k => '@' + k).join(', ');

  const results = DB.prepare(`
    INSERT INTO '${table}' (${columns}) VALUES (${params}) RETURNING *
  `).get(data) as T;

  return results;
}

export function dynamicUpdate<T>(table: string, data: Record<string, any>, condition: { [key: string]: number | bigint | string }
): T {
  const keys = Object.keys(data);
  const params = keys.map(k => k + ' = @' + k).join(', ');
  const column = Object.keys(condition)[0];
  const value = condition[column];

  const results = DB.prepare(`
    UPDATE '${table}' SET ${params} WHERE ${column} = ${value} RETURNING *
  `).get(data) as T;

  return results;
}

export function dynamicDelete(table: string, condition: Record<string, any>): number {
  const column = Object.keys(condition)[0];
  const value = condition[column];

  const results = DB.prepare(`
    DELETE FROM '${table}' WHERE ${column} = ${value}
  `).run();

  return results.changes;
}