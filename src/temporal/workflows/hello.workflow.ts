import { proxyActivities } from '@temporalio/workflow';
import type * as activities from '../activities';

const { sayHello } = proxyActivities<typeof activities>({
  startToCloseTimeout: '30s',
});

export async function helloWorkflow(name: string): Promise<string> {
  const message = await sayHello(name);
  return message;
}
