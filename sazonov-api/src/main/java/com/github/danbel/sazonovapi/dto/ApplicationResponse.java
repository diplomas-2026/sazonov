package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.ApplicationStatus;
import java.time.Instant;
import java.util.List;

public record ApplicationResponse(
    Long id,
    UserResponse applicant,
    SpecialityResponse speciality,
    ApplicationStatus status,
    String passportSeries,
    String passportNumber,
    String snils,
    String educationDocumentNumber,
    String graduationSchool,
    Integer graduationYear,
    Integer points,
    String applicantComment,
    String staffComment,
    Instant createdAt,
    Instant updatedAt,
    List<ApplicationDocumentResponse> documents
) {
}
