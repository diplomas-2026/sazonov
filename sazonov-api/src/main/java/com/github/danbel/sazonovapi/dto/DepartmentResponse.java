package com.github.danbel.sazonovapi.dto;

import java.time.Instant;

public record DepartmentResponse(
    Long id,
    String code,
    String name,
    String description,
    Instant createdAt
) {
}
