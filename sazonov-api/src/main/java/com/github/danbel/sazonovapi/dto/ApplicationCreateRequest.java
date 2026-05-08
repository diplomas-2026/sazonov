package com.github.danbel.sazonovapi.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import java.math.BigDecimal;

public record ApplicationCreateRequest(
    @NotNull Long specialityId,
    @NotBlank String passportSeries,
    @NotBlank String passportNumber,
    @NotBlank String snils,
    @NotBlank String educationDocumentNumber,
    @NotBlank String graduationSchool,
    @NotNull Integer graduationYear,
    @NotNull
    @DecimalMin(value = "2.0")
    @DecimalMax(value = "5.0")
    @Digits(integer = 1, fraction = 2)
    BigDecimal points,
    String applicantComment
) {
}
