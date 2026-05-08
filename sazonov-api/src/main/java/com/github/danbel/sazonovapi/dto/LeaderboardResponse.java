package com.github.danbel.sazonovapi.dto;

import java.util.List;

public record LeaderboardResponse(
    List<SpecialityLeaderboardResponse> specialities
) {
}
