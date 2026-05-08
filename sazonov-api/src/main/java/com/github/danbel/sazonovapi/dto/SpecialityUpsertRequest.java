package com.github.danbel.sazonovapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record SpecialityUpsertRequest(
    @NotNull Long departmentId,
    @NotBlank String code,
    @NotBlank String name,
    String description,
    @NotNull @Min(0) @PositiveOrZero Integer budgetPlaces,
    @NotNull @Min(0) @PositiveOrZero Integer paidPlaces,
    @NotNull @Min(0) @PositiveOrZero Integer admissionPlan
) {
}
