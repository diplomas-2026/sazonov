package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.ApplicationStatus;
import jakarta.validation.constraints.NotNull;

public record ApplicationStatusUpdateRequest(
    @NotNull ApplicationStatus status,
    String staffComment
) {
}
