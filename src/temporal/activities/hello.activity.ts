export async function sayHello(name: string): Promise<string> {
  const message = `Hello World from Temporal! Name: ${name}`;
  console.log(`[Activity] Executing sayHello activity: ${message}`);
  return Promise.resolve(message);
}
