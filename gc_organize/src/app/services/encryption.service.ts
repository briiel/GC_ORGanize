// Browser-native Hybrid Encryption via Web Crypto API
//
// 1. Frontend generates a single-use AES-256-GCM Session Key.
// 2. Frontend encrypts the Session Key with the Backend's RSA-2048 Public Key.
// 3. Frontend encrypts the payload with the Session Key.

import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PayloadEncryptionService {
  private readonly aesAlgorithm = 'AES-GCM';
  private readonly rsaAlgorithm = { name: 'RSA-OAEP', hash: 'SHA-256' };
  private readonly ivLength  = 12;  // 96-bit IV
  private readonly tagLength = 128; // 128-bit auth tag (bits)

  // Cached RSA Public Key — imported once and reused across all calls
  private rsaPublicKeyPromise: Promise<CryptoKey> | null = null;

  // Converts a PEM block to a binary ArrayBuffer
  private pemToArrayBuffer(pem: string): ArrayBuffer {
    const b64 = pem.replace(/(-----(BEGIN|END) PUBLIC KEY-----|\n|\r)/g, '');
    const binaryStr = window.atob(b64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // Import the RSA Public Key from environment.ts
  private importRsaPublicKey(): Promise<CryptoKey> {
    if (this.rsaPublicKeyPromise) return this.rsaPublicKeyPromise;
    const pem = environment.backendPublicKey;
    if (!pem || !pem.includes('BEGIN PUBLIC KEY')) {
      return Promise.reject(new Error('[PayloadEncryption] environment.backendPublicKey is invalid or missing.'));
    }
    
    const keyBuffer = this.pemToArrayBuffer(pem);
    this.rsaPublicKeyPromise = crypto.subtle.importKey(
      'spki',
      keyBuffer,
      this.rsaAlgorithm,
      false,
      ['encrypt']
    );
    return this.rsaPublicKeyPromise;
  }

  // Convert Uint8Array to base64 string
  private toBase64(arr: Uint8Array | ArrayBuffer): string {
    const bytes = new Uint8Array(arr);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  // Convert base64 string to Uint8Array
  private fromBase64(b64: string): Uint8Array {
    return new Uint8Array(atob(b64).split('').map(c => c.charCodeAt(0)));
  }

  /**
   * Generates a new random AES-256-GCM Session Key.
   * Returns:
   *  aesKey: The raw CryptoKey (used for payload encryption/decryption)
   *  encryptedSessionKeyB64: The session key encrypted with backend's RSA public key (sent in X-Session-Key header)
   */
  async generateSessionKey(): Promise<{ aesKey: CryptoKey, encryptedSessionKeyB64: string }> {
    // 1. Generate random AES-256 key
    const aesKey = await crypto.subtle.generateKey(
      { name: this.aesAlgorithm, length: 256 },
      true, // MUST be extractable so we can encrypt it and send to backend
      ['encrypt', 'decrypt']
    );

    // 2. Export raw bytes (32 bytes)
    const exportedRawKey = await crypto.subtle.exportKey('raw', aesKey);

    // 3. Encrypt the raw bytes using backend's RSA public key
    const rsaPublicKey = await this.importRsaPublicKey();
    const encryptedKeyBuffer = await crypto.subtle.encrypt(
      this.rsaAlgorithm,
      rsaPublicKey,
      exportedRawKey
    );

    // 4. Return both
    return {
      aesKey,
      encryptedSessionKeyB64: this.toBase64(encryptedKeyBuffer)
    };
  }

  /**
   * Encrypt a JS object using the provided single-use AES key.
   * Format: "<iv_b64>:<authTag_b64>:<ciphertext_b64>"
   */
  async encryptPayload(data: any, aesKey: CryptoKey): Promise<string> {
    const iv        = crypto.getRandomValues(new Uint8Array(this.ivLength));
    const plaintext = new TextEncoder().encode(JSON.stringify(data));

    // SubtleCrypto AES-GCM appends the 16-byte auth tag at the end of the output buffer
    const ciphertextWithTag = await crypto.subtle.encrypt(
      { name: this.aesAlgorithm, iv, tagLength: this.tagLength }, aesKey, plaintext
    );

    const ciphertextBytes = new Uint8Array(ciphertextWithTag, 0, ciphertextWithTag.byteLength - 16);
    const authTagBytes    = new Uint8Array(ciphertextWithTag, ciphertextWithTag.byteLength - 16);

    return `${this.toBase64(iv)}:${this.toBase64(authTagBytes)}:${this.toBase64(ciphertextBytes)}`;
  }

  /**
   * Decrypt a wire string back to a JS value using the provided single-use AES key.
   */
  async decryptPayload(encryptedStr: string, aesKey: CryptoKey): Promise<any> {
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
      { name: this.aesAlgorithm, iv: iv as any, tagLength: this.tagLength }, aesKey, combined as any
    );
    return JSON.parse(new TextDecoder().decode(plaintextBuf));
  }
}
