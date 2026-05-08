package com.github.danbel.sazonovapi.dto;

import java.time.Instant;

public record SpecialityResponse(
    Long id,
    DepartmentResponse department,
    String code,
    String name,
    String description,
    Integer budgetPlaces,
    Integer paidPlaces,
    Integer admissionPlan,
    Instant createdAt
) {
}
