/**
 * Secure Storage Service
 * Provides encrypted storage for sensitive data in browser
 * Uses Web Crypto API for client-side encryption
 */

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SecureStorageService {
  private readonly ALGORITHM = 'AES-GCM';
  private readonly KEY_LENGTH = 256;
  private readonly IV_LENGTH = 12;
  
  // Encryption key is derived from session-specific data
  // This is NOT stored permanently - regenerated each session
  private encryptionKey: CryptoKey | null = null;

  constructor() {}

  /**
   * Initialize encryption key for this session
   * Called on app bootstrap
   */
  async initializeKey(): Promise<void> {
    // Generate a session-specific key
    // In production, this could be derived from user credentials + server-side seed
    this.encryptionKey = await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt and store data
   */
  async setSecure(key: string, value: string): Promise<void> {
    if (!value) return;
    
    try {
      if (!this.encryptionKey) {
        await this.initializeKey();
      }

      const encrypted = await this.encrypt(value);
      localStorage.setItem(key, encrypted);
    } catch (error) {
      console.error('Secure storage error:', error);
      // Fallback to regular storage if encryption fails
      localStorage.setItem(key, value);
    }
  }

  /**
   * Retrieve and decrypt data
   */
  async getSecure(key: string): Promise<string | null> {
    try {
      const encrypted = localStorage.getItem(key);
      if (!encrypted) return null;

      if (!this.encryptionKey) {
        await this.initializeKey();
      }

      return await this.decrypt(encrypted);
    } catch (error) {
      console.error('Secure retrieval error:', error);
      // Fallback to regular retrieval
      return localStorage.getItem(key);
    }
  }

  /**
   * Remove item from secure storage
   */
  removeSecure(key: string): void {
    localStorage.removeItem(key);
  }

  /**
   * Clear all secure storage
   */
  clearSecure(): void {
    localStorage.clear();
  }

  /**
   * Encrypt data using Web Crypto API
   */
  private async encrypt(plaintext: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encrypted = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      this.encryptionKey,
      data
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encrypted), iv.length);

    // Convert to base64
    return btoa(String.fromCharCode(...combined));
  }

  /**
   * Decrypt data using Web Crypto API
   */
  private async decrypt(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract IV and encrypted data
    const iv = combined.slice(0, this.IV_LENGTH);
    const data = combined.slice(this.IV_LENGTH);

    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv: iv,
      },
      this.encryptionKey,
      data
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }

  /**
   * Check if Web Crypto API is available
   */
  isWebCryptoAvailable(): boolean {
    return !!(window.crypto && window.crypto.subtle);
  }

  /**
   * Hash data (one-way, for comparison)
   */
  async hashData(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  /**
   * Generate random token
   */
  generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
  }
}
