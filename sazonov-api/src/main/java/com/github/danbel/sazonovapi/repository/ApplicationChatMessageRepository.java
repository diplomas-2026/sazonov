package com.github.danbel.sazonovapi.repository;

import com.github.danbel.sazonovapi.domain.ApplicationChatMessage;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationChatMessageRepository extends JpaRepository<ApplicationChatMessage, Long> {

    List<ApplicationChatMessage> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);

    Optional<ApplicationChatMessage> findTopByApplicationIdOrderByCreatedAtDesc(Long applicationId);
}
