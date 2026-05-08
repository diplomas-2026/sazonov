package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.Department;
import com.github.danbel.sazonovapi.dto.DepartmentUpsertRequest;
import com.github.danbel.sazonovapi.repository.DepartmentRepository;
import com.github.danbel.sazonovapi.repository.SpecialityRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final SpecialityRepository specialityRepository;

    public List<Department> list() {
        return departmentRepository.findAll().stream()
            .sorted((a, b) -> a.getCode().compareToIgnoreCase(b.getCode()))
            .toList();
    }

    public Department create(DepartmentUpsertRequest request) {
        Department department = new Department();
        apply(department, request);
        return departmentRepository.save(department);
    }

    public Department update(Long id, DepartmentUpsertRequest request) {
        Department department = departmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Отделение не найдено"));
        apply(department, request);
        return departmentRepository.save(department);
    }

    public void delete(Long id) {
        if (specialityRepository.countByDepartmentId(id) > 0) {
            throw new IllegalStateException("Нельзя удалить отделение, пока к нему привязаны специальности");
        }
        departmentRepository.deleteById(id);
    }

    public Department get(Long id) {
        return departmentRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Отделение не найдено"));
    }

    private void apply(Department department, DepartmentUpsertRequest request) {
        department.setCode(request.code());
        department.setName(request.name());
        department.setDescription(request.description());
    }
}
