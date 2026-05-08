package com.github.danbel.sazonovapi.dto;

import com.github.danbel.sazonovapi.domain.ApplicationStatus;
import java.math.BigDecimal;

public record LeaderboardEntryResponse(
    Long applicationId,
    Long applicantId,
    String fullName,
    String username,
    BigDecimal points,
    Integer rank,
    boolean budgetPlace,
    ApplicationStatus status,
    String graduationSchool,
    Integer graduationYear
) {
}
