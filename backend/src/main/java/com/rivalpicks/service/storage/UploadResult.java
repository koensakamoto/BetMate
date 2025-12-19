package com.rivalpicks.service.storage;

/**
 * Result of a file upload operation.
 *
 * @param storedValue The value to store in the database.
 *                    For local: relative URL like "/api/files/profile-pictures/file.jpg"
 *                    For R2 public: full URL like "https://pub-xxx.r2.dev/profiles/file.jpg"
 *                    For R2 private: object key like "private:groups/42/file.jpg"
 * @param displayUrl The URL that can be immediately displayed (may differ from storedValue for private files)
 */
public record UploadResult(String storedValue, String displayUrl) {
}
