package com.github.danbel.sazonovapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record ApplicationCreateRequest(
    @NotNull Long specialityId,
    @NotBlank String passportSeries,
    @NotBlank String passportNumber,
    @NotBlank String snils,
    @NotBlank String educationDocumentNumber,
    @NotBlank String graduationSchool,
    @NotNull Integer graduationYear,
    @NotNull @Min(0) @PositiveOrZero Integer points,
    String applicantComment
) {
}
