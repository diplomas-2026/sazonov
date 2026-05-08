package com.github.danbel.sazonovapi.dto;

import jakarta.validation.constraints.NotBlank;

public record DepartmentUpsertRequest(
    @NotBlank String code,
    @NotBlank String name,
    String description
) {
}
