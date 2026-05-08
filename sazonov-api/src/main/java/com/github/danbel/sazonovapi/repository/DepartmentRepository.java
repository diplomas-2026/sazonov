package com.github.danbel.sazonovapi.repository;

import com.github.danbel.sazonovapi.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartmentRepository extends JpaRepository<Department, Long> {
}
