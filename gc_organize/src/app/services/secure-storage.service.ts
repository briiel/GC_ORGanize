// AES-GCM session-scoped encrypted localStorage and SHA-256 hashing via Web Crypto API

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecureStorageService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;

  // Session-specific key; regenerated each session, never persisted
  private encryptionKey: CryptoKey | null = null;

  constructor() {}

  // Generate a fresh AES-GCM key for this session
  async initializeKey(): Promise<void> {
    this.encryptionKey = await window.crypto.subtle.generateKey(
      { name: this.ALGORITHM, length: this.KEY_LENGTH }, true, ['encrypt', 'decrypt']
    );
  }

  // Encrypt value and store it under key in localStorage
  async setSecure(key: string, value: string): Promise<void> {
    if (!value) return;
    try {
      if (!this.encryptionKey) await this.initializeKey();
      localStorage.setItem(key, await this.encrypt(value));
    } catch (error) {
      console.error('Secure storage error:', error);
      localStorage.setItem(key, value); // Fallback to plaintext
    }
  }

  // Retrieve and decrypt a value from localStorage
  async getSecure(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;
      if (!this.encryptionKey) await this.initializeKey();
      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Secure retrieval error:', error);
      return localStorage.getItem(key); // Fallback to plaintext
    }
  }

  removeSecure(key: string): void { localStorage.removeItem(key); }
  clearSecure(): void { localStorage.clear(); }

  // Encrypt plaintext and return a base64 string of IV + ciphertext
  private async encrypt(plaintext: string): Promise<string> {
    if (!this.encryptionKey) throw new Error('Encryption key not initialized');
    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: this.ALGORITHM, iv }, this.encryptionKey, new TextEncoder().encode(plaintext)
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  }

  // Decode base64, split IV from ciphertext, and decrypt to plaintext
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) throw new Error('Encryption key not initialized');
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv   = combined.slice(0, this.IV_LENGTH);
    const data = combined.slice(this.IV_LENGTH);
    const decrypted = await window.crypto.subtle.decrypt({ name: this.ALGORITHM, iv }, this.encryptionKey, data);
    return new TextDecoder().decode(decrypted);
  }

  isWebCryptoAvailable(): boolean { return !!(window.crypto && window.crypto.subtle); }

  // Produce a hex SHA-256 digest of data (one-way, for integrity checks)
  async hashData(data: string): Promise<string> {
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Generate a cryptographically random hex token of the given byte length
  generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
}
