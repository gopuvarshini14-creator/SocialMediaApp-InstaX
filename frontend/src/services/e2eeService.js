/**
 * End-to-End Encryption Service
 * Uses Web Crypto API for RSA-OAEP encryption
 * 
 * How it works:
 * 1. Each user generates a public/private key pair
 * 2. Public keys are stored on the server
 * 3. Private keys are stored locally (never sent to server)
 * 4. Messages are encrypted with recipient's public key
 * 5. Only recipient's private key can decrypt the message
 */

class E2EEService {
    constructor() {
        this.keyPair = null;
        this.publicKeysCache = new Map();
    }

    /**
     * Generate RSA key pair for the user
     */
    async generateKeyPair() {
        try {
            const keyPair = await window.crypto.subtle.generateKey(
                {
                    name: 'RSA-OAEP',
                    modulusLength: 2048,
                    publicExponent: new Uint8Array([1, 0, 1]),
                    hash: 'SHA-256',
                },
                true, // extractable
                ['encrypt', 'decrypt']
            );

            this.keyPair = keyPair;
            return keyPair;
        } catch (error) {
            console.error('Error generating key pair:', error);
            throw error;
        }
    }

    /**
     * Export public key to base64 string for storage
     */
    async exportPublicKey(publicKey) {
        try {
            const exported = await window.crypto.subtle.exportKey('spki', publicKey);
            const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported));
            return btoa(exportedAsString);
        } catch (error) {
            console.error('Error exporting public key:', error);
            throw error;
        }
    }

    /**
     * Import public key from base64 string
     */
    async importPublicKey(base64Key) {
        try {
            const binaryString = atob(base64Key);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return await window.crypto.subtle.importKey(
                'spki',
                bytes,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256',
                },
                true,
                ['encrypt']
            );
        } catch (error) {
            console.error('Error importing public key:', error);
            throw error;
        }
    }

    /**
     * Export private key to base64 string for local storage
     */
    async exportPrivateKey(privateKey) {
        try {
            const exported = await window.crypto.subtle.exportKey('pkcs8', privateKey);
            const exportedAsString = String.fromCharCode.apply(null, new Uint8Array(exported));
            return btoa(exportedAsString);
        } catch (error) {
            console.error('Error exporting private key:', error);
            throw error;
        }
    }

    /**
     * Import private key from base64 string
     */
    async importPrivateKey(base64Key) {
        try {
            const binaryString = atob(base64Key);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            return await window.crypto.subtle.importKey(
                'pkcs8',
                bytes,
                {
                    name: 'RSA-OAEP',
                    hash: 'SHA-256',
                },
                true,
                ['decrypt']
            );
        } catch (error) {
            console.error('Error importing private key:', error);
            throw error;
        }
    }

    /**
     * Save keys to localStorage
     */
    async saveKeysToLocalStorage(userId) {
        try {
            const publicKeyBase64 = await this.exportPublicKey(this.keyPair.publicKey);
            const privateKeyBase64 = await this.exportPrivateKey(this.keyPair.privateKey);

            localStorage.setItem(`e2ee_public_key_${userId}`, publicKeyBase64);
            localStorage.setItem(`e2ee_private_key_${userId}`, privateKeyBase64);

            return publicKeyBase64;
        } catch (error) {
            console.error('Error saving keys to localStorage:', error);
            throw error;
        }
    }

    /**
     * Load keys from localStorage
     */
    async loadKeysFromLocalStorage(userId) {
        try {
            const publicKeyBase64 = localStorage.getItem(`e2ee_public_key_${userId}`);
            const privateKeyBase64 = localStorage.getItem(`e2ee_private_key_${userId}`);

            if (!publicKeyBase64 || !privateKeyBase64) {
                return null;
            }

            const publicKey = await this.importPublicKey(publicKeyBase64);
            const privateKey = await this.importPrivateKey(privateKeyBase64);

            this.keyPair = { publicKey, privateKey };
            return this.keyPair;
        } catch (error) {
            console.error('Error loading keys from localStorage:', error);
            return null;
        }
    }

    /**
     * Initialize E2EE for a user
     */
    async initializeForUser(userId) {
        try {
            // Try to load existing keys
            const existingKeys = await this.loadKeysFromLocalStorage(userId);

            if (existingKeys) {
                console.log('✅ Loaded existing E2EE keys');
                return await this.exportPublicKey(existingKeys.publicKey);
            }

            // Generate new keys if none exist
            console.log('🔑 Generating new E2EE keys...');
            await this.generateKeyPair();
            const publicKeyBase64 = await this.saveKeysToLocalStorage(userId);
            console.log('✅ E2EE keys generated and saved');

            return publicKeyBase64;
        } catch (error) {
            console.error('Error initializing E2EE:', error);
            throw error;
        }
    }

    /**
     * Encrypt a message with recipient's public key
     */
    async encryptMessage(message, recipientPublicKeyBase64) {
        try {
            // Import recipient's public key
            const recipientPublicKey = await this.importPublicKey(recipientPublicKeyBase64);

            // Convert message to ArrayBuffer
            const encoder = new TextEncoder();
            const data = encoder.encode(message);

            // Encrypt the message
            const encrypted = await window.crypto.subtle.encrypt(
                {
                    name: 'RSA-OAEP',
                },
                recipientPublicKey,
                data
            );

            // Convert to base64 for transmission
            const encryptedArray = new Uint8Array(encrypted);
            const encryptedString = String.fromCharCode.apply(null, encryptedArray);
            return btoa(encryptedString);
        } catch (error) {
            console.error('Error encrypting message:', error);
            throw error;
        }
    }

    /**
     * Decrypt a message with user's private key
     */
    async decryptMessage(encryptedMessageBase64) {
        try {
            if (!this.keyPair || !this.keyPair.privateKey) {
                throw new Error('Private key not available');
            }

            // Convert from base64
            const binaryString = atob(encryptedMessageBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Decrypt the message
            const decrypted = await window.crypto.subtle.decrypt(
                {
                    name: 'RSA-OAEP',
                },
                this.keyPair.privateKey,
                bytes
            );

            // Convert back to string
            const decoder = new TextDecoder();
            return decoder.decode(decrypted);
        } catch (error) {
            console.error('Error decrypting message:', error);
            return '[🔒 Unable to decrypt message]';
        }
    }

    /**
     * Get recipient's public key (with caching)
     */
    async getRecipientPublicKey(recipientId, fetchFunction) {
        // Check cache first
        if (this.publicKeysCache.has(recipientId)) {
            return this.publicKeysCache.get(recipientId);
        }

        // Fetch from server
        const publicKey = await fetchFunction(recipientId);

        // Cache it
        this.publicKeysCache.set(recipientId, publicKey);

        return publicKey;
    }

    /**
     * Clear cached public keys
     */
    clearPublicKeyCache() {
        this.publicKeysCache.clear();
    }

    /**
     * Check if E2EE is available in this browser
     */
    static isSupported() {
        return !!(window.crypto && window.crypto.subtle);
    }

    /**
     * Delete keys for a user (logout)
     */
    deleteKeys(userId) {
        localStorage.removeItem(`e2ee_public_key_${userId}`);
        localStorage.removeItem(`e2ee_private_key_${userId}`);
        this.keyPair = null;
        this.clearPublicKeyCache();
    }
}

// Export singleton instance
const e2eeService = new E2EEService();
export default e2eeService;
