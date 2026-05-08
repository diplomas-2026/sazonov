package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.DocumentType;
import java.time.Instant;

public record ApplicationDocumentResponse(
    Long id,
    DocumentType type,
    String fileName,
    String contentType,
    long size,
    Instant uploadedAt
) {
}
