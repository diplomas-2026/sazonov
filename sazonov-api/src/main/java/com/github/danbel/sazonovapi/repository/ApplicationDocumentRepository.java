package com.github.danbel.sazonovapi.repository;

import com.github.danbel.sazonovapi.domain.ApplicationDocument;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ApplicationDocumentRepository extends JpaRepository<ApplicationDocument, Long> {

    List<ApplicationDocument> findByApplicationIdOrderByUploadedAtDesc(Long applicationId);
}
