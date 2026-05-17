import { exec } from './exec.js';

export async function getUsername(): Promise<string> {
  return exec('gh api user -q .login');
}

export async function getToken(): Promise<string> {
  return exec('gh auth token');
}
