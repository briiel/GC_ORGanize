// Browser-native AES-256-GCM encryption/decryption via Web Crypto API
// Wire format: "<iv_b64>:<authTag_b64>:<ciphertext_b64>" — mirrors backend transportEncryption.js
// Pre-shared key sourced from environment.payloadEncryptionKey (64 hex chars = 32 bytes)

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayloadEncryptionService {
  private readonly algorithm = 'AES-GCM';
  private readonly ivLength  = 12;  // 96-bit IV
  private readonly tagLength = 128; // 128-bit auth tag (bits)

  // Cached CryptoKey — imported once and reused across all calls
  private keyPromise: Promise<CryptoKey> | null = null;

  // Import the hex key from environment into a non-extractable CryptoKey
  private importKey(): Promise<CryptoKey> {
    if (this.keyPromise) return this.keyPromise;
    const hex = environment.payloadEncryptionKey;
    if (!hex || hex.length !== 64) {
      return Promise.reject(new Error('[PayloadEncryption] payloadEncryptionKey must be 64 hex chars.'));
    }
    const keyBytes = new Uint8Array(hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
    this.keyPromise = crypto.subtle.importKey(
      'raw', keyBytes, { name: this.algorithm }, false, ['encrypt', 'decrypt']
    );
    return this.keyPromise;
  }

  // Convert Uint8Array to base64 string
  private toBase64(arr: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < arr.byteLength; i++) binary += String.fromCharCode(arr[i]);
    return btoa(binary);
  }

  // Convert base64 string to Uint8Array
  private fromBase64(b64: string): Uint8Array {
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
  }

  // Encrypt a JS object and return it as "<iv_b64>:<authTag_b64>:<ciphertext_b64>"
  async encrypt(data: any): Promise<string> {
    const key       = await this.importKey();
    const iv        = crypto.getRandomValues(new Uint8Array(this.ivLength));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));

    // SubtleCrypto AES-GCM appends the 16-byte auth tag at the end of the output buffer
    const ciphertextWithTag = await crypto.subtle.encrypt(
      { name: this.algorithm, iv, tagLength: this.tagLength }, key, plaintext
    );

    const ciphertextBytes = new Uint8Array(ciphertextWithTag, 0, ciphertextWithTag.byteLength - 16);
    const authTagBytes    = new Uint8Array(ciphertextWithTag, ciphertextWithTag.byteLength - 16);

    return `${this.toBase64(iv)}:${this.toBase64(authTagBytes)}:${this.toBase64(ciphertextBytes)}`;
  }

  // Decrypt a "<iv_b64>:<authTag_b64>:<ciphertext_b64>" wire string back to a JS value
  async decrypt(encryptedStr: string): Promise<any> {
    const key   = await this.importKey();
    const parts = encryptedStr.split(':');
    if (parts.length !== 3) throw new Error('[PayloadEncryption] Invalid encrypted payload format.');

    const iv         = this.fromBase64(parts[0]);
    const authTag    = this.fromBase64(parts[1]);
    const ciphertext = this.fromBase64(parts[2]);

    // SubtleCrypto expects ciphertext + auth tag as a single contiguous buffer
    const combined = new Uint8Array(ciphertext.length + authTag.length);
    combined.set(ciphertext, 0);
    combined.set(authTag, ciphertext.length);

    const plaintextBuf = await crypto.subtle.decrypt(
      { name: this.algorithm, iv: iv as any, tagLength: this.tagLength }, key, combined as any
    );
    return JSON.parse(new TextDecoder().decode(plaintextBuf));
  }
}
