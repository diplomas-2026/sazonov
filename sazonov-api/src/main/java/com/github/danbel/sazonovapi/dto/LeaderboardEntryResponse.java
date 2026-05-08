package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.ApplicationStatus;

public record LeaderboardEntryResponse(
    Long applicationId,
    Long applicantId,
    String fullName,
    String username,
    Integer points,
    Integer rank,
    boolean budgetPlace,
    ApplicationStatus status,
    String graduationSchool,
    Integer graduationYear
) {
}
